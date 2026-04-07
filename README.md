# 🎙️ MeetMind — AI Meeting Notes Generator

A full-stack AI-powered application that transforms your meeting audio recordings into structured notes, summaries, and action items automatically.

---

## 📌 Overview

The **AI Meeting Notes Generator** is a full-stack web application that helps teams and professionals automatically convert meeting recordings into meaningful insights.

It provides:

* 📝 Accurate transcription
* 📊 Smart summaries
* ✅ Actionable tasks
* 📂 Organized meeting history

---

## ✨ Features

## ✨ Features

- **Audio Upload** — MP3, WAV, M4A support up to 100MB
- **AI Transcription** — Powered by OpenAI Whisper with speaker identification
- **Smart Summary** — Overview, key points, and topic extraction
- **Action Item Detection** — Automatically extract tasks with priority and assignee
- **Interactive Management** — Check off tasks, assign team members inline
- **Export** — PDF and DOCX export
- **Share** — Generate public share links
- **History & Search** — Browse, filter, and search all past meetings
- **Authentication** — JWT-based login/register
- **Demo Mode** — Works without an OpenAI API key using realistic mock data

---

### 🧠 AI Transcription

* Converts speech into text
* Clean transcript view
* Speaker-based segmentation (basic)

### 📊 Smart Summary

* Extracts key discussion points
* Generates concise summaries

### ✅ Action Items

* Automatically detects tasks
* Task checklist with assignment support

### 📁 Notes Management

* Stores meeting history
* View and manage past recordings

### 🔗 Share & Export

* Share meeting notes via link
* Export notes (PDF/DOCX)

---

## 🖥️ Screens

* 📤 Upload Recording
* 📄 Transcript View
* 📊 Summary Page
* ✅ Task Assignment
* 📁 History Dashboard

---

## 🛠️ Tech Stack

**Frontend:**

* React.js
* Tailwind CSS

**Backend:**

* Node.js
* Express.js

**Database:**

* MongoDB

**AI Integration:**

* OpenAI API (Transcription & Summarization)

---

# 🗂️ Project Structure

```
ai-meeting-notes/
├── backend/
│   ├── config/
│   │   └── database.js          # MongoDB connection
│   ├── middleware/
│   │   └── auth.js              # JWT auth middleware
│   ├── models/
│   │   ├── User.js              # User schema
│   │   └── Meeting.js           # Meeting schema
│   ├── routes/
│   │   ├── auth.js              # Login / Register / Profile
│   │   ├── meetings.js          # CRUD + stats + sharing
│   │   ├── upload.js            # Audio upload + AI processing
│   │   └── export.js            # PDF / DOCX export
│   ├── services/
│   │   └── aiService.js         # OpenAI Whisper + GPT-4o
│   ├── uploads/                 # Audio files (auto-created)
│   ├── server.js                # Express entry point
│   └── .env.example
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── components/
│       │   └── Layout.js        # Sidebar + navigation
│       ├── context/
│       │   └── AuthContext.js   # Auth state management
│       ├── pages/
│       │   ├── Login.js
│       │   ├── Register.js
│       │   ├── Dashboard.js     # Stats + recent meetings
│       │   ├── Upload.js        # Drag & drop uploader
│       │   ├── MeetingDetail.js # Transcript, summary, actions
│       │   ├── History.js       # Search + filter all meetings
│       │   └── SharedMeeting.js # Public share view
│       ├── utils/
│       │   ├── api.js           # Axios instance
│       │   └── helpers.js       # Formatters
│       ├── App.js               # Routes
│       └── index.css            # All styles
│
└── README.md
```

---


## 🔗 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Sign in |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/upload` | Upload audio file |
| GET | `/api/meetings` | List meetings (search/filter/paginate) |
| GET | `/api/meetings/:id` | Get single meeting |
| GET | `/api/meetings/:id/status` | Poll processing status |
| PUT | `/api/meetings/:id` | Update meeting |
| PATCH | `/api/meetings/:id/action-items/:itemId` | Update action item |
| POST | `/api/meetings/:id/share` | Generate share link |
| DELETE | `/api/meetings/:id` | Delete meeting |
| GET | `/api/meetings/stats/overview` | Dashboard stats |
| GET | `/api/export/:id/pdf` | Export as PDF |
| GET | `/api/export/:id/docx` | Export as DOCX |

---

## ⚙️ Installation & Setup

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/your-github-username/your-repo-name.git
cd your-repo-name
```

---

### 2️⃣ Backend Setup (Node.js)

```bash
cd backend
npm install
```

👉 Create a `.env` file inside `backend/` and add:

```env
PORT=5000
MONGO_URI=your_mongodb_connection
OPENAI_API_KEY=your_openai_api_key
JWT_SECRET=your_secret_key
```

▶️ Run Backend Server:

```bash
npm start
```

OR (if start script not defined):

```bash
node server.js
```

---

### 3️⃣ Frontend Setup (React)

```bash
cd frontend
npm install
npm start
```

---

## 🔑 Environment Variables

| Variable       | Description               |
| -------------- | ------------------------- |
| OPENAI_API_KEY | OpenAI API key            |
| MONGO_URI      | MongoDB connection string |
| JWT_SECRET     | Authentication secret     |
| PORT           | Backend server port       |

---

## 🚀 Future Enhancements

* 🔊 Real-time meeting recording
* 📅 Google Calendar integration
* 💬 Slack integration
* 🎯 Advanced speaker recognition

---

## 👨‍💻 Author & Owner

**Name:** Rohith T N
**Role:** Developer & Project Owner

🔗 **GitHub:** https://github.com/your-github-username

---

## 📜 License

This project is developed and owned by **Rohith T N**.
Unauthorized copying, distribution, or commercial use is not allowed without permission.

---

## ⭐ Support

If you like this project:

* ⭐ Star the repository
* 🍴 Fork it
* 📢 Share with others

---

> 💡 *"Turn conversations into clarity with AI."*
