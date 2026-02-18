# College Management System API

A secure, scalable backend API for a College Management System built with Node.js, Express.js, and MongoDB.

## 🛠️ Tech Stack

- **Node.js** + **Express.js** - Server framework
- **MongoDB** + **Mongoose** - Database and ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **dotenv** - Environment variables
- **CORS** - Cross-origin resource sharing

## 📁 Project Structure

```
api/
├── src/
│   ├── config/
│   │   ├── db.js              # MongoDB connection
│   │   └── env.js              # Environment configuration
│   ├── controllers/           # Request handlers
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   ├── attendance.controller.js
│   │   ├── timetable.controller.js
│   │   ├── exam.controller.js
│   │   ├── result.controller.js
│   │   ├── assignment.controller.js
│   │   ├── notification.controller.js
│   │   ├── leaveRequest.controller.js
│   │   └── dashboard.controller.js
│   ├── models/                 # Mongoose models
│   │   ├── User.js
│   │   ├── Attendance.js
│   │   ├── TimeTable.js
│   │   ├── Notification.js
│   │   ├── Exam.js
│   │   ├── Result.js
│   │   ├── Assignment.js
│   │   └── LeaveRequest.js
│   ├── routes/                 # API routes
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── attendance.routes.js
│   │   ├── timetable.routes.js
│   │   ├── exam.routes.js
│   │   ├── result.routes.js
│   │   ├── assignment.routes.js
│   │   ├── notification.routes.js
│   │   ├── leaveRequest.routes.js
│   │   └── dashboard.routes.js
│   ├── middlewares/            # Custom middlewares
│   │   ├── auth.middleware.js
│   │   ├── role.middleware.js
│   │   ├── admin.middleware.js
│   │   └── status.middleware.js
│   ├── utils/                  # Utility functions
│   │   ├── errorHandler.js
│   │   ├── generateToken.js
│   │   └── seedAdmin.js
│   ├── app.js                  # Express app configuration
│   └── server.js               # Server entry point
├── .env.example                # Environment variables template
├── .gitignore
├── package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance like MongoDB Atlas)
- npm or yarn

### Installation

1. **Clone the repository** (if not already done)

2. **Navigate to the API directory**
   ```bash
   cd api
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Create environment file**
   ```bash
   cp .env.example .env
   ```

5. **Configure environment variables**
   Edit `.env` file with your configuration:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/cms_db
   JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
   JWT_EXPIRE=7d
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=admin123
   FRONTEND_URL=http://localhost:5173
   ```

6. **Start MongoDB**
   Make sure MongoDB is running on your system or update `MONGODB_URI` to point to your MongoDB instance.

7. **Start the server**
   ```bash
   # Development mode (with auto-reload)
   npm run dev

   # Production mode
   npm start
   ```

8. **Verify the server is running**
   Visit `http://localhost:5000/health` in your browser or use:
   ```bash
   curl http://localhost:5000/health
   ```

## 🔐 Authentication & Authorization

### Admin Authentication

- **Only ONE admin** exists (credentials from `.env`)
- Admin login endpoint: `POST /api/auth/admin/login`
- Admin has access to ALL APIs
- Admin can approve/reject user registrations

### User Authentication

- Users register with `status: pending` by default
- Users can only login after admin approval
- JWT tokens include: `userId`, `role`, `department`, `status`
- Protected routes require valid JWT token

### User Roles

1. **Student** - View-only access to most resources
2. **Teacher** - Can mark attendance, create assignments, add results
3. **HOD** - Can manage timetable, approve teacher leave requests
4. **Admin** - Full access to all features

## 📡 API Endpoints

### Authentication
- `POST /api/auth/admin/login` - Admin login
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user (Protected)
- `PUT /api/auth/change-password` - Change password (Protected)

### Users
- `GET /api/users/profile` - Get own profile (Protected)
- `PUT /api/users/profile` - Update own profile (Protected)
- `GET /api/users/pending` - Get pending users (Admin only)
- `GET /api/users` - Get all users (Admin only)
- `PUT /api/users/:id/status` - Update user status (Admin only)
- `GET /api/users/by-role` - Get users by role (Protected)

### Attendance
- `POST /api/attendance` - Mark attendance (Teacher, HOD, Admin)
- `GET /api/attendance` - Get attendance records (Protected)
- `GET /api/attendance/stats` - Get attendance statistics (Protected)

### Timetable
- `POST /api/timetable` - Create/Update timetable (HOD, Admin)
- `GET /api/timetable` - Get timetable (Protected)
- `DELETE /api/timetable/:id` - Delete timetable entry (HOD, Admin)

### Exams
- `POST /api/exams` - Create exam (Teacher, HOD, Admin)
- `GET /api/exams` - Get all exams (Protected)
- `GET /api/exams/:id` - Get single exam (Protected)
- `PUT /api/exams/:id` - Update exam (Teacher, HOD, Admin)
- `DELETE /api/exams/:id` - Delete exam (HOD, Admin)

### Results
- `POST /api/results` - Create/Update result (Teacher, HOD, Admin)
- `GET /api/results` - Get results (Protected)
- `GET /api/results/:id` - Get single result (Protected)
- `DELETE /api/results/:id` - Delete result (HOD, Admin)

### Assignments
- `POST /api/assignments` - Create assignment (Teacher, HOD, Admin)
- `GET /api/assignments` - Get all assignments (Protected)
- `GET /api/assignments/:id` - Get single assignment (Protected)
- `PUT /api/assignments/:id` - Update assignment (Teacher, HOD, Admin)
- `DELETE /api/assignments/:id` - Delete assignment (HOD, Admin)

### Notifications
- `POST /api/notifications` - Create notification (HOD, Admin)
- `GET /api/notifications` - Get notifications (Protected)
- `GET /api/notifications/:id` - Get single notification (Protected)
- `PUT /api/notifications/:id` - Update notification (HOD, Admin)
- `DELETE /api/notifications/:id` - Delete notification (HOD, Admin)

### Leave Requests
- `POST /api/leave-requests` - Create leave request (Protected)
- `GET /api/leave-requests` - Get leave requests (Protected)
- `GET /api/leave-requests/:id` - Get single leave request (Protected)
- `PUT /api/leave-requests/:id/status` - Approve/Reject leave (HOD, Admin)
- `DELETE /api/leave-requests/:id` - Delete leave request (Protected)

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics (Protected)

## 🔒 Security Features

- Password hashing with bcryptjs
- JWT-based authentication
- Role-based access control (RBAC)
- Status-based access (only approved users)
- Input validation
- Error handling
- CORS configuration

## 📝 Request/Response Format

### Request Headers
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message"
}
```

## 🧪 Testing the API

### Using cURL

**Admin Login:**
```bash
curl -X POST http://localhost:5000/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

**User Registration:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "email": "john@example.com",
    "phone": "1234567890",
    "department": "BCA",
    "role": "student",
    "password": "password123",
    "confirmPassword": "password123"
  }'
```

**User Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'
```

**Get Profile (with token):**
```bash
curl -X GET http://localhost:5000/api/users/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running
- Check `MONGODB_URI` in `.env`
- Verify network connectivity

### JWT Token Issues
- Check token expiration
- Verify `JWT_SECRET` in `.env`
- Ensure token is sent in `Authorization` header

### Permission Denied
- Verify user status is `approved`
- Check user role matches route requirements
- Ensure JWT token is valid

## 📚 Database Models

### User
- fullName, email, phone, department, role, password, status

### Attendance
- userId, role, date, status, markedBy, department

### TimeTable
- department, role, day, subject, timeSlot, createdBy

### Notification
- title, description, media, targetRole, department, createdBy

### Exam
- department, examName, subjects[], examSchedule, createdBy

### Result
- studentId, examId, subject, marks, status, createdBy

### Assignment
- department, subject, questions, dueDate, marks, createdBy

### LeaveRequest
- requestedBy, role, reason, status, reviewedBy

## 🚀 Production Deployment

1. Set `NODE_ENV=production` in `.env`
2. Use a strong `JWT_SECRET`
3. Use MongoDB Atlas or secure MongoDB instance
4. Configure proper CORS origins
5. Use environment-specific configurations
6. Enable HTTPS
7. Set up proper logging
8. Configure rate limiting
9. Use process manager (PM2)

## 📄 License

ISC

## 👥 Support

For issues or questions, please contact the development team.

---

**Built with ❤️ for College Management System**


