<div align="center">

# 🎓 Smart Curriculum & Attendance Management System

### 🚀 AI-Powered Academic Management Platform

**Learn ➜ Track ➜ Analyze ➜ Generate ➜ Manage ➜ Improve**

<p align="center">

![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-Authentication-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)
![Gemini](https://img.shields.io/badge/Google-Gemini_AI-4285F4?style=for-the-badge&logo=google&logoColor=white)

</p>

<p align="center">

<a href="https://smart-curriculam-and-attendence-cal.vercel.app/login">
<img src="https://img.shields.io/badge/🌐 Live Demo-Visit Website-success?style=for-the-badge"/>
</a>

<a href="https://github.com/kasturiMahesh/smart-curriculam-and-attendence-calculator">
<img src="https://img.shields.io/badge/GitHub-Repository-black?style=for-the-badge&logo=github"/>
</a>

</p>

---

## 🏗️ System Architecture

```text

                    👨‍🏫 Faculty / 👨‍🎓 Student
                              │
                              ▼
                   ⚛️ React + Vite Frontend
                              │
               JWT Authentication & Authorization
                              │
                              ▼
                  🚀 FastAPI Backend Services
      ┌──────────────────────┼──────────────────────┐
      ▼                      ▼                      ▼
📚 AI Curriculum      📅 Attendance         🤖 AI Assistant
   Generator             Calculator            (Gemini AI)
      ▼                      ▼                      ▼
  Course Plans      Excel Upload & Reports     Smart Responses
      └──────────────┬──────────────┬──────────────┘
                     ▼
               🍃 MongoDB Database
                     ▼
            📊 Reports • Analytics • PDFs

```

</div>

---

# ✨ Features

## 📚 Smart Curriculum

- 🤖 AI Curriculum Generator
- 📅 Semester Planning
- 📖 Subject-wise Learning Roadmaps
- 🎯 Personalized Study Plans
- 📝 AI Generated Learning Resources
- 📚 Weekly Study Schedule

---

## 📅 Attendance Management

- 📥 Excel Attendance Upload
- 📊 Automatic Attendance Calculation
- 📈 Attendance Analytics
- 📄 PDF Report Generation
- 📉 Subject-wise Attendance Tracking
- 🚨 Low Attendance Alerts
- 📅 Daily Attendance Management

---

## 👨‍🎓 Student Features

- Secure Login
- Attendance Dashboard
- Subject Progress
- Curriculum Recommendations
- Performance Analytics
- AI Learning Assistant

---

## 👨‍🏫 Faculty Features

- Student Management
- Attendance Upload
- Attendance Reports
- Curriculum Management
- Report Downloads
- Dashboard Analytics

---

# 🚀 Highlights

✅ AI Powered Curriculum Generator

✅ Excel Attendance Processing

✅ Automatic Percentage Calculation

✅ PDF Report Generation

✅ JWT Authentication

✅ Responsive Dashboard

✅ Modern UI/UX

✅ REST API Architecture

---

# 🛠 Tech Stack

| Layer | Technology |
|--------|------------|
| Frontend | React.js + Vite |
| Backend | FastAPI |
| Language | Python |
| Styling | Tailwind CSS |
| Database | MongoDB |
| Authentication | JWT |
| AI | Google Gemini API |
| HTTP Client | Axios |
| Routing | React Router |
| Forms | React Hook Form |

---

# 📸 Application Modules

```text

🏠 Dashboard
      │
      ├──────────📚 Curriculum Generator
      │
      ├──────────📅 Attendance Calculator
      │
      ├──────────📥 Excel Upload
      │
      ├──────────📄 PDF Reports
      │
      ├──────────🤖 AI Chat Assistant
      │
      ├──────────📈 Analytics Dashboard
      │
      └──────────👤 User Profile

```

---

# 🚀 Quick Start

## 📋 Prerequisites

Install the following

- Python 3.11+
- Node.js 18+
- MongoDB
- Git

Verify

```bash
python --version

node -v

npm -v
```

---

# 📂 Clone Repository

```bash
git clone https://github.com/kasturiMahesh/smart-curriculam-and-attendence-calculator.git

cd smart-curriculam-and-attendence-calculator
```

---

# ⚙ Backend Setup

Create Virtual Environment

```bash
python -m venv venv
```

Activate

Windows

```powershell
venv\Scripts\activate
```

Linux/macOS

```bash
source venv/bin/activate
```

Install Packages

```bash
pip install -r requirements.txt
```

---

# 🌐 Frontend Setup

```bash
cd frontend

npm install
```

---

# ⚙ Configure Environment

Create

```
.env
```

Example

```env
MONGODB_URL=your_mongodb_connection

JWT_SECRET_KEY=your_secret_key

GEMINI_API_KEY=your_google_gemini_api_key
```

---

# ▶ Run Backend

```bash
uvicorn app.main:app --reload
```

Expected

```
INFO: Uvicorn running...

Application Started Successfully
```

---

# ▶ Run Frontend

```bash
npm run dev
```

Expected

```
http://localhost:5173
```

---

# 🌐 Live Application

### 🚀 Production Deployment

https://smart-curriculam-and-attendence-cal.vercel.app/login

---

# 📖 API Documentation

```
http://localhost:8000/docs
```

Interactive Swagger Documentation.

---

# 📊 Attendance Workflow

```text

Faculty Login
      │
      ▼
Upload Excel Sheet
      │
      ▼
Read Student Data
      │
      ▼
Attendance Calculation
      │
      ▼
Percentage Generation
      │
      ▼
Analytics Dashboard
      │
      ▼
PDF Report Download

```

---

# 🤖 AI Curriculum Workflow

```text

Student Details
      │
      ▼
Learning Goal
      │
      ▼
Gemini AI
      │
      ▼
Generate Curriculum
      │
      ▼
Weekly Roadmap
      │
      ▼
Study Resources
      │
      ▼
Learning Plan

```

---

# 📡 API Endpoints

| Method | Endpoint | Description |
|---------|----------|-------------|
| POST | `/auth/login` | 🔐 Login |
| POST | `/auth/register` | 👤 Register |
| POST | `/attendance/upload` | 📥 Upload Attendance |
| GET | `/attendance/report` | 📄 Attendance Report |
| GET | `/attendance/summary` | 📊 Attendance Summary |
| POST | `/curriculum/generate` | 🤖 Generate Curriculum |
| GET | `/students` | 👨‍🎓 Student List |
| GET | `/faculty` | 👨‍🏫 Faculty |
| GET | `/health` | ❤️ Health Check |

---

# 📂 Project Structure

```text

smart-curriculum-system/

│

├── frontend/

│ ├── src/

│ ├── components/

│ ├── pages/

│ ├── hooks/

│ ├── services/

│ └── assets/

│

├── backend/

│ ├── app/

│ ├── routes/

│ ├── models/

│ ├── services/

│ ├── database/

│ └── utils/

│

├── uploads/

├── reports/

├── requirements.txt

└── README.md

```

---

# 📈 Dashboard Features

- 📊 Attendance Analytics
- 📅 Daily Attendance
- 📄 PDF Reports
- 📥 Excel Import
- 🤖 AI Curriculum
- 👨‍🎓 Student Overview
- 📚 Subject Management
- 📈 Progress Tracking

---

# 🎯 Future Enhancements

- 🔔 Push Notifications
- 📱 Mobile Application
- 📡 Real-time Attendance
- 📷 QR Code Attendance
- 🎤 Voice Assistant
- 🤖 AI Chatbot
- ☁ Cloud Storage
- 📊 Advanced Analytics

---

# 🩺 Troubleshooting

| Problem | Solution |
|----------|----------|
| MongoDB Connection Failed | Verify MongoDB URL |
| Gemini API Error | Check API Key |
| Login Failed | Verify JWT Secret |
| Excel Upload Error | Check File Format |
| Frontend Not Loading | Run npm install |
| CORS Error | Enable Backend CORS |

---

# 🤝 Contributing

Contributions are always welcome!

1. Fork the repository
2. Create your feature branch

```bash
git checkout -b feature/NewFeature
```

3. Commit your changes

```bash
git commit -m "Added new feature"
```

4. Push

```bash
git push origin feature/NewFeature
```

5. Open a Pull Request

---

# ⭐ Support

If you found this project useful, don't forget to ⭐ star the repository.

It motivates further development and helps others discover the project.

---

<div align="center">

# 💙 Thank You

### Made with ❤️ using

**React • FastAPI • Python • MongoDB • Gemini AI • JWT • Tailwind CSS**

### 🌟 Star this repository if you like the project!

<p>

⭐ ⭐ ⭐ ⭐ ⭐

</p>

</div>
