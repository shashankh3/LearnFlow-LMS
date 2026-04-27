# LearnFlow LMS 🚀
**A Full-Stack AI-Powered Learning Management System**

LearnFlow is a modern LMS built to bridge the gap between video learning and active knowledge retention. It features a dual-portal system for Instructors and Students, integrated with Google's Gemini AI to provide real-time interactive challenges.

---

## 🌟 Key Features

### 👨‍🏫 Instructor Portal
- **Course Architect:** Create and manage courses with rich text and video lesson integration.
- **Live Analytics:** Track student enrollment and real-time progress percentages across all courses.
- **Dynamic Content:** Edit lessons and curriculum on the fly.

### 🎓 Student Experience
- **Interactive Learning:** Enroll in courses and track personal progress with a visual dashboard.
- **"Test Your Might" AI Gauntlet:** Generate interactive quizzes on-demand, powered by **Gemini AI**, based specifically on the current lesson's content.
- **Professional Certification:** Unlock and generate high-fidelity, print-ready Certificates of Completion upon hitting 100% progress.

---

## 🛠️ Technical Stack

- **Frontend:** Next.js 14, Tailwind CSS, Lucide Icons, Axios, React Hot Toast.
- **Backend:** Django, Django REST Framework (DRF), SimpleJWT (Auth), Celery.
- **AI Integration:** Google Generative AI (Gemini).
- **Database:** SQLite (Development).

---

## 🔑 Portfolio Demo Access
Use these credentials to bypass registration and test the application immediately:
- **Instructor Account:** `jojoINSTR` / `123456`
- **Student Account:** `newbie99` / `newnewnew`

---

## 🚀 Getting Started (Local Development)

### 1. Clone the Repository
```bash
git clone [https://github.com/shashankh3/LearnFlow-LMS.git](https://github.com/shashankh3/LearnFlow-LMS.git)
cd LearnFlow-LMS
```

### 2. Backend Setup & Server
Open your terminal and run the following commands sequentially to configure the database and start the Django server:
```bash
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### 3. Background Tasks (Celery Worker)
To process the AI quiz generation, open a **new** terminal window, activate the environment, and start the Celery worker:
```bash
cd backend
.\.venv\Scripts\activate
celery -A config worker -l info --pool=solo
```

### 4. Frontend Setup
Open a **third** terminal window and run the following commands to install dependencies and start the Next.js interface:
```bash
cd frontend
npm install
npm run dev
```

---

## 📚 API Documentation
This repository includes a fully configured Postman collection for backend testing.
- Import the `LearnFlow_Postman_Collection.json` file into Postman to instantly test all endpoints, including Authentication, Course Management, and AI Integrations.

---

## 📜 License
Built as a technical showcase for modern full-stack development.
