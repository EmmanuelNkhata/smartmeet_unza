import React from 'react';
import { Container } from 'react-bootstrap';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Notification from '../components/common/Notification';
import { useAuth } from '../context/AuthContext';

const Layout = ({ children }) => {
  const { user } = useAuth();

  return (
    <div className="d-flex flex-column min-vh-100">
      <Header user={user} />
      <main className="flex-grow-1 py-4">
        <Container>
          <Notification />
          {children}
        </Container>
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
