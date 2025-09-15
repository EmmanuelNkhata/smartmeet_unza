# SmartMeet UNZA

A comprehensive meeting management system for the University of Zambia, designed to streamline the process of scheduling and managing meetings, room bookings, and virtual conferences.

## Features

- **User Authentication**
  - Role-based access control (Admin, Staff, Student)
  - Secure login/logout
  - Password reset functionality

- **Admin Dashboard**
  - Manage users and permissions
  - Monitor system usage
  - Generate reports

- **Meeting Management**
  - Schedule and manage meetings
  - Book meeting rooms
  - Join virtual meetings
  - Set up recurring meetings

- **User Interface**
  - Responsive design
  - Intuitive navigation
  - Real-time updates

## Project Structure

```
smartmeet-unza/
├── public/                 # Static files
│   ├── css/               # Compiled CSS
│   ├── js/                # Compiled JavaScript
│   └── images/            # Images and icons
├── src/
│   ├── admin/             # Admin interface components
│   ├── auth/              # Authentication components
│   ├── user-ui/           # User interface components
│   └── shared/            # Shared components and utilities
├── smartmeet-unza-backend/ # Backend server code
│   ├── data/              # Database files
│   └── server.js          # Main server file
├── .gitignore             # Git ignore file
├── package.json           # Project dependencies
├── webpack.config.js      # Webpack configuration
└── README.md              # This file
```

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

## Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd smartmeet-unza
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd smartmeet-unza-backend
   npm install
   cd ..
   ```

3. **Start the development server**
   ```bash
   # Start the backend server
   cd smartmeet-unza-backend
   node server.js
   
   # In a new terminal, start the frontend development server
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

## Available Scripts

- `npm start` - Start the production server
- `npm run dev` - Start the development server with hot-reload
- `npm run build` - Build the application for production
- `npm test` - Run tests

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
NODE_ENV=development
PORT=3001
JWT_SECRET=your_jwt_secret_here
```

## Contributing

1. Fork the repository
2. Create a new branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- University of Zambia for the opportunity to develop this project
- All contributors who have helped in the development process
