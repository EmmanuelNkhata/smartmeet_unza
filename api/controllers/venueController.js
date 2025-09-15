const { query, get, run } = require('../config/db');
const { ApiError } = require('../middleware/error');

// @desc    Get all venues
// @route   GET /api/v1/venues
// @access  Private
const getVenues = async (req, res, next) => {
    try {
        const { isActive, minCapacity, search } = req.query;
        
        let queryStr = 'SELECT * FROM venues WHERE 1=1';
        const queryParams = [];
        
        if (isActive === 'true' || isActive === 'false') {
            queryStr += ' AND is_active = ?';
            queryParams.push(isActive === 'true' ? 1 : 0);
        }
        
        if (minCapacity) {
            queryStr += ' AND capacity >= ?';
            queryParams.push(parseInt(minCapacity));
        }
        
        if (search) {
            queryStr += ' AND (name LIKE ? OR location LIKE ?)';
            const searchTerm = `%${search}%`;
            queryParams.push(searchTerm, searchTerm);
        }
        
        queryStr += ' ORDER BY name';
        
        const venues = await query(queryStr, queryParams);
        
        res.status(200).json({
            success: true,
            count: venues.length,
            data: venues
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single venue by ID
// @route   GET /api/v1/venues/:id
// @access  Private
const getVenue = async (req, res, next) => {
    try {
        const venue = await get('SELECT * FROM venues WHERE venue_id = ?', [req.params.id]);
        
        if (!venue) {
            throw new ApiError(404, 'Venue not found');
        }
        
        // Get upcoming meetings for this venue
        const upcomingMeetings = await query(
            `SELECT meeting_id, title, start_time, end_time 
             FROM meetings 
             WHERE venue_id = ? 
             AND status = 'scheduled' 
             AND start_time > CURRENT_TIMESTAMP
             ORDER BY start_time`,
            [req.params.id]
        );
        
        res.status(200).json({
            success: true,
            data: {
                ...venue,
                upcoming_meetings: upcomingMeetings
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create a new venue (admin only)
// @route   POST /api/v1/venues
// @access  Private/Admin
const createVenue = async (req, res, next) => {
    const { name, location, capacity, facilities = [] } = req.body;
    
    try {
        // Check if venue with same name already exists
        const existingVenue = await get('SELECT * FROM venues WHERE name = ?', [name]);
        
        if (existingVenue) {
            throw new ApiError(400, 'A venue with this name already exists');
        }
        
        // Create venue
        const venueId = `venue_${Date.now()}`;
        
        await run(
            'INSERT INTO venues (venue_id, name, location, capacity, facilities, is_active) VALUES (?, ?, ?, ?, ?, ?)',
            [venueId, name, location, capacity, JSON.stringify(facilities), 1]
        );
        
        const newVenue = await get('SELECT * FROM venues WHERE venue_id = ?', [venueId]);
        
        res.status(201).json({
            success: true,
            data: newVenue
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update venue (admin only)
// @route   PUT /api/v1/venues/:id
// @access  Private/Admin
const updateVenue = async (req, res, next) => {
    const { id } = req.params;
    const updates = req.body;
    
    try {
        // Check if venue exists
        const venue = await get('SELECT * FROM venues WHERE venue_id = ?', [id]);
        
        if (!venue) {
            throw new ApiError(404, 'Venue not found');
        }
        
        // Build update query
        const updateFields = [];
        const updateValues = [];
        
        // List of allowed fields to update
        const allowedFields = ['name', 'location', 'capacity', 'facilities', 'is_active'];
        
        allowedFields.forEach(field => {
            if (updates[field] !== undefined) {
                // Special handling for facilities array
                if (field === 'facilities' && Array.isArray(updates[field])) {
                    updateFields.push(`${field} = ?`);
                    updateValues.push(JSON.stringify(updates[field]));
                } else {
                    updateFields.push(`${field} = ?`);
                    updateValues.push(updates[field]);
                }
            }
        });
        
        if (updateFields.length === 0) {
            throw new ApiError(400, 'No valid fields to update');
        }
        
        // Add updated_at
        updateFields.push('updated_at = CURRENT_TIMESTAMP');
        
        // Execute update
        const updateQuery = `
            UPDATE venues 
            SET ${updateFields.join(', ')}
            WHERE venue_id = ?
        `;
        
        await run(updateQuery, [...updateValues, id]);
        
        // Get updated venue
        const updatedVenue = await get('SELECT * FROM venues WHERE venue_id = ?', [id]);
        
        res.status(200).json({
            success: true,
            data: updatedVenue
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete venue (admin only)
// @route   DELETE /api/v1/venues/:id
// @access  Private/Admin
const deleteVenue = async (req, res, next) => {
    const { id } = req.params;
    
    try {
        // Check if venue exists
        const venue = await get('SELECT * FROM venues WHERE venue_id = ?', [id]);
        
        if (!venue) {
            throw new ApiError(404, 'Venue not found');
        }
        
        // Check if venue has any upcoming meetings
        const upcomingMeetings = await get(
            `SELECT COUNT(*) as count 
             FROM meetings 
             WHERE venue_id = ? 
             AND status = 'scheduled' 
             AND start_time > CURRENT_TIMESTAMP`,
            [id]
        );
        
        if (upcomingMeetings.count > 0) {
            throw new ApiError(400, 'Cannot delete venue with upcoming scheduled meetings');
        }
        
        // Soft delete by marking as inactive
        await run(
            'UPDATE venues SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE venue_id = ?',
            [id]
        );
        
        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get available venues for a time period
// @route   GET /api/v1/venues/available
// @access  Private
const getVenueAvailability = async (req, res, next) => {
    const { startTime, endTime, capacity } = req.query;
    
    try {
        // Validate time range
        const start = new Date(startTime);
        const end = new Date(endTime);
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            throw new ApiError(400, 'Invalid date format. Please use ISO 8601 format (e.g., 2023-01-01T09:00:00Z)');
        }
        
        if (start >= end) {
            throw new ApiError(400, 'End time must be after start time');
        }
        
        // Build query to find available venues
        let queryStr = `
            SELECT v.*
            FROM venues v
            WHERE v.is_active = 1
        `;
        
        const queryParams = [];
        
        // Filter by capacity if provided
        if (capacity) {
            queryStr += ' AND v.capacity >= ?';
            queryParams.push(parseInt(capacity));
        }
        
        // Exclude venues with scheduling conflicts
        queryStr += `
            AND NOT EXISTS (
                SELECT 1 FROM meetings m
                WHERE m.venue_id = v.venue_id
                AND m.status != 'cancelled'
                AND (
                    (m.start_time < ? AND m.end_time > ?) OR
                    (m.start_time >= ? AND m.start_time < ?) OR
                    (m.end_time > ? AND m.end_time <= ?)
                )
            )
            ORDER BY v.capacity
        `;
        
        // Add time parameters for the conflict check
        queryParams.push(endTime, startTime, startTime, endTime, startTime, endTime);
        
        const availableVenues = await query(queryStr, queryParams);
        
        res.status(200).json({
            success: true,
            count: availableVenues.length,
            data: availableVenues
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getVenues,
    getVenue,
    createVenue,
    updateVenue,
    deleteVenue,
    getVenueAvailability
};
