import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Spinner, Alert } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { meetingService } from '../services/api';
import { format } from 'date-fns';

const DashboardPage = () => {
  const { user } = useAuth();
  const [upcomingMeetings, setUpcomingMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        setLoading(true);
        const today = new Date().toISOString().split('T')[0];
        const response = await meetingService.getMeetings({
          startDate: today,
          limit: 5,
          sort: 'date,time'
        });
        setUpcomingMeetings(response.data);
      } catch (err) {
        console.error('Error fetching meetings:', err);
        setError('Failed to load upcoming meetings. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchMeetings();
  }, []);

  const formatMeetingTime = (date, time) => {
    try {
      const [hours, minutes] = time.split(':');
      const meetingDate = new Date(date);
      meetingDate.setHours(parseInt(hours, 10), parseInt(minutes, 10));
      return format(meetingDate, 'EEE, MMM d, yyyy h:mm a');
    } catch (error) {
      console.error('Error formatting date:', error);
      return `${date} at ${time}`;
    }
  };

  return (
    <Container className="py-4">
      <h1 className="mb-4">Dashboard</h1>
      
      <Row className="mb-4">
        <Col md={12}>
          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title>Welcome back, {user?.name || 'User'}!</Card.Title>
              <Card.Text>
                Here's what's happening with your meetings today.
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        {/* Upcoming Meetings */}
        <Col lg={8} className="mb-4">
          <Card className="shadow-sm h-100">
            <Card.Header as="h5">Upcoming Meetings</Card.Header>
            <Card.Body>
              {loading ? (
                <div className="text-center py-4">
                  <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </Spinner>
                </div>
              ) : error ? (
                <Alert variant="danger">{error}</Alert>
              ) : upcomingMeetings.length > 0 ? (
                <div className="list-group">
                  {upcomingMeetings.map((meeting) => (
                    <div key={meeting.id} className="list-group-item list-group-item-action">
                      <div className="d-flex w-100 justify-content-between">
                        <h5 className="mb-1">{meeting.title}</h5>
                        <small className="text-muted">
                          {formatMeetingTime(meeting.date, meeting.startTime)}
                        </small>
                      </div>
                      <p className="mb-1">
                        <strong>Venue:</strong> {meeting.venue?.name || 'Not specified'}
                      </p>
                      <small className="text-muted">
                        {meeting.participants?.length || 0} participants
                      </small>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted">No upcoming meetings scheduled.</p>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Quick Actions */}
        <Col lg={4}>
          <Card className="shadow-sm mb-4">
            <Card.Header as="h5">Quick Actions</Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                <button className="btn btn-primary mb-2">
                  Schedule New Meeting
                </button>
                <button className="btn btn-outline-secondary mb-2">
                  Book a Room
                </button>
                <button className="btn btn-outline-secondary">
                  View All Meetings
                </button>
              </div>
            </Card.Body>
          </Card>

          {/* Recent Activity */}
          <Card className="shadow-sm">
            <Card.Header as="h5">Recent Activity</Card.Header>
            <Card.Body>
              <div className="activity-feed">
                <div className="activity-item mb-3">
                  <div className="d-flex">
                    <div className="me-3 text-primary">
                      <i className="bi bi-calendar-check fs-4"></i>
                    </div>
                    <div>
                      <p className="mb-0">You scheduled a meeting for tomorrow</p>
                      <small className="text-muted">2 hours ago</small>
                    </div>
                  </div>
                </div>
                <div className="activity-item mb-3">
                  <div className="d-flex">
                    <div className="me-3 text-success">
                      <i className="bi bi-building fs-4"></i>
                    </div>
                    <div>
                      <p className="mb-0">You booked Room 101 for next week</p>
                      <small className="text-muted">1 day ago</small>
                    </div>
                  </div>
                </div>
                <div className="activity-item">
                  <div className="d-flex">
                    <div className="me-3 text-info">
                      <i className="bi bi-people fs-4"></i>
                    </div>
                    <div>
                      <p className="mb-0">You were added to a new meeting</p>
                      <small className="text-muted">2 days ago</small>
                    </div>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default DashboardPage;
