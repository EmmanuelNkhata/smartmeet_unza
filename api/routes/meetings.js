const express = require('express');
const { check } = require('express-validator');
const {
  createMeeting,
  getMeetings,
  getMeeting,
  updateMeeting,
  deleteMeeting,
  updateParticipantStatus,
  recordAttendance,
  getMeetingParticipants,
  addMeetingParticipants,
  removeMeetingParticipant
} = require('../controllers/meetingController');

const router = express.Router();

// All routes are now public

// @route   POST /api/v1/meetings
// @desc    Create a new meeting
// @access  Private
router.post(
  '/',
  [
    check('title', 'Title is required').not().isEmpty(),
    check('startTime', 'Start time is required').isISO8601(),
    check('endTime', 'End time is required').isISO8601(),
    check('meetingType', 'Meeting type is required and must be one of: in_person, virtual, hybrid')
      .isIn(['in_person', 'virtual', 'hybrid']),
    check('participantIds', 'Participant IDs must be an array').optional().isArray()
  ],
  createMeeting
);

// @route   GET /api/v1/meetings
// @desc    Get all meetings (with filtering)
// @access  Private
router.get('/', getMeetings);

// @route   GET /api/v1/meetings/:id
// @desc    Get single meeting by ID
// @access  Private
router.get('/:id', getMeeting);

// @route   PUT /api/v1/meetings/:id
// @desc    Update meeting
// @access  Private
router.put('/:id', updateMeeting);

// @route   DELETE /api/v1/meetings/:id
// @desc    Delete meeting
// @access  Private
router.delete('/:id', deleteMeeting);

// @route   PUT /api/v1/meetings/:id/participants/me
// @desc    Update participant status (accept/decline/tentative)
// @access  Private
router.put(
  '/:id/participants/me',
  [
    check('status', 'Status is required and must be one of: accepted, declined, tentative')
      .isIn(['accepted', 'declined', 'tentative'])
  ],
  updateParticipantStatus
);

// @route   GET /api/v1/meetings/:id/participants
// @desc    Get all participants for a meeting
// @access  Private
router.get('/:id/participants', getMeetingParticipants);

// @route   POST /api/v1/meetings/:id/participants
// @desc    Add participants to a meeting
// @access  Private
router.post(
  '/:id/participants',
  [
    check('userIds', 'User IDs must be an array with at least one ID').isArray({ min: 1 })
  ],
  addMeetingParticipants
);

// @route   DELETE /api/v1/meetings/:meetingId/participants/:userId
// @desc    Remove participant from meeting
// @access  Private
router.delete('/:meetingId/participants/:userId', removeMeetingParticipant);

// @route   POST /api/v1/meetings/:id/attendance
// @desc    Record attendance for meeting participants
// @access  Private
router.post(
  '/:id/attendance',
  [
    check('attendees', 'Attendees must be an array').isArray(),
    check('attendees.*.userId', 'User ID is required for each attendee').exists(),
    check('attendees.*.attended', 'Attendance status is required for each attendee').isBoolean()
  ],
  recordAttendance
);

module.exports = router;
