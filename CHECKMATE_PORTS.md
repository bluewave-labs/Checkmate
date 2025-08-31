# Checkmate Port Configuration

## Development Server Ports

### Frontend (Client)
- **Port**: 5173
- **URL**: http://localhost:5173/
- **Start Command**: `npm run dev` (from client directory)
- **Technology**: Vite React development server

### Backend (Server)  
- **Port**: 5001
- **URL**: http://localhost:5001/
- **Start Command**: `npm run dev` (from server directory)
- **Technology**: Node.js Express server with nodemon

## Database
- **MongoDB**: mongodb://localhost:27017/checkmate_dev
- **Database Name**: checkmate_dev

## Quick Restart Commands

### Start Both Servers
```bash
# Terminal 1 - Backend
cd /Users/gorkemcetin/checkmate/server && npm run dev

# Terminal 2 - Frontend  
cd /Users/gorkemcetin/checkmate/client && npm run dev
```

### Or Background Start
```bash
# Start backend in background
cd /Users/gorkemcetin/checkmate/server && npm run dev &

# Start frontend in background
cd /Users/gorkemcetin/checkmate/client && npm run dev &
```

## Features Implemented
- ✅ ntfy notification integration (PR #2872)
- ✅ Authentication methods (none, username/password, bearer token)
- ✅ Priority levels (1-5)
- ✅ Full frontend forms with validation
- ✅ Backend API integration
- ✅ Test notifications working
- ✅ Real incident notifications working

## Last Session Date
Generated: 2025-08-29