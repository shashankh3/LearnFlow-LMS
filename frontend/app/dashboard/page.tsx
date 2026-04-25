"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import {
  LogOut, LayoutDashboard, Compass, Award, CheckCircle,
  BookOpen, TrendingUp, Clock, Star
} from "lucide-react";
import toast from "react-hot-toast";

const getCourseThumbnail = (url: string | null | undefined, title: string) => {
  if (url) {
    const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    if (ytMatch && ytMatch[1]) return `https://img.youtube.com/vi/${ytMatch[1]}/maxresdefault.jpg`;
  }
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(title)}&background=4f46e5&color=fff&size=512`;
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [myCourses, setMyCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("access");
        if (!token) { router.push("/login"); return; }

        const [profileRes, enrollRes] = await Promise.all([
          api.get("/auth/me/"),
          api.get("/enrollments/")
        ]);

        setUser(profileRes.data);
        setMyCourses(enrollRes.data);
      } catch (err) {
        localStorage.clear();
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [router]);

  // Analytics calculations
  const totalCourses = myCourses.length;
  const completedCourses = myCourses.filter((e: any) => e.is_completed).length;
  const inProgressCourses = myCourses.filter((e: any) => !e.is_completed && e.progress > 0).length;
  const avgProgress = totalCourses > 0
    ? Math.round(myCourses.reduce((sum: number, e: any) => sum + (e.progress ?? 0), 0) / totalCourses)
    : 0;
  const totalLessons = myCourses.reduce((sum: number, e: any) => sum + (e.course_details?.lessons?.length || 0), 0);
  const completedLessons = myCourses.reduce((sum: number, e: any) => sum + (e.completed_lessons?.length || 0), 0);

  const renderCourseCard = (enrollment: any) => {
    const course = enrollment.course_details;
    if (!course) return null;

    const progress = enrollment.progress ?? 0;
    const isFinished = enrollment.is_completed === true;
    const totalL = course.lessons?.length || 0;
    const completedL = enrollment.completed_lessons?.length || 0;

    return (
      <div key={enrollment.id} className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full group">
        {/* Thumbnail */}
        <div className="aspect-video relative overflow-hidden">
          <img
            src={getCourseThumbnail(course.lessons?.[0]?.video_url, course.title)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            alt={course.title}
          />
          {/* Progress overlay badge */}
          <div className="absolute bottom-3 left-3">
            <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest ${
              isFinished ? 'bg-green-500 text-white' : progress > 0 ? 'bg-indigo-600 text-white' : 'bg-slate-900/70 text-white'
            }`}>
              {isFinished ? '✓ COMPLETED' : progress > 0 ? `${progress}% DONE` : 'NOT STARTED'}
            </span>
          </div>
          {isFinished && (
            <div className="absolute top-3 right-3 bg-green-500 text-white p-2 rounded-full shadow-lg">
              <CheckCircle size={18} />
            </div>
          )}
        </div>

        <div className="p-6 flex flex-col flex-1">
          {/* Difficulty badge */}
          <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2">
            {course.difficulty} · {totalL} lessons
          </span>
          <h3 className="text-lg font-bold text-slate-900 mb-1 leading-tight">{course.title}</h3>
          <p className="text-xs text-slate-400 mb-4">By {course.instructor_name}</p>

          {/* Progress bar */}
          <div className="mb-1 flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-400">PROGRESS</span>
            <span className="text-[10px] font-black text-indigo-600">{completedL}/{totalL} lessons</span>
          </div>
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mb-6">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${isFinished ? 'bg-green-500' : 'bg-indigo-600'}`}
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Action buttons */}
          <div className="mt-auto space-y-2">
            <Link
              href={`/courses/${course.slug}`}
              className="w-full block text-center py-3.5 bg-slate-900 text-white rounded-2xl font-bold text-xs tracking-widest hover:bg-indigo-600 transition-all"
            >
              {isFinished ? "REVIEW COURSE" : progress > 0 ? "RESUME LEARNING" : "START COURSE"}
            </Link>

            {isFinished && (
              <Link
                href={`/courses/${course.slug}/certificate`}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white rounded-2xl font-black text-xs tracking-widest hover:scale-[1.02] transition-all shadow-lg shadow-yellow-200"
              >
                <Award size={14} /> CLAIM CERTIFICATE
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-slate-400 font-bold">
      Loading your dashboard...
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col sticky top-0 h-screen">
        <div className="p-8 font-black text-2xl text-indigo-600 tracking-tighter">LEARNFLOW</div>
        <nav className="flex-1 px-4 space-y-2">
          <button className="w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold bg-indigo-600 text-white shadow-lg shadow-indigo-100">
            <LayoutDashboard size={20} /> Dashboard
          </button>
          <Link href="/courses" className="w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition-all">
            <Compass size={20} /> Explore
          </Link>
        </nav>

        {/* Sidebar mini stats */}
        <div className="mx-4 mb-4 p-4 bg-indigo-50 rounded-2xl">
          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">Your Stats</p>
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-slate-600">
              <span>Enrolled</span><span className="text-indigo-600">{totalCourses}</span>
            </div>
            <div className="flex justify-between text-xs font-bold text-slate-600">
              <span>Completed</span><span className="text-green-600">{completedCourses}</span>
            </div>
            <div className="flex justify-between text-xs font-bold text-slate-600">
              <span>Lessons Done</span><span className="text-indigo-600">{completedLessons}/{totalLessons}</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => { localStorage.clear(); router.push("/login"); }}
          className="m-4 flex items-center gap-3 px-6 py-4 rounded-2xl font-bold text-red-500 hover:bg-red-50 transition-all"
        >
          <LogOut size={20} /> Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10 overflow-y-auto">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-black text-slate-900 mb-1">Welcome back, {user?.username} 👋</h1>
          <p className="text-slate-500 font-medium">Here's your learning progress at a glance.</p>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Enrolled</span>
              <div className="p-2 bg-indigo-50 rounded-xl"><BookOpen size={16} className="text-indigo-600" /></div>
            </div>
            <p className="text-3xl font-black text-slate-900">{totalCourses}</p>
            <p className="text-xs text-slate-400 mt-1">Total courses</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Completed</span>
              <div className="p-2 bg-green-50 rounded-xl"><CheckCircle size={16} className="text-green-600" /></div>
            </div>
            <p className="text-3xl font-black text-slate-900">{completedCourses}</p>
            <p className="text-xs text-slate-400 mt-1">Courses finished</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avg Progress</span>
              <div className="p-2 bg-yellow-50 rounded-xl"><TrendingUp size={16} className="text-yellow-600" /></div>
            </div>
            <p className="text-3xl font-black text-slate-900">{avgProgress}%</p>
            <p className="text-xs text-slate-400 mt-1">Across all courses</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lessons</span>
              <div className="p-2 bg-purple-50 rounded-xl"><Star size={16} className="text-purple-600" /></div>
            </div>
            <p className="text-3xl font-black text-slate-900">{completedLessons}</p>
            <p className="text-xs text-slate-400 mt-1">of {totalLessons} completed</p>
          </div>
        </div>

        {/* Overall progress bar */}
        {totalCourses > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-10">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-black text-slate-900">Overall Learning Progress</h3>
                <p className="text-xs text-slate-400">{completedLessons} of {totalLessons} lessons completed across all courses</p>
              </div>
              <span className="text-2xl font-black text-indigo-600">{avgProgress}%</span>
            </div>
            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-1000"
                style={{ width: `${avgProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* My Courses */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-slate-900">My Courses</h2>
          <Link href="/courses" className="text-xs font-bold text-indigo-600 hover:underline">
            + Explore More
          </Link>
        </div>

        {myCourses.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-[2rem] border border-slate-200">
            <BookOpen size={48} className="text-slate-300 mx-auto mb-4" />
            <p className="text-slate-400 text-lg font-bold mb-2">No courses yet</p>
            <p className="text-slate-300 text-sm mb-6">Start your learning journey today</p>
            <Link href="/courses" className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all">
              Explore Courses
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {myCourses.map(enroll => renderCourseCard(enroll))}
          </div>
        )}
      </main>
    </div>
  );
}