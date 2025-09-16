import React, { useEffect } from 'react';
import { Alert } from 'react-bootstrap';
import { useNotification } from '../../../hooks/useNotification';

const Notification = () => {
  const { notification, clearNotification } = useNotification();

  useEffect(() => {
    if (notification.message) {
      const timer = setTimeout(() => {
        clearNotification();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification, clearNotification]);

  if (!notification.message) return null;

  return (
    <Alert 
      variant={notification.type === 'success' ? 'success' : 'danger'} 
      onClose={clearNotification}
      dismissible
      className="mt-3"
    >
      {notification.message}
    </Alert>
  );
};

export default Notification;
