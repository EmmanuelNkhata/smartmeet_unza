# SmartMeet UNZA

A comprehensive meeting management system for the University of Zambia, designed to streamline the process of scheduling and managing meetings, room bookings, and virtual conferences.

## ✨ Features

### 🔐 Authentication & Authorization
- **Role-based access control** (Admin, Staff, Student)
- **Secure JWT authentication** with refresh tokens
- **Password reset** functionality
- **Session management**

### 📅 Meeting Management
- **Schedule and manage meetings** with all necessary details
- **Book meeting rooms** with real-time availability
- **Virtual meeting integration** (Zoom/Google Meet)
- **Recurring meetings** with flexible scheduling options
- **Meeting notifications** via email/in-app

### 🏢 Room Management
- **View room availability** in real-time
- **Filter rooms** by capacity and amenities
- **Room booking history**
- **Room management** for administrators

### 👥 User Management (Admin)
- **User CRUD operations**
- **Role and permission management**
- **User activity monitoring**
- **Bulk user import/export**

### 📊 Dashboard & Analytics
- **Upcoming meetings** overview
- **Room utilization** statistics
- **User activity** reports
- **Exportable reports** (PDF/Excel)

### 🌐 User Interface
- **Fully responsive** design
- **Intuitive** and modern interface
- **Dark/Light mode**
- **Keyboard shortcuts**
- **Accessibility** compliant

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher) or Yarn
- MySQL (v5.7 or higher) or SQLite
- Git

### Project Structure

```
smartmeet-unza/
├── api/                    # Backend API server
│   ├── config/            # Configuration files
│   ├── controllers/       # Route controllers
│   ├── middleware/        # Custom middleware
│   ├── models/            # Database models
│   ├── routes/            # API routes
│   ├── services/          # Business logic
│   ├── utils/             # Utility functions
│   └── server.js          # Main server file
├── src/                   # Frontend source code
│   ├── assets/            # Static assets
│   │   ├── fonts/        # Font files
│   │   ├── images/       # Image assets
│   │   └── styles/       # Global styles
│   ├── components/        # Reusable UI components
│   ├── config/            # App configuration
│   ├── constants/         # App constants
│   ├── context/           # React context providers
│   ├── hooks/             # Custom React hooks
│   ├── layouts/           # Page layouts
│   ├── pages/             # Page components
│   ├── routes/            # Application routes
│   ├── services/          # API service layer
│   └── utils/             # Utility functions
├── .env.example           # Environment variables example
├── .gitignore             # Git ignore file
├── package.json           # Project dependencies
├── webpack.config.js      # Webpack configuration
└── README.md              # Project documentation
```

## 🛠 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/smartmeet-unza.git
   cd smartmeet-unza
   ```

2. **Install dependencies**
   ```bash
   # Install backend dependencies
   npm install
   
   # Install frontend dependencies
   cd src
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy the example .env file
   cp .env.example .env
   
   # Update the .env file with your configuration
   nano .env
   ```

4. **Set up the database**
   ```bash
   # Create database and run migrations
   npm run db:create
   npm run db:migrate
   
   # Seed initial data (optional)
   npm run db:seed
   ```

5. **Start the development servers**
   ```bash
   # Start backend server (from project root)
   npm run dev:server
   
   # In a new terminal, start frontend development server
   cd src
   npm start
   ```

6. **Build for production**
   ```bash
   # Build frontend assets
   cd src
   npm run build
   
   # Start production server (from project root)
   npm start
   ```

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- University of Zambia for the opportunity
- All contributors who have helped shape this project
- Open source libraries and tools used in this project

## 📧 Contact

For any questions or feedback, please contact:
- [Your Name] - your.email@unza.zm
- Project Link: [https://github.com/yourusername/smartmeet-unza](https://github.com/yourusername/smartmeet-unza)

---

<div align="center">
  Made with ❤️ for the University of Zambia
</div>

- Node.js (v14 or higher)
- npm (v6 or higher)


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
