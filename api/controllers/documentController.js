const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { query, get, run, transaction } = require('../config/db');
const { ApiError } = require('../middleware/error');

// Configure upload directory (create if it doesn't exist)
const UPLOAD_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Allowed file types and their MIME types
const ALLOWED_FILE_TYPES = {
    'application/pdf': 'pdf',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/vnd.ms-powerpoint': 'ppt',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
    'application/vnd.ms-excel': 'xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'text/plain': 'txt',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif'
};

// Maximum file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// @desc    Upload a document
// @route   POST /api/v1/documents
// @access  Private
const uploadDocument = async (req, res, next) => {
    if (!req.files || !req.files.document) {
        return next(new ApiError(400, 'No file uploaded'));
    }

    const document = req.files.document;
    const { meetingId, title, description, isPublic = true } = req.body;
    const userId = 'public_user'; // Default user ID for unauthenticated access

    try {
        // Validate required fields
        if (!title) {
            throw new ApiError(400, 'Title is required');
        }

        // Validate file type
        if (!ALLOWED_FILE_TYPES[document.mimetype]) {
            throw new ApiError(400, 'Invalid file type. Allowed types: ' + Object.values(ALLOWED_FILE_TYPES).join(', '));
        }

        // Validate file size
        if (document.size > MAX_FILE_SIZE) {
            throw new ApiError(400, `File size too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
        }

        // If meetingId is provided, verify the meeting exists and user is a participant or organizer
        if (meetingId) {
            const meeting = await get(
                `SELECT m.* FROM meetings m
                 LEFT JOIN meeting_participants mp ON m.meeting_id = mp.meeting_id
                 WHERE m.meeting_id = ? AND (m.organizer_id = ? OR mp.user_id = ?)`,
                [meetingId, userId, userId]
            );

            if (!meeting) {
                throw new ApiError(403, 'Not authorized to upload documents for this meeting');
            }
        }

        // Generate unique filename
        const fileExt = ALLOWED_FILE_TYPES[document.mimetype];
        const fileName = `${uuidv4()}.${fileExt}`;
        const filePath = path.join(UPLOAD_DIR, fileName);

        // Save file to disk
        await document.mv(filePath);

        // Save document metadata to database
        const documentId = `doc_${Date.now()}`;
        await run(
            `INSERT INTO documents 
             (document_id, meeting_id, user_id, title, description, file_name, file_path, file_type, file_size, is_public)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                documentId,
                meetingId || null,
                userId,
                title,
                description || null,
                document.name,
                filePath,
                document.mimetype,
                document.size,
                isPublic ? 1 : 0
            ]
        );

        // Log the upload
        await logDocumentAccess(documentId, userId, 'upload');

        // Get the created document
        const createdDoc = await getDocumentById(documentId, userId);

        res.status(201).json({
            success: true,
            data: createdDoc
        });

    } catch (error) {
        // Clean up file if there was an error
        if (req.files?.document?.tempFilePath && fs.existsSync(req.files.document.tempFilePath)) {
            fs.unlinkSync(req.files.document.tempFilePath);
        }
        next(error);
    }
};

// @desc    Get all documents (with filtering)
// @route   GET /api/v1/documents
// @access  Private
const getDocuments = async (req, res, next) => {
    const { 
        meetingId, 
        userId, 
        isPublic, 
        fileType, 
        search, 
        page = 1, 
        limit = 10 
    } = req.query;

    try {
        // Build the base query
        let queryStr = `
            SELECT d.*, 
                   u.first_name || ' ' || u.last_name as uploader_name,
                   m.title as meeting_title
            FROM documents d
            LEFT JOIN users u ON d.user_id = u.user_id
            LEFT JOIN meetings m ON d.meeting_id = m.meeting_id
            WHERE 1=1
        `;
        
        const queryParams = [];
        
        // Add filters
        if (meetingId) {
            queryStr += ' AND d.meeting_id = ?';
            queryParams.push(meetingId);
        }
        
        if (userId) {
            queryStr += ' AND d.user_id = ?';
            queryParams.push(userId);
        }
        
        if (isPublic === 'true') {
            queryStr += ' AND d.is_public = 1';
        } else if (isPublic === 'false') {
            queryStr += ' AND d.is_public = 0';
        }
        
        if (fileType) {
            queryStr += ' AND d.file_type LIKE ?';
            queryParams.push(`%${fileType}%`);
        }
        
        if (search) {
            queryStr += ' AND (d.title LIKE ? OR d.description LIKE ?)';
            const searchTerm = `%${search}%`;
            queryParams.push(searchTerm, searchTerm);
        }
        
        // Add access control - user can see their own documents, public documents, or documents from meetings they're part of
        queryStr += ` AND (
            d.user_id = ? OR 
            d.is_public = 1 OR
            EXISTS (
                SELECT 1 FROM meeting_participants mp 
                JOIN meetings m ON mp.meeting_id = m.meeting_id 
                WHERE m.meeting_id = d.meeting_id AND mp.user_id = ?
            )
        )`;
        queryParams.push(req.user.user_id, req.user.user_id);
        
        // Get total count for pagination
        const countQuery = `SELECT COUNT(*) as total FROM (${queryStr})`;
        const countResult = await get(countQuery, queryParams);
        const total = countResult ? countResult.total : 0;
        
        // Add sorting and pagination
        queryStr += ' ORDER BY d.created_at DESC';
        queryStr += ' LIMIT ? OFFSET ?';
        
        const offset = (page - 1) * limit;
        queryParams.push(limit, offset);
        
        // Execute the query
        const documents = await query(queryStr, queryParams);
        
        // Log access for each document
        await Promise.all(
            documents.map(doc => 
                logDocumentAccess(doc.document_id, req.user.user_id, 'view')
            )
        );
        
        // Remove file_path from response for security
        const sanitizedDocs = documents.map(({ file_path, ...doc }) => ({
            ...doc,
            download_url: `/api/v1/documents/${doc.document_id}/download`
        }));
        
        res.status(200).json({
            success: true,
            count: sanitizedDocs.length,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit),
            data: sanitizedDocs
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single document
// @route   GET /api/v1/documents/:id
// @access  Private
const getDocument = async (req, res, next) => {
    const { id } = req.params;
    const userId = req.user.user_id;
    
    try {
        const document = await getDocumentById(id, userId);
        
        // Log the access
        await logDocumentAccess(id, userId, 'view');
        
        // Remove file_path from response
        const { file_path, ...sanitizedDoc } = document;
        sanitizedDoc.download_url = `/api/v1/documents/${id}/download`;
        
        res.status(200).json({
            success: true,
            data: sanitizedDoc
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Download a document
// @route   GET /api/v1/documents/:id/download
// @access  Private
const downloadDocument = async (req, res, next) => {
    const { id } = req.params;
    const userId = req.user.user_id;
    
    try {
        // Get document with access control
        const document = await getDocumentById(id, userId);
        
        // Check if file exists
        if (!fs.existsSync(document.file_path)) {
            throw new ApiError(404, 'File not found on server');
        }
        
        // Log the download
        await logDocumentAccess(id, userId, 'download');
        
        // Send the file
        res.download(document.file_path, document.file_name, (err) => {
            if (err) {
                console.error('Download error:', err);
                if (!res.headersSent) {
                    next(new ApiError(500, 'Error downloading file'));
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update document
// @route   PUT /api/v1/documents/:id
// @access  Private
const updateDocument = async (req, res, next) => {
    const { id } = req.params;
    const { title, description, isPublic } = req.body;
    const userId = req.user.user_id;
    
    try {
        // Check if document exists and user is the owner
        const document = await get('SELECT * FROM documents WHERE document_id = ?', [id]);
        
        if (!document) {
            throw new ApiError(404, 'Document not found');
        }
        
        if (document.user_id !== userId) {
            throw new ApiError(403, 'Not authorized to update this document');
        }
        
        // Build update query
        const updates = [];
        const params = [];
        
        if (title !== undefined) {
            updates.push('title = ?');
            params.push(title);
        }
        
        if (description !== undefined) {
            updates.push('description = ?');
            params.push(description);
        }
        
        if (isPublic !== undefined) {
            updates.push('is_public = ?');
            params.push(isPublic ? 1 : 0);
        }
        
        if (updates.length === 0) {
            throw new ApiError(400, 'No valid fields to update');
        }
        
        // Add updated_at
        updates.push('updated_at = CURRENT_TIMESTAMP');
        
        // Execute update
        const updateQuery = `
            UPDATE documents 
            SET ${updates.join(', ')}
            WHERE document_id = ?
        `;
        
        await run(updateQuery, [...params, id]);
        
        // Log the update
        await logDocumentAccess(id, userId, 'update');
        
        // Get updated document
        const updatedDoc = await getDocumentById(id, userId);
        
        res.status(200).json({
            success: true,
            data: updatedDoc
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete document
// @route   DELETE /api/v1/documents/:id
// @access  Private
const deleteDocument = async (req, res, next) => {
    const { id } = req.params;
    const userId = req.user.user_id;
    
    try {
        // Check if document exists and user is the owner
        const document = await get('SELECT * FROM documents WHERE document_id = ?', [id]);
        
        if (!document) {
            throw new ApiError(404, 'Document not found');
        }
        
        if (document.user_id !== userId && req.user.role !== 'admin') {
            throw new ApiError(403, 'Not authorized to delete this document');
        }
        
        // Delete the file
        if (fs.existsSync(document.file_path)) {
            fs.unlinkSync(document.file_path);
        }
        
        // Delete from database
        await run('DELETE FROM documents WHERE document_id = ?', [id]);
        
        // Log the deletion
        await logDocumentAccess(id, userId, 'delete');
        
        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        next(error);
    }
};

// Helper function to get document by ID
const getDocumentById = async (documentId) => {
    const document = await get(
        `SELECT d.*, 
                u.first_name || ' ' || u.last_name as uploader_name,
                m.title as meeting_title
         FROM documents d
         LEFT JOIN users u ON d.user_id = u.user_id
         LEFT JOIN meetings m ON d.meeting_id = m.meeting_id
         WHERE d.document_id = ?`,
        [documentId]
    );
    
    if (!document) {
        throw new ApiError(404, 'Document not found');
    }
    
    // Check access
    const hasAccess = await get(
        `SELECT 1 FROM documents d
         WHERE d.document_id = ? AND (
             d.user_id = ? OR 
             d.is_public = 1 OR
             EXISTS (
                 SELECT 1 FROM meeting_participants mp 
                 JOIN meetings m ON mp.meeting_id = m.meeting_id 
                 WHERE m.meeting_id = d.meeting_id AND mp.user_id = ?
             )
         )`,
        [documentId, userId, userId]
    );
    
    if (!hasAccess) {
        throw new ApiError(403, 'Not authorized to access this document');
    }
    
    return document;
};

// Helper function to log document access
const logDocumentAccess = async (documentId, userId, action) => {
    try {
        await run(
            `INSERT INTO document_access_logs 
             (document_id, user_id, action, ip_address, user_agent)
             VALUES (?, ?, ?, ?, ?)`,
            [
                documentId,
                userId,
                action,
                req?.ip || null,
                req?.get('user-agent') || null
            ]
        );
    } catch (error) {
        console.error('Failed to log document access:', error);
    }
};

module.exports = {
    uploadDocument,
    getDocuments,
    getDocument,
    downloadDocument,
    updateDocument,
    deleteDocument
};
