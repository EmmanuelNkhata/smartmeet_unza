import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';

const Footer = () => {
  return (
    <footer className="bg-dark text-white py-4 mt-4">
      <Container>
        <Row>
          <Col md={4}>
            <h5>SmartMeet UNZA</h5>
            <p className="mb-0">Efficient meeting management system for UNZA</p>
          </Col>
          <Col md={4}>
            <h5>Quick Links</h5>
            <ul className="list-unstyled">
              <li><a href="/about" className="text-white">About Us</a></li>
              <li><a href="/contact" className="text-white">Contact</a></li>
              <li><a href="/faq" className="text-white">FAQ</a></li>
            </ul>
          </Col>
          <Col md={4}>
            <h5>Contact Us</h5>
            <address>
              University of Zambia<br />
              Great East Road, Lusaka<br />
              Zambia
            </address>
          </Col>
        </Row>
        <hr className="bg-light" />
        <div className="text-center">
          <p className="mb-0">&copy; {new Date().getFullYear()} SmartMeet UNZA. All rights reserved.</p>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
