# WomosiGO - Web Application

WomosiGO is a full-stack web application built with React (Vite) frontend and Node.js/Express backend with MongoDB database.

## 🚀 Features

- **User Management**: Registration, authentication, and user profiles
- **Admin Panel**: Complete admin dashboard with notifications and task management
- **Campsite Management**: Browse and manage campsites
- **Reservation System**: Book and manage campsite reservations
- **Reports & Analytics**: Generate reports and view statistics
- **File Uploads**: Image upload functionality for campsites

## 🛠️ Tech Stack

### Frontend
- **React 18** with Vite
- **Modern JavaScript (ES6+)**
- **CSS3** for styling

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Multer** for file uploads
- **bcryptjs** for password hashing

## 📁 Project Structure

```
WomosiGO/
├── server/                 # Backend API
│   ├── config/            # Database configuration
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   ├── utils/             # Utility functions
│   └── uploads/           # File uploads directory
├── WomosiGo-app/          # Frontend React app
│   ├── src/
│   │   ├── components/    # React components
│   │   └── views/         # Page components
│   └── public/            # Static assets
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd WomosiGO
   ```

2. **Install Backend Dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd ../WomosiGo-app
   npm install
   ```

4. **Environment Setup**
   
   Create a `.env` file in the `server` directory:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/womosigo
   JWT_SECRET=your_jwt_secret_here
   NODE_ENV=development
   ```

5. **Start the Development Servers**

   **Backend (Terminal 1):**
   ```bash
   cd server
   npm run dev
   ```

   **Frontend (Terminal 2):**
   ```bash
   cd WomosiGo-app
   npm run dev
   ```

6. **Access the Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

## 🌐 Deployment

### For Production Deployment

1. **Build the Frontend**
   ```bash
   cd WomosiGo-app
   npm run build
   ```

2. **Configure Environment Variables**
   - Set `NODE_ENV=production`
   - Configure production MongoDB URI
   - Set secure JWT secret

3. **Start Production Server**
   ```bash
   cd server
   npm start
   ```

### Deployment Platforms

#### Vercel (Recommended for Frontend)
1. Connect your GitHub repository to Vercel
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Deploy!

#### Heroku (Backend)
1. Create a Heroku app
2. Add MongoDB Atlas as addon
3. Set environment variables
4. Deploy with Git

#### Netlify (Alternative for Frontend)
1. Connect GitHub repository
2. Set build command: `npm run build`
3. Set publish directory: `dist`

## 📱 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Verify token

### User Management
- `GET /api/userdata/profile` - Get user profile
- `PUT /api/userdata/profile` - Update profile

### Admin
- `GET /api/admin/stats` - Get admin statistics
- `GET /api/admin/notifications` - Get notifications
- `POST /api/admin/tasks` - Create admin task

### Campsites
- `GET /api/campsites` - Get all campsites
- `POST /api/campsites` - Create campsite
- `PUT /api/campsites/:id` - Update campsite

## 🔧 Development

### Available Scripts

**Backend:**
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon

**Frontend:**
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For support, email support@womosigo.com or create an issue in the repository.

---

**WomosiGO** - Your camping companion! 🏕️
