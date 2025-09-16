import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Button, Card, Alert, Container } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../hooks/useNotification';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const result = await login(formData.email, formData.password);
      if (result.success) {
        showNotification('Login successful!', 'success');
        navigate('/dashboard');
      } else {
        showNotification(result.message || 'Login failed. Please try again.', 'error');
      }
    } catch (error) {
      showNotification('An error occurred. Please try again.', 'error');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '80vh' }}>
      <div className="w-100" style={{ maxWidth: '400px' }}>
        <Card>
          <Card.Body>
            <h2 className="text-center mb-4">Log In</h2>
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3" controlId="formBasicEmail">
                <Form.Label>Email address</Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter email"
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3" controlId="formBasicPassword">
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Password"
                  required
                />
              </Form.Group>

              <Button 
                variant="primary" 
                type="submit" 
                className="w-100"
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Log In'}
              </Button>
            </Form>
            <div className="text-center mt-3">
              <Link to="/forgot-password">Forgot password?</Link>
            </div>
          </Card.Body>
        </Card>
        <div className="text-center mt-3">
          Need an account? <Link to="/register">Sign up</Link>
        </div>
      </div>
    </Container>
  );
};

export default LoginPage;
