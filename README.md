# EcoScrap Pro MERN Stack Application

Welcome to the fully rebuilt, scalable, and modern **EcoScrap Pro** platform. This project operates on a full-stack **MERN** architecture (MongoDB, Express, React, Node.js) separated by pure domain logic.

## 📁 Folder Structure

```text
SANAL9/
├── backend/       # Node.js + Express API server (Controllers, Models, Routes)
├── frontend/      # Vite + React UI with Framer Motion and Custom CSS
└── legacy/        # The original Python Flask architecture preserved for reference
```

## 🛠 Environment Setup Guide

Before you start, you need to configure your environment variables for both the frontend and the backend.

### Backend Setup (`backend/.env`)
1. Navigate to the `backend/` directory.
2. Create a file named `.env`.
3. Add the following details:
   ```env
   PORT=5050
   MONGO_URI=mongodb://127.0.0.1:27017/ecoscrap
   JWT_SECRET=your_super_secret_jwt_key_here
   SMTP_SERVICE=gmail
   SMTP_USER=your-sender@gmail.com
   SMTP_PASS=your-gmail-app-password
   SMTP_FROM="EcoScrap Pro <your-sender@gmail.com>"
   ```

   For OTP emails through Gmail, use a Gmail account as the sender and create a Google App Password for `SMTP_PASS`.

### Frontend Setup (`frontend/.env`)
1. Navigate to the `frontend/` directory.
2. Create a file named `.env`.
3. Add the following details:
   ```env
   VITE_API_URL=http://localhost:5050/api
   VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   ```

## 🚀 Step-by-Step Run Instructions

### Single Combined Localhost Server
If you want the frontend and backend combined into one localhost app, run this from the project root:

```bash
npm start
```

Then open:

```text
http://127.0.0.1:5050/
```

This builds the Vite frontend and lets the Express backend serve the compiled app and all `/api` routes from the same server.

### One Command Development Mode
If you want to start both the frontend and backend together with one command while keeping hot reload, run this from the project root:

```bash
npm run dev
```

Then use:

```text
Frontend: http://127.0.0.1:4173/
Backend:  http://127.0.0.1:5050/
```

The frontend uses Vite, and `/api` requests are proxied to the backend automatically.

### Starting the Backend
1. Open a terminal and navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Install the necessary dependencies (already installed during setup, but safe to verify):
   ```bash
   npm install
   ```
3. Start the Express development server:
   ```bash
   node index.js
   ```
   *(You should see "Server running on port 5050" and "MongoDB connected")*

### Starting the Frontend
1. Open a **new** terminal window and navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install the dependencies:
   ```bash
   npm install
   ```
3. Start the Vite React development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to the local link provided by Vite (e.g., `http://localhost:5173`).

### Development Mode
If you want hot reload while developing the UI, you can still run the frontend separately:

```bash
npm run dev:frontend
```

The Vite dev server runs on:

```text
http://127.0.0.1:4173/
```

For the API during development, run:

```bash
npm run dev:backend
```

## 💎 Key Features Implemented
- **Modern Aesthetic**: Glassmorphism, tailored Vanilla CSS variables, and modern typography combinations (Outfit & Inter).
- **Responsive Design**: Clean container layouts built into the `index.css`.
- **Authentication System**: Secure JWT architecture mapped within Express middleware `protect` and `admin` roles.
- **Scalable Component Structure**: Models map specifically to Booking schemas, Location matrices, and Corporate Partnerships.
- **Dynamic UI Framework Flow**: Framer motion handles subtle micro-animations for an elevated user experience.
