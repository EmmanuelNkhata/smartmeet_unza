const express = require('express');
const { check } = require('express-validator');
const {
  getVenues,
  getVenue,
  createVenue,
  updateVenue,
  deleteVenue,
  getVenueAvailability
} = require('../controllers/venueController');
const router = express.Router();

// All routes are now public

// @route   GET /api/v1/venues
// @desc    Get all venues
// @access  Public
router.get('/', getVenues);

// @route   GET /api/v1/venues/available
// @desc    Get available venues for a time period
// @access  Private
router.get(
  '/available',
  [
    check('startTime', 'Start time is required').isISO8601(),
    check('endTime', 'End time is required').isISO8601(),
    check('capacity', 'Capacity must be a number').optional().isInt({ min: 1 })
  ],
  getVenueAvailability
);

// @route   GET /api/v1/venues/:id
// @desc    Get venue by ID
// @access  Private
router.get('/:id', getVenue);

// @route   POST /api/v1/venues
// @desc    Create a new venue (admin only)
// @access  Private/Admin
router.post(
  '/',
  [
    check('name', 'Name is required').not().isEmpty(),
    check('location', 'Location is required').not().isEmpty(),
    check('capacity', 'Capacity must be a positive number').isInt({ min: 1 }),
    check('facilities', 'Facilities must be an array').optional().isArray()
  ],
  authorize('admin'),
  createVenue
);

// @route   PUT /api/v1/venues/:id
// @desc    Update venue (admin only)
// @access  Private/Admin
router.put(
  '/:id',
  [
    check('name', 'Name cannot be empty').optional().not().isEmpty(),
    check('location', 'Location cannot be empty').optional().not().isEmpty(),
    check('capacity', 'Capacity must be a positive number').optional().isInt({ min: 1 }),
    check('isActive', 'isActive must be a boolean').optional().isBoolean()
  ],
  authorize('admin'),
  updateVenue
);

// @route   DELETE /api/v1/venues/:id
// @desc    Delete venue (admin only)
// @access  Private/Admin
router.delete('/:id', authorize('admin'), deleteVenue);

module.exports = router;
