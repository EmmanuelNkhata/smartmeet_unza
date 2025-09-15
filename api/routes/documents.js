const express = require('express');
const { check } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
  uploadDocument,
  getDocuments,
  getDocument,
  downloadDocument,
  updateDocument,
  deleteDocument
} = require('../controllers/documentController');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Allow only specific file types
    const allowedFileTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/gif'
    ];

    if (allowedFileTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only documents, PDFs, and images are allowed.'));
    }
  }
});

// All routes are now public

// @route   POST /api/v1/documents
// @desc    Upload a new document
// @access  Private
router.post(
  '/',
  upload.single('document'),
  [
    check('title', 'Title is required').not().isEmpty(),
    check('meetingId', 'Meeting ID is required if document is associated with a meeting')
      .if((value, { req }) => req.body.meetingId)
      .isString(),
    check('isPublic', 'isPublic must be a boolean').optional().isBoolean()
  ],
  uploadDocument
);

// @route   GET /api/v1/documents
// @desc    Get all documents (with filtering)
// @access  Private
router.get('/', getDocuments);

// @route   GET /api/v1/documents/:id
// @desc    Get document by ID
// @access  Private
router.get('/:id', getDocument);

// @route   GET /api/v1/documents/:id/download
// @desc    Download a document
// @access  Private
router.get('/:id/download', downloadDocument);

// @route   PUT /api/v1/documents/:id
// @desc    Update document metadata
// @access  Private
router.put(
  '/:id',
  [
    check('title', 'Title cannot be empty').optional().not().isEmpty(),
    check('description', 'Description must be a string').optional().isString(),
    check('isPublic', 'isPublic must be a boolean').optional().isBoolean()
  ],
  updateDocument
);

// @route   DELETE /api/v1/documents/:id
// @desc    Delete a document
// @access  Private
delete('/:id', deleteDocument);

module.exports = router;
