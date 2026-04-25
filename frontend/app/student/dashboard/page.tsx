"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import {
  LayoutDashboard, Compass, BarChart2, LogOut,
  BookOpen, Award, ChevronRight, TrendingUp,
  Clock, CheckCircle, Play
} from "lucide-react";

const getYoutubeThumbnail = (lessons: any[]) => {
  for (const lesson of lessons || []) {
    if (lesson.video_url) {
      const match = lesson.video_url.match(
        /(?:youtu\.be\/|youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
      );
      if (match?.[1]) return `https://img.youtube.com/vi/${match[1]}/maxresdefault.jpg`;
    }
  }
  return null;
};

const getInitials = (name: string) => name?.slice(0, 2).toUpperCase() || "U";

// ✅ Professional greeting based on time of day
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

export default function StudentDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [enrollments, setEnrollments] = useState<any[]>([]);
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
        if (profileRes.data.is_instructor) { router.replace("/instructor/dashboard"); return; }
        setUser(profileRes.data);
        setEnrollments(enrollRes.data);
      } catch {
        localStorage.clear();
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [router]);

  const totalProgress = enrollments.length > 0
    ? Math.round(enrollments.reduce((s, e) => s + (e.progress || 0), 0) / enrollments.length)
    : 0;
  const completedCourses = enrollments.filter(e => e.is_completed).length;
  const inProgressCourses = enrollments.filter(e => !e.is_completed).length;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7]">
      <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex">

      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-gray-100 flex flex-col fixed top-0 left-0 h-screen z-30">
        <div className="px-6 py-5 border-b border-gray-100">
          <span className="text-xl font-black text-indigo-600 tracking-tight">LEARNFLOW</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          <div className="px-3 py-2 mb-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Menu</span>
          </div>
          <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm bg-indigo-600 text-white shadow-sm">
            <LayoutDashboard size={17} /> Dashboard
          </button>
          <Link href="/courses" className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm text-gray-500 hover:bg-gray-50 transition-all">
            <Compass size={17} /> Explore
          </Link>
          <Link href="/student/analytics" className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm text-gray-500 hover:bg-gray-50 transition-all">
            <BarChart2 size={17} /> Analytics
          </Link>
        </nav>
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 mb-3">
            <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-black">
              {getInitials(user?.username || "")}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">{user?.username}</p>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-600">
                👨‍🎓 Student
              </span>
            </div>
          </div>
          <button onClick={() => { localStorage.clear(); router.push("/login"); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm text-red-500 hover:bg-red-50 transition-all">
            <LogOut size={17} /> Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 ml-60 flex flex-col min-h-screen">

        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-8 py-5 sticky top-0 z-20">
          <div className="flex items-center justify-between">
            <div>
              {/* ✅ Professional greeting */}
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-0.5">
                {getGreeting()}
              </p>
              <h1 className="text-xl font-black text-gray-900">
                {user?.username}
              </h1>
            </div>
            <div className="flex items-center gap-2.5 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2">
              <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[10px] font-black">
                {getInitials(user?.username || "")}
              </div>
              <div>
                <p className="text-xs font-bold text-gray-800 leading-tight">{user?.username}</p>
                <p className="text-[10px] font-semibold leading-tight text-green-500">Student</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-8">

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                  <BookOpen size={18} className="text-indigo-600" />
                </div>
                <span className="text-2xl font-black text-gray-900">{enrollments.length}</span>
              </div>
              <p className="text-xs font-bold text-gray-500">Enrolled Courses</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                  <CheckCircle size={18} className="text-green-600" />
                </div>
                <span className="text-2xl font-black text-gray-900">{completedCourses}</span>
              </div>
              <p className="text-xs font-bold text-gray-500">Completed</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                  <TrendingUp size={18} className="text-amber-600" />
                </div>
                <span className="text-2xl font-black text-gray-900">{totalProgress}%</span>
              </div>
              <p className="text-xs font-bold text-gray-500">Avg. Progress</p>
            </div>
          </div>

          {/* My Learning */}
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-base font-black text-gray-900">My Learning</h2>
            <Link href="/courses" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors">
              Explore more <ChevronRight size={13} />
            </Link>
          </div>

          {enrollments.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
              <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-5">
                <BookOpen size={36} className="text-indigo-400" />
              </div>
              <h3 className="text-lg font-black text-gray-900 mb-2">No courses yet</h3>
              <p className="text-sm text-gray-400 mb-8 max-w-xs mx-auto">
                Browse the course catalog and start your learning journey today.
              </p>
              <Link href="/courses"
                className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
                <Compass size={18} /> Browse Courses
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {enrollments.map((enrollment: any) => {
                const course = enrollment.course_details;
                if (!course) return null;
                const thumbnail = getYoutubeThumbnail(course.lessons);
                const progress = enrollment.progress || 0;
                const isCompleted = enrollment.is_completed;

                return (
                  <div key={enrollment.id}
                    className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:shadow-gray-200/60 transition-all duration-300 group flex flex-col">

                    {/* Thumbnail */}
                    <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-indigo-100 to-violet-100">
                      {thumbnail ? (
                        <img src={thumbnail} alt={course.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen size={32} className="text-indigo-300" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                      {/* Completed badge */}
                      {isCompleted && (
                        <div className="absolute top-3 right-3">
                          <span className="flex items-center gap-1 px-2.5 py-1 bg-green-500 text-white text-[10px] font-bold rounded-full">
                            <CheckCircle size={10} /> Completed
                          </span>
                        </div>
                      )}

                      {/* Difficulty */}
                      <div className="absolute top-3 left-3">
                        <span className="px-2.5 py-1 bg-black/60 backdrop-blur text-white text-[10px] font-bold rounded-full">
                          {course.difficulty}
                        </span>
                      </div>

                      {/* Progress bar over image bottom */}
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
                        <div className="h-full bg-indigo-500 transition-all duration-700"
                          style={{ width: `${progress}%` }} />
                      </div>
                    </div>

                    {/* Card body */}
                    <div className="p-5 flex flex-col flex-1">
                      <h3 className="text-sm font-black text-gray-900 line-clamp-2 mb-1 leading-snug">
                        {course.title}
                      </h3>
                      <p className="text-[11px] text-gray-400 mb-4">
                        By {course.instructor_name} · {course.lessons?.length || 0} lessons
                      </p>

                      {/* Progress */}
                      <div className="mb-4">
                        <div className="flex justify-between text-[10px] font-bold mb-1.5">
                          <span className="text-gray-400">Progress</span>
                          <span className={isCompleted ? "text-green-600" : "text-indigo-600"}>{progress}%</span>
                        </div>
                        <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-700 ${isCompleted ? 'bg-green-500' : 'bg-indigo-500'}`}
                            style={{ width: `${progress}%` }} />
                        </div>
                      </div>

                      {/* CTA buttons */}
                      <div className="mt-auto flex flex-col gap-2">
                        <Link href={`/courses/${course.slug}`}
                          className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-700 transition-all">
                          <Play size={12} fill="currentColor" />
                          {progress === 0 ? "Start Learning" : isCompleted ? "Review Course" : "Continue Learning"}
                        </Link>

                        {/* ✅ Certificate button — only shows when completed */}
                        {isCompleted && (
                          <Link href={`/courses/${course.slug}/certificate`}
                            className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-xl font-bold text-xs hover:opacity-90 transition-all">
                            <Award size={12} /> Claim Certificate
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}