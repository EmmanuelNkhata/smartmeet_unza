import React from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Button, Card } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';

const HomePage = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="py-5 bg-light">
      <Container>
        {/* Hero Section */}
        <Row className="align-items-center py-5">
          <Col lg={6} className="mb-4 mb-lg-0">
            <h1 className="display-4 fw-bold mb-4">Smart Meet UNZA</h1>
            <p className="lead mb-4">
              Streamline your meeting scheduling and room booking process with our 
              intelligent meeting management system designed specifically for the 
              University of Zambia.
            </p>
            {!isAuthenticated ? (
              <div className="d-grid gap-2 d-sm-flex">
                <Button as={Link} to="/login" variant="primary" size="lg" className="me-2">
                  Login
                </Button>
                <Button as={Link} to="/register" variant="outline-primary" size="lg">
                  Register
                </Button>
              </div>
            ) : (
              <Button as={Link} to="/dashboard" variant="primary" size="lg">
                Go to Dashboard
              </Button>
            )}
          </Col>
          <Col lg={6}>
            <img 
              src="/assets/images/meeting-illustration.svg" 
              alt="Meeting illustration" 
              className="img-fluid"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://via.placeholder.com/600x400?text=Meeting+Illustration';
              }}
            />
          </Col>
        </Row>

        {/* Features Section */}
        <section className="py-5">
          <h2 className="text-center mb-5">Key Features</h2>
          <Row className="g-4">
            <Col md={4}>
              <Card className="h-100 shadow-sm">
                <Card.Body className="text-center p-4">
                  <div className="mb-3 text-primary">
                    <i className="bi bi-calendar-check fs-1"></i>
                  </div>
                  <h4>Easy Scheduling</h4>
                  <p className="text-muted">
                    Schedule and manage all your meetings in one place with our intuitive interface.
                  </p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="h-100 shadow-sm">
                <Card.Body className="text-center p-4">
                  <div className="mb-3 text-primary">
                    <i className="bi bi-building fs-1"></i>
                  </div>
                  <h4>Room Management</h4>
                  <p className="text-muted">
                    View and book available rooms across the UNZA campus with real-time availability.
                  </p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="h-100 shadow-sm">
                <Card.Body className="text-center p-4">
                  <div className="mb-3 text-primary">
                    <i className="bi bi-bell fs-1"></i>
                  </div>
                  <h4>Smart Notifications</h4>
                  <p className="text-muted">
                    Get timely reminders and updates about your scheduled meetings and room bookings.
                  </p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </section>

        {/* Call to Action */}
        {!isAuthenticated && (
          <section className="py-5 bg-white rounded-3 text-center">
            <h2 className="mb-4">Ready to Get Started?</h2>
            <p className="lead mb-4">
              Join SmartMeet UNZA today and experience seamless meeting management.
            </p>
            <Button as={Link} to="/register" variant="primary" size="lg">
              Create Free Account
            </Button>
          </section>
        )}
      </Container>
    </div>
  );
};

export default HomePage;
