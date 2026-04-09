# BC WildWatch™

Campus Animal Safety Reporting System for Belgium Campus iTversity.

## Overview

BC WildWatch is a full-stack web application that allows students and staff to report animal sightings and safety incidents on campus. It features real-time incident tracking, an AI-powered safety chatbot, admin dashboard, QR code sharing, and photo uploads.

## Tech Stack

- **Backend:** Node.js + Express.js
- **Templating:** EJS
- **Database:** MongoDB Atlas (Mongoose ODM)
- **Frontend:** Vanilla JavaScript + Custom CSS
- **AI Chatbot:** Google Gemini API (gemini-1.5-flash)
- **File Uploads:** Multer + Cloudinary (optional)
- **QR Code:** qrcode npm package
- **Security:** Helmet, express-rate-limit

## Prerequisites

- Node.js >= 18.0.0
- npm >= 8.0.0
- MongoDB Atlas account (free tier works fine)
- Google Gemini API key (optional — chatbot works without it but will show a placeholder message)
- Cloudinary account (optional — photo uploads work without it but images won't be stored)

## Local Setup

### 1. Clone / Navigate to the project

```bash
cd c:/Users/shiva/Documents/bc-wildwatch-v2/wildwatch
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

Edit `.env`:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/wildwatch?retryWrites=true&w=majority
GEMINI_API_KEY=AIzaSy...your_key_here
ADMIN_PASSWORD=wildwatch2026
PORT=3000
APP_URL=http://localhost:3000
# Optional Cloudinary (for photo uploads):
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 4. Seed the database (optional)

Populate the database with 20 sample incidents:

```bash
npm run seed
```

### 5. Start the development server

```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

### 6. Start for production

```bash
npm start
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | Yes | MongoDB Atlas connection string |
| `GEMINI_API_KEY` | No | Google Gemini API key for the chatbot |
| `ADMIN_PASSWORD` | Yes | Password to access the admin dashboard |
| `PORT` | No | Server port (default: 3000) |
| `APP_URL` | No | Public URL of the app (used in QR code) |
| `CLOUDINARY_CLOUD_NAME` | No | Cloudinary cloud name for photo uploads |
| `CLOUDINARY_API_KEY` | No | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | No | Cloudinary API secret |

## Getting API Keys

### MongoDB Atlas

1. Go to [https://cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a free account and a free M0 cluster
3. Under Database Access, create a user with read/write permissions
4. Under Network Access, add `0.0.0.0/0` (allow all IPs) or your specific IP
5. Click Connect → Connect your application → copy the connection string
6. Replace `<password>` with your database user password

### Google Gemini API Key

1. Go to [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and paste it in your `.env` file

### Cloudinary (Optional)

1. Go to [https://cloudinary.com](https://cloudinary.com) and create a free account
2. From the Dashboard, copy your Cloud Name, API Key, and API Secret
3. Add them to your `.env` file

## Features

### For Students / Public

- **Report a Sighting** (`/report`) — Submit animal incident reports with location, severity, description, and optional photo
- **My Reports** (`/my-reports`) — Look up your submitted reports by email address with status tracking
- **Safety Chatbot** (`/chatbot`) — AI-powered chatbot for instant animal safety advice
- **QR Code** (`/qr`) — Generate and download/print a QR code that links to the app

### For Administrators

- **Admin Dashboard** (`/admin`) — Password-protected dashboard to view, filter, and manage all reports
  - Update incident status (Pending → Reviewed → In Progress → Resolved)
  - Add admin notes to incidents
  - Bulk resolve multiple incidents
  - Filter by status, animal type, severity, location
  - Sort by date, severity, or status
  - Export all data to CSV

### Home Page (`/home`)

- Live incident feed (last 5 reports)
- Today's report count, resolved-this-week count, most-reported animal
- Feature cards linking to main features
- Campus animal safety guide

## Pages / Routes

| Route | Description |
|---|---|
| `/home` | Home page with stats and live feed |
| `/report` | Submit an incident report |
| `/my-reports` | Look up your reports by email |
| `/chatbot` | AI safety chatbot |
| `/qr` | QR code generator and download |
| `/admin` | Admin dashboard (password protected) |
| `/health` | JSON health check endpoint |
| `/incidents/submit` | POST - submit a new incident |
| `/incidents/my-reports?email=...` | GET - fetch user's reports |
| `/incidents/feed` | GET - get latest 5 incidents |
| `/incidents/stats` | GET - get stats |
| `/admin/incidents` | GET - all incidents (requires password) |
| `/admin/incidents/:id/status` | PATCH - update status |
| `/admin/incidents/:id/notes` | PATCH - update notes |
| `/admin/incidents/bulk-resolve` | POST - bulk resolve |
| `/admin/export/csv` | GET - download CSV export |
| `/qr/image` | GET - serve QR code as PNG |

## Deployment to Render

### 1. Create a Render account

Go to [https://render.com](https://render.com) and sign up.

### 2. Connect your GitHub repository

Push your code to GitHub, then in Render:
- Click "New" → "Web Service"
- Connect your GitHub repo
- Select the repo and branch

### 3. Configure the service

| Setting | Value |
|---|---|
| Name | `bc-wildwatch` |
| Root Directory | `wildwatch` (if using the mono-repo structure) |
| Environment | `Node` |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Instance Type | Free |

### 4. Add environment variables

In Render's Environment tab, add all your `.env` variables:
- `MONGODB_URI`
- `GEMINI_API_KEY`
- `ADMIN_PASSWORD`
- `NODE_ENV=production`
- `APP_URL=https://your-app-name.onrender.com`
- Cloudinary variables (if using)

### 5. Deploy

Click "Create Web Service". Render will build and deploy automatically. On subsequent pushes to your connected branch, Render auto-deploys.

### Notes for Render Free Tier

- The free tier spins down after 15 minutes of inactivity. The first request after spin-down takes ~30 seconds.
- Upgrade to a paid plan for always-on hosting.

## Project Structure

```
wildwatch/
  app.js                      # Express app entry point
  seed.js                     # Database seeding script
  package.json
  .env.example
  models/
    Incident.js               # Mongoose schema
  controllers/
    incidentController.js     # Incident CRUD logic
    adminController.js        # Admin dashboard logic
    chatbotController.js      # Gemini AI integration
  routes/
    incidents.js              # Public incident routes
    admin.js                  # Admin routes (password protected)
    chatbot.js                # Chatbot routes (rate limited)
    qr.js                     # QR code generation
  views/
    partials/
      header.ejs              # HTML head + opening body
      navbar.ejs              # Navigation bar
      footer.ejs              # Footer + closing body/html
    index.ejs                 # Home page
    report.ejs                # Report submission form
    my-reports.ejs            # Report lookup by email
    admin.ejs                 # Admin dashboard
    chatbot.ejs               # AI chatbot interface
    qr.ejs                    # QR code page
    404.ejs                   # Not found error page
    500.ejs                   # Server error page
  public/
    css/
      style.css               # Main stylesheet (900+ lines)
      admin.css               # Admin-specific styles
    js/
      reports.js              # Report form + toast logic
      chatbot.js              # Chatbot UI logic
    images/
      .gitkeep
```

## Animal Types Supported

Snake, Bees/Wasps, Ants, Lizard, Cockroaches, Stray Dog, Stray Cat, Spider, Rat/Mouse, Other

## Campus Locations

Main Building, Library, Cafeteria, Parking Lot, Sports Fields, Residence, IT Labs, Admin Block, Garden Area, Other

## Severity Levels

- **Low** — No immediate danger
- **Medium** — Potential risk
- **High** — Immediate attention needed
- **Critical** — Danger to life/safety

## License

Internal use only — Belgium Campus iTversity. All rights reserved.
