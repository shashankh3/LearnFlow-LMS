import Link from "next/link";
import { BookOpen, Brain, BarChart3, Users, CheckCircle, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden">

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2 text-indigo-600 font-bold text-xl">
          <BookOpen size={24} />
          <span>LearnFlow</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
          <a href="#features" className="hover:text-indigo-600 transition">Features</a>
          <a href="#stats" className="hover:text-indigo-600 transition">Why Us</a>
          <Link href="/courses" className="hover:text-indigo-600 transition">Courses</Link>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm font-semibold text-gray-700 hover:text-indigo-600 transition px-4 py-2">
            Login
          </Link>
          <Link href="/register" className="text-sm font-semibold bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700 transition">
            Get Started Free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-4 overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-60" />
        <div className="absolute top-20 left-[10%] w-72 h-72 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float-slow" />
        <div className="absolute top-10 right-[15%] w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float-medium" />
        <div className="absolute bottom-10 left-[30%] w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-float-fast" />
        <div className="absolute top-40 right-[5%] w-64 h-64 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float-slow" />

        <div className="relative max-w-5xl mx-auto text-center">
          <div className="animate-fade-up">
            <span className="inline-block bg-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-full mb-6 uppercase tracking-wide">
              🤖 AI-Powered Learning
            </span>
          </div>
          <h1 className="animate-fade-up text-5xl md:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
            Learn Smarter with <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
              LearnFlow LMS
            </span>
          </h1>
          <p className="animate-fade-up-delay text-xl text-gray-500 max-w-2xl mx-auto mb-10">
            The modern learning platform where AI generates quizzes instantly, instructors track every student's progress, and learning never stops.
          </p>
          <div className="animate-fade-up-delay-2 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="inline-flex items-center gap-2 bg-indigo-600 text-white font-semibold px-8 py-4 rounded-xl hover:bg-indigo-700 hover:scale-105 transition-all text-lg shadow-lg shadow-indigo-200">
              Start Learning Free <ArrowRight size={20} />
            </Link>
            <Link href="/courses" className="inline-flex items-center gap-2 border-2 border-gray-200 text-gray-700 font-semibold px-8 py-4 rounded-xl hover:border-indigo-300 hover:text-indigo-600 hover:scale-105 transition-all text-lg">
              Browse Courses
            </Link>
          </div>
          <div className="mt-16 flex flex-wrap justify-center gap-4">
            {["✅ Free to Use", "🤖 Gemini AI", "⚡ Real-time Progress", "🔐 JWT Secured"].map((badge) => (
              <span key={badge} className="bg-white border border-gray-200 text-gray-600 text-sm font-medium px-4 py-2 rounded-full shadow-sm hover:shadow-md hover:-translate-y-1 transition-all">
                {badge}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Strip */}
      <section id="stats" className="bg-indigo-600 py-12 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
          {[
            { value: "AI-Powered", label: "Quiz Generation" },
            { value: "Real-Time", label: "Progress Tracking" },
            { value: "JWT Secure", label: "Authentication" },
            { value: "Free Tier", label: "Gemini AI API" },
          ].map((stat) => (
            <div key={stat.label} className="hover:scale-105 transition-transform">
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-indigo-200 text-sm mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">Everything you need to learn & teach</h2>
          <p className="text-gray-500 text-center mb-14 max-w-xl mx-auto">Built with Django, Next.js, and Gemini AI for a complete end-to-end learning experience.</p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: <Brain size={28} className="text-indigo-600" />, title: "AI Quiz Generation", desc: "Gemini AI auto-generates 3 MCQ questions for every lesson the moment an instructor publishes it." },
              { icon: <BarChart3 size={28} className="text-indigo-600" />, title: "Progress Dashboard", desc: "Students see real-time progress bars. Instructors track completion rates for every enrolled student." },
              { icon: <Users size={28} className="text-indigo-600" />, title: "Role-Based Access", desc: "Separate flows for Instructors and Students — each sees only what's relevant to their role." },
              { icon: <CheckCircle size={28} className="text-indigo-600" />, title: "Lesson Completion", desc: "Students mark lessons complete after passing the quiz, updating their enrollment progress instantly." },
              { icon: <BookOpen size={28} className="text-indigo-600" />, title: "Course Management", desc: "Instructors create and manage courses with multiple lessons, descriptions, and difficulty levels." },
              { icon: <ArrowRight size={28} className="text-indigo-600" />, title: "REST API Backend", desc: "Fully documented Django REST Framework API with Swagger UI available at /api/docs/." },
            ].map((f) => (
              <div key={f.title} className="group p-6 border border-gray-100 rounded-2xl hover:shadow-lg hover:border-indigo-200 hover:-translate-y-1 transition-all cursor-default">
                <div className="mb-4 group-hover:scale-110 transition-transform inline-block">{f.icon}</div>
                <h3 className="font-semibold text-gray-800 text-lg mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 px-4 bg-gradient-to-br from-indigo-600 to-purple-700 text-white text-center overflow-hidden">
        <div className="absolute top-0 left-[20%] w-72 h-72 bg-white rounded-full opacity-5 animate-float-slow" />
        <div className="absolute bottom-0 right-[10%] w-96 h-96 bg-purple-300 rounded-full opacity-10 animate-float-medium" />
        <div className="relative">
          <h2 className="text-4xl font-bold mb-4">Ready to start learning?</h2>
          <p className="text-indigo-200 mb-8 text-lg">Join LearnFlow today — it is completely free.</p>
          <Link href="/register" className="inline-flex items-center gap-2 bg-white text-indigo-600 font-bold px-8 py-4 rounded-xl hover:bg-indigo-50 hover:scale-105 transition-all text-lg shadow-xl">
            Create Free Account <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 px-4 text-center text-sm">
        <p>© 2025 LearnFlow LMS — Built with Django + Next.js + Gemini AI</p>
      </footer>

    </div>
  );
}
