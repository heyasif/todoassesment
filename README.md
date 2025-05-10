# Todo Assessment Application

A real-time collaborative Note/Todo application built with WebSockets (Socket.IO), Redis cache with MongoDB fallback, and a React frontend.

## Deployed Links

- **Frontend (Vercel):** https://todoassesment.vercel.app/
- **Backend (Render):** https://todoassesment-5.onrender.com/

## About the App

This is a real-time “Note App” that allows multiple users or clients to add tasks/notes and see them instantly across all connected clients. It uses:

- **WebSockets** (Socket.IO) for real-time bi-directional communication
- **Redis** as a fast in-memory cache for todos
- **MongoDB** for persistent storage, with automatic bulk migration when Redis cache grows beyond 50 items
- **React + TypeScript** frontend with a clean, responsive UI

## Backend Routes

### WebSocket Events

- **`add`**

  - **Direction:** Client → Server
  - **Payload:** `string` (task text)
  - **Behavior:**
    1. Store the task in Redis.
    2. If Redis list length > 50, migrate all items to MongoDB and clear Redis.
    3. Broadcast `newTask` event to all clients with the new task object.

- **`newTask`**
  - **Direction:** Server → Clients
  - **Payload:** `Task` object (`{ text: string; createdAt: Date }`)

### HTTP Endpoints

- **POST `/addTask`**

  - **Description:** Add a new task via HTTP (useful for Postman or non-WebSocket clients).
  - **Request Body:**
    ```json
    {
      "text": "Sample task text"
    }
    ```
  - **Response:** `201 Created` with the created `Task` object

- **GET `/fetchAllTasks`**
  - **Description:** Retrieve all tasks from Redis (or MongoDB if cache is empty).
  - **Response:** `200 OK` with JSON array of `Task` objects

## Frontend

- **Tech Stack:** React, TypeScript, Socket.IO Client, Axios
- **Structure:**
  - `public/notebook-icon.png`: App icon
  - `src/components/NoteApp.tsx`: Main UI component
  - `src/App.tsx`: Renders the NoteApp
  - `src/index.tsx`: Entry point

## Environment Variables

### Backend (`backend/.env`)

```
PORT=4000
FIRST_NAME=YourFirstName

REDIS_HOST=<your_redis_host>
REDIS_PORT=<your_redis_port>
REDIS_USER=default
REDIS_PASS=<your_redis_password>

MONGO_URI=<your_mongodb_connection_string>
```

### Frontend (`frontend/.env`)

```
REACT_APP_API_URL=http://localhost:4000
```

## Installation & Local Setup

1. **Clone the repo**

   ```bash
   git clone https://github.com/heyasif/todoassesment.git
   cd todoassesment
   ```

2. **Backend**

   ```bash
   cd backend
   npm install
   npm run dev
   ```

3. **Frontend**
   ```bash
   cd ../frontend
   npm install
   npm start
   ```

The frontend will open at `http://localhost:3000` and connect to the backend on port `4000`.

## License

MIT License
