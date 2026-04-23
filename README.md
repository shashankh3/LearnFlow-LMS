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
- **"Test Your Might" AI Gauntlet:** Generate 7-question interactive quizzes on-demand, powered by **Gemini AI**, based specifically on the current lesson's content.
- **Professional Certification:** Unlock and generate high-fidelity, print-ready Certificates of Completion upon hitting 100% progress.

---

## 🛠️ Technical Stack

- **Frontend:** Next.js 14, Tailwind CSS, Lucide Icons, Axios.
- **Backend:** Django, Django REST Framework (DRF), SimpleJWT (Auth).
- **AI Integration:** Google Generative AI (Gemini-1.5-Flash).
- **Database:** SQLite (Development).

---

## 🚀 Getting Started

### Backend Setup
1. Navigate to `/backend`.
2. Activate virtual environment: `.venv\Scripts\activate`.
3. Install dependencies: `pip install -r requirements.txt`. (Note: ensure `google-generativeai` and `django-cors-headers` are installed).
4. Run migrations: `python manage.py migrate`.
5. Start server: `python manage.py runserver`.

### Frontend Setup
1. Navigate to `/frontend`.
2. Install dependencies: `npm install`.
3. Start development server: `npm run dev`.

---

## 📜 License
Built as a technical showcase for modern full-stack development.