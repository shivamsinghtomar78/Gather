# Gather - Second Brain Application

A full-stack application for storing and organizing content from various sources (tweets, videos, documents, links). Features a dark-themed React frontend with 3D visualization and an Express.js REST API backend.

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Project Structure](#project-structure)
3. [Installation Guide](#installation-guide)
4. [Architecture](#architecture)
5. [API Documentation](#api-documentation)
6. [Tech Stack](#tech-stack)
7. [Features](#features)
8. [Development](#development)
9. [Deployment](#deployment)
10. [Troubleshooting](#troubleshooting)

---

## ⚡ Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or MongoDB Atlas)

### Start Backend (Terminal 1)
```bash
cd backend
npm install
npm run dev
```
✅ Runs on http://localhost:3000

### Start Frontend (Terminal 2)
```bash
cd frontend
npm install
npm run dev
```
✅ Runs on http://localhost:3001 (or next available port)

### Create .env file (in backend/)
```env
MONGODB_URI=mongodb://localhost:27017/gather
JWT_SECRET=your-very-secure-secret-key
PORT=3000
NODE_ENV=development
```

---

## 📁 Project Structure

```
Gather/
│
├── 📂 frontend/                    # Next.js Frontend (React 19, Tailwind CSS)
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx           # Landing page (/)
│   │   │   ├── auth/
│   │   │   │   └── page.tsx       # Auth page (/auth)
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx       # Dashboard (/dashboard)
│   │   │   ├── brain/
│   │   │   │   └── [shareLink]/
│   │   │   │       └── page.tsx   # Public brain (/brain/:shareLink)
│   │   │   ├── globals.css        # Dark theme & animations
│   │   │   └── layout.tsx         # Root layout
│   │   ├── components/            # Dark-themed components
│   │   │   ├── Brain3D.tsx        # 3D visualization
│   │   │   ├── Sidebar.tsx        # Navigation sidebar
│   │   │   ├── ContentCard.tsx    # Content card display
│   │   │   ├── AddContentModal.tsx # Add content dialog
│   │   │   ├── ShareBrainModal.tsx # Share dialog
│   │   │   └── ui/               # UI components (button, dialog, input)
│   │   └── lib/
│   │       ├── api.ts            # API client (Axios)
│   │       └── utils.ts          # Helper functions
│   ├── package.json              # Frontend dependencies
│   ├── tsconfig.json
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   └── postcss.config.mjs
│
├── 📂 backend/                     # Express.js Backend (Node.js, MongoDB)
│   ├── src/
│   │   ├── index.ts              # Main server entry point
│   │   ├── config/
│   │   │   └── db.ts            # MongoDB connection setup
│   │   ├── models/              # Database schemas
│   │   │   ├── User.ts          # User schema (username, password)
│   │   │   ├── Content.ts       # Content schema (tweets, videos, etc)
│   │   │   ├── Tag.ts           # Tag schema (content organization)
│   │   │   └── Link.ts          # Share link schema
│   │   ├── routes/              # API endpoints
│   │   │   ├── auth.ts          # Authentication (/signup, /signin)
│   │   │   ├── content.ts       # Content CRUD (/content)
│   │   │   └── brain.ts         # Sharing (/brain/share, /brain/:hash)
│   │   ├── middleware/
│   │   │   └── auth.ts          # JWT authentication middleware
│   │   └── utils/
│   │       └── hash.ts          # Hash generation utility
│   ├── package.json             # Backend dependencies
│   ├── tsconfig.json
│   └── README.md                # API documentation
│
├── .env.example                  # Environment variables template
├── .gitignore                    # Git ignore rules
└── README.md                     # This file
```

---

## 🛠️ Installation Guide

### Step 1: Backend Setup

Navigate to the backend directory:
```bash
cd backend
```

Install dependencies:
```bash
npm install
```

Create `.env` file in the backend directory:
```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/gather

# JWT
JWT_SECRET=your-very-secure-secret-key-here

# Server
PORT=3000
NODE_ENV=development
```

Start the development server:
```bash
npm run dev
```

Expected output:
```
🚀 Gather API running on http://localhost:3000
✅ Connected to MongoDB
```

### Step 2: Frontend Setup

In a new terminal, navigate to the frontend directory:
```bash
cd frontend
```

Install dependencies:
```bash
npm install
```

Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:3001` (or the next available port).

### Step 3: Database Setup

#### Using MongoDB Local (Recommended for Development)
1. Install MongoDB from https://www.mongodb.com/try/download/community
2. Start MongoDB service:
   - **macOS**: `brew services start mongodb-community`
   - **Windows**: Start MongoDB from Services or run `mongod`
   - **Linux**: `sudo systemctl start mongod`
3. Connect with: `mongosh`

#### Using MongoDB Atlas (Cloud)
1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a new cluster
3. Get connection string
4. Add to `.env`:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/gather
```

---

## 🏗️ Architecture

### Frontend Architecture

**Tech Stack:**
- Next.js 16 (React 19, TypeScript)
- Tailwind CSS 4 (dark theme with custom utilities)
- Framer Motion (animations)
- Three.js (3D visualization)
- Axios (HTTP client)

**Key Components:**
- **Brain3D.tsx**: Interactive 3D brain with particles and distortion effects
- **Sidebar.tsx**: Navigation with filter options (All, Tweets, Videos, Docs, Links, Tags)
- **ContentCard.tsx**: Display individual content items with preview
- **AddContentModal.tsx**: Form to add new content with validation
- **ShareBrainModal.tsx**: Generate and manage share links

**Pages:**
- `/` - Landing page with Brain3D visualization and features
- `/auth` - Authentication page (sign in/sign up)
- `/dashboard` - Main application with content management
- `/brain/:shareLink` - Public view of shared brain

**Styling:**
- Dark theme: slate-950 backgrounds, purple-600 and cyan-500 accents
- Animations: fade-in, slide-up, float, glow-pulse effects
- Glass morphism: frosted glass with backdrop blur and transparency
- Responsive: Mobile-first design with Tailwind breakpoints

### Backend Architecture

**Tech Stack:**
- Express.js (Node.js REST API)
- TypeScript (type safety)
- MongoDB + Mongoose (database and ODM)
- JWT (authentication)
- Bcrypt (password hashing)
- Zod (input validation)

**Data Models:**

1. **User**
   - `username` (string, unique, 3-10 chars)
   - `password` (string, hashed with bcrypt)
   - Timestamps

2. **Content**
   - `type` (document | tweet | youtube | link)
   - `title` (string)
   - `link` (string/URL)
   - `tags` (array of Tag references)
   - `userId` (reference to User)
   - Timestamps

3. **Tag**
   - `title` (string, unique, lowercase)
   - Referenced by Content documents
   - Timestamps

4. **Link** (Share Links)
   - `hash` (string, unique, 10 chars)
   - `userId` (reference to User, unique one per user)
   - Timestamps

**Authentication Flow:**
1. User submits credentials on /auth page
2. Frontend calls POST /api/v1/signup or /signin
3. Backend validates input with Zod
4. Backend hashes password (bcrypt) or compares stored hash
5. Backend generates JWT token (7-day expiry)
6. Frontend stores token in localStorage
7. Subsequent API requests include token in Authorization header
8. Backend middleware verifies token and attaches userId to request

**API Middleware:**
- `authMiddleware`: Verifies JWT token, extracts userId, throws 401 if invalid
- CORS enabled for frontend communication
- Error handling with meaningful messages

---

## 📡 API Documentation

### Base URL
```
http://localhost:3000/api/v1
```

### Authentication Endpoints

#### Sign Up
```
POST /api/v1/signup
Content-Type: application/json

{
  "username": "john_doe",
  "password": "securepassword123"
}

Response (201):
{
  "userId": "507f1f77bcf86cd799439011",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Sign In
```
POST /api/v1/signin
Content-Type: application/json

{
  "username": "john_doe",
  "password": "securepassword123"
}

Response (200):
{
  "userId": "507f1f77bcf86cd799439011",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Content Endpoints

#### Add Content
```
POST /api/v1/content
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "tweet",
  "title": "Interesting article about AI",
  "link": "https://twitter.com/...",
  "tags": ["AI", "technology"]
}

Response (201):
{
  "_id": "507f1f77bcf86cd799439012",
  "type": "tweet",
  "title": "Interesting article about AI",
  "link": "https://twitter.com/...",
  "tags": [
    { "_id": "507f1f77bcf86cd799439013", "title": "AI" },
    { "_id": "507f1f77bcf86cd799439014", "title": "technology" }
  ],
  "userId": "507f1f77bcf86cd799439011",
  "createdAt": "2024-01-22T10:30:00Z"
}
```

#### Get All Content
```
GET /api/v1/content
Authorization: Bearer <token>

Response (200):
{
  "content": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "type": "tweet",
      "title": "Interesting article about AI",
      "link": "https://twitter.com/...",
      "tags": [
        { "_id": "507f1f77bcf86cd799439013", "title": "AI" },
        { "_id": "507f1f77bcf86cd799439014", "title": "technology" }
      ],
      "userId": "507f1f77bcf86cd799439011",
      "createdAt": "2024-01-22T10:30:00Z"
    }
  ]
}
```

#### Delete Content
```
DELETE /api/v1/content/:contentId
Authorization: Bearer <token>

Response (200):
{
  "message": "Content deleted successfully"
}
```

### Brain Sharing Endpoints

#### Create/Toggle Share Link
```
POST /api/v1/brain/share
Authorization: Bearer <token>

Response (200):
{
  "shareLink": "http://localhost:3001/brain/abc1234567",
  "hash": "abc1234567",
  "isShared": true
}
```

#### View Shared Brain
```
GET /api/v1/brain/:shareLink

Response (200):
{
  "username": "john_doe",
  "content": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "type": "tweet",
      "title": "Interesting article about AI",
      "link": "https://twitter.com/...",
      "tags": [
        { "_id": "507f1f77bcf86cd799439013", "title": "AI" }
      ]
    }
  ]
}
```

---

## 💻 Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **Next.js 16** | React framework with server-side rendering |
| **React 19** | UI library |
| **TypeScript** | Type safety |
| **Tailwind CSS 4** | Utility-first CSS framework |
| **Framer Motion** | Animation library |
| **Three.js** | 3D graphics library |
| **React Three Fiber** | React renderer for Three.js |
| **Radix UI** | Accessible component library |
| **Axios** | HTTP client |
| **Lucide React** | Icon library |

### Backend
| Technology | Purpose |
|------------|---------|
| **Express.js** | Web framework |
| **TypeScript** | Type safety |
| **MongoDB** | NoSQL database |
| **Mongoose** | MongoDB ODM |
| **JWT** | Authentication tokens |
| **Bcrypt** | Password hashing |
| **Zod** | Input validation |
| **CORS** | Cross-origin resource sharing |
| **ts-node-dev** | Development server with auto-reload |

---

## ✨ Features

### 🔐 Authentication
- User sign up with username and password
- User sign in with JWT token generation
- Secure password hashing with bcrypt
- Token-based API authentication
- 7-day token expiration

### 📚 Content Management
- Add content from multiple sources (tweets, videos, documents, links)
- Store content title, URL, and associated tags
- View all user's saved content
- Delete content
- Filter content by type
- Tag-based organization

### 🔗 Sharing
- Generate shareable links for your brain
- One share link per user
- Public view of shared brain (read-only)
- Toggle sharing on/off

### 🎨 User Interface
- **Dark Theme**: Professional dark color scheme with purple/cyan accents
- **Animations**: Smooth transitions, fade-ins, slide-ups, floating effects, glow pulses
- **3D Visualization**: Interactive 3D brain with particles, distortion, and wireframe effects
- **Glass Morphism**: Frosted glass effects with transparency and blur
- **Responsive Design**: Mobile-first approach, works on all devices
- **Accessible Components**: Radix UI for accessibility

### 💾 Data Organization
- Automatic tag creation and linking
- Content grouped by type
- Tag-based filtering and organization

---

## 🚀 Development

### Running Both Services

Open two terminal windows/tabs:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Visit `http://localhost:3001` to access the application.

### Available Scripts

#### Backend
```bash
npm run dev      # Start development server with auto-reload
npm run build    # Compile TypeScript to JavaScript
npm start        # Run compiled JavaScript
```

#### Frontend
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm start        # Start production server
npm run lint     # Run ESLint
```

### File Structure for Development

**Frontend** - Most UI changes:
- `frontend/src/components/` - React components
- `frontend/src/app/` - Pages and layouts
- `frontend/src/app/globals.css` - Styles and animations
- `frontend/src/lib/api.ts` - API integration

**Backend** - API logic:
- `backend/src/routes/` - API endpoints
- `backend/src/models/` - Database schemas
- `backend/src/middleware/auth.ts` - Authentication
- `backend/src/config/db.ts` - Database connection

---

## 🌐 Deployment

### Backend Deployment

1. Build for production:
```bash
npm run build
```

2. Set environment variables on hosting platform (Heroku, Railway, DigitalOcean, etc.):
```
MONGODB_URI=your_production_mongodb_url
JWT_SECRET=your_production_secret_key
PORT=3000
NODE_ENV=production
```

3. Deploy the `/backend` directory
4. Update MongoDB to use MongoDB Atlas or managed database
5. Note the backend URL for frontend configuration

### Frontend Deployment

1. Build for production:
```bash
npm run build
```

2. Update API base URL to production backend in `frontend/src/lib/api.ts`

3. Deploy to Vercel, Netlify, or similar:
   - Connect your repository
   - Deploy the `/frontend` directory
   - Set production environment variables if needed

---

## 🔧 Troubleshooting

### Backend Issues

**Backend won't start:**
```bash
# Check MongoDB is running
mongosh

# Check port 3000 is free (Windows)
netstat -ano | findstr :3000

# Check .env file exists with correct values
cat backend/.env
```

**MongoDB connection failed:**
- Verify MongoDB is running: `mongosh` command
- For local: Default URL should be `mongodb://localhost:27017/gather`
- For Atlas: Verify connection string in `.env`
- Whitelist your IP in MongoDB Atlas

**JWT errors:**
- Ensure `JWT_SECRET` is set in `.env`
- Check token format in requests (Bearer token)
- Tokens expire after 7 days - user must log in again

### Frontend Issues

**Frontend can't connect to backend:**
- Verify backend is running on http://localhost:3000
- Check `frontend/src/lib/api.ts` baseURL is correct
- Check firewall settings
- Verify CORS is enabled in backend (should be by default)

**3D brain not rendering:**
- Clear browser cache (Ctrl+Shift+Delete)
- Check browser console for errors (F12)
- Ensure hardware acceleration is enabled in browser
- Try a different browser

**Authentication issues:**
- Clear localStorage and refresh page
- Check JWT token in browser DevTools > Application > localStorage
- Verify `.env` has `JWT_SECRET` set

**Styling/Layout broken:**
- Ensure Tailwind CSS is compiled (check `frontend/src/app/globals.css`)
- Clear `.next` folder and rebuild: `rm -rf .next && npm run dev`
- Check if all dependencies installed: `npm install`

---

## 📝 Environment Variables Reference

### Backend (.env in backend/)
```env
# MongoDB Connection (local or Atlas)
MONGODB_URI=mongodb://localhost:27017/gather

# JWT Configuration
JWT_SECRET=your-very-secure-secret-key-here

# Server Configuration
PORT=3000
NODE_ENV=development
```

### Frontend Configuration
- Backend API URL: `frontend/src/lib/api.ts` (default: `http://localhost:3000`)
- Update if backend runs on different port or domain

---

## 🎯 Next Steps

1. **Install and run both services** following the Quick Start section
2. **Create a user account** on the `/auth` page
3. **Add some content** to test the functionality
4. **Test sharing** by creating a share link and visiting it in incognito mode
5. **Explore the 3D brain** visualization on the landing page
6. **Customize** the dark theme colors in `frontend/src/app/globals.css`

## 👨‍💻 Development Notes

### Code Organization
- **Backend**: Express app with modular routes and middleware
- **Frontend**: Next.js app with component-based architecture
- **Database**: MongoDB with Mongoose schemas
- **Authentication**: JWT tokens with bcrypt password hashing
- **Validation**: Zod for backend input validation

### Key Design Patterns
- API middleware for authentication
- Component composition in React
- Schema-based data modeling
- Separation of concerns (frontend/backend)
- RESTful API design

### Performance Considerations
- Database indexes on frequently queried fields (username, userId)
- JWT token caching in localStorage
- Lazy loading of components
- Optimized 3D rendering with Three.js
- CSS animations using GPU acceleration

---

**Last Updated:** January 22, 2026
**Version:** 1.0.0
