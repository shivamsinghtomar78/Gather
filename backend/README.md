# Gather Backend

Express.js backend for the Gather second brain application.

## Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file with:
```
MONGODB_URI=mongodb://localhost:27017/gather
JWT_SECRET=your-secret-key
PORT=3000
```

4. Start development server:
```bash
npm run dev
```

## API Endpoints

### Auth
- `POST /api/v1/signup` - Register new user
- `POST /api/v1/signin` - Login user

### Content
- `POST /api/v1/content` - Add new content
- `GET /api/v1/content` - Get all user content
- `DELETE /api/v1/content` - Delete content

### Brain
- `POST /api/v1/brain/share` - Create/toggle share link
- `GET /api/v1/brain/:shareLink` - Get shared brain content
