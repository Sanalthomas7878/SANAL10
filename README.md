# EcoScrap Pro - Scrap Management System

A modern full-stack Scrap Management System with customer pickup scheduling, admin operations, image uploads, and Google Maps-based location support.

## Tech Stack
- Frontend: HTML5, CSS3, JavaScript, Tailwind CSS (CDN)
- Backend: Python Flask
- Database: MySQL
- Maps: Google Maps JavaScript API + Places API
- Uploads: Local server storage (`assets/uploads/`)

## Project Structure
- `frontend/` - templates and static files
- `backend/` - Flask backend (auth, orders, admin, APIs)
- `database/` - MySQL schema
- `assets/images/scrap/` - reserved local image folder

## Features
- Responsive modern UI
- Animated glassmorphism login page with floating scrap particles
- Register/Login for customers
- Admin login and role-based dashboard
- Scrap photo upload
- Scrap category listing with prices
- Pickup scheduling and status tracking
- Google Maps location pin + nearby scrap shop discovery
- Admin order management (Pending, Accepted, Rejected, Pickup Completed)
- Admin metrics (total/pending/accepted/completed)

## Database Tables
- `users`
- `admins`
- `scrap_categories`
- `orders`
- `scrap_images`

## Setup
1. Create MySQL database and tables:
   ```bash
   mysql -u root -p < database/schema.sql
   ```
2. Create and activate virtual environment:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure environment:
   ```bash
   cp .env.example .env
   ```
   Update values in `.env`.

5. Run app:
   ```bash
   flask --app backend.app init-db
   flask --app backend.app run --debug
   ```

## Default Admin Login
- Email: `admin@scrap.local`
- Password: `Admin@123`

(Change both via `.env` before production use.)

## Notes
- Google Maps requires a valid `GOOGLE_MAPS_API_KEY` with Maps JavaScript API and Places API enabled.
- Uploaded files are stored in `assets/uploads/`.
- Category cards use public image URLs by default.
