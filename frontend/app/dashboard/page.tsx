"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import {
  LogOut, LayoutDashboard, Compass, Award, CheckCircle,
  BookOpen, TrendingUp, Star, BarChart2, ChevronRight,
  GraduationCap
} from "lucide-react";

const getCourseThumbnail = (url: string | null | undefined, title: string) => {
  if (url) {
    const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    if (ytMatch && ytMatch[1]) return `https://img.youtube.com/vi/${ytMatch[1]}/maxresdefault.jpg`;
  }
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(title)}&background=4f46e5&color=fff&size=512`;
};

const getInitials = (name: string) => name?.slice(0, 2).toUpperCase() || "U";

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
      } catch {
        localStorage.clear();
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [router]);

  const analyticsPath = user?.is_instructor ? "/instructor/analytics" : "/student/analytics";

  const totalCourses = myCourses.length;
  const completedCourses = myCourses.filter((e: any) => e.is_completed).length;
  const inProgressCourses = myCourses.filter((e: any) => !e.is_completed && e.progress > 0).length;
  const avgProgress = totalCourses > 0
    ? Math.round(myCourses.reduce((s: number, e: any) => s + (e.progress ?? 0), 0) / totalCourses)
    : 0;
  const totalLessons = myCourses.reduce((s: number, e: any) => s + (e.course_details?.lessons?.length || 0), 0);
  const completedLessons = myCourses.reduce((s: number, e: any) => s + (e.completed_lessons?.length || 0), 0);

  const renderCourseCard = (enrollment: any) => {
    const course = enrollment.course_details;
    if (!course) return null;
    const progress = enrollment.progress ?? 0;
    const isFinished = enrollment.is_completed === true;
    const totalL = course.lessons?.length || 0;
    const completedL = enrollment.completed_lessons?.length || 0;

    return (
      <div key={enrollment.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col group">
        <div className="relative aspect-video overflow-hidden bg-gray-100">
          <img
            src={getCourseThumbnail(course.lessons?.[0]?.video_url, course.title)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            alt={course.title}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide ${
              isFinished ? 'bg-green-500 text-white' : progress > 0 ? 'bg-indigo-600 text-white' : 'bg-white/20 backdrop-blur text-white border border-white/30'
            }`}>
              {isFinished ? '✓ Completed' : progress > 0 ? `${progress}% done` : 'Not started'}
            </span>
            {isFinished && <CheckCircle size={20} className="text-green-400 drop-shadow" />}
          </div>
        </div>

        <div className="p-5 flex flex-col flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded-full">{course.difficulty}</span>
            <span className="text-[10px] text-gray-400">{totalL} lessons</span>
          </div>
          <h3 className="text-sm font-bold text-gray-900 mb-1 leading-snug line-clamp-2">{course.title}</h3>
          <p className="text-xs text-gray-400 mb-4">by {course.instructor_name}</p>

          <div className="mt-auto">
            <div className="flex justify-between text-[10px] font-semibold text-gray-400 mb-1.5">
              <span>Progress</span>
              <span className="text-indigo-600">{completedL}/{totalL} lessons</span>
            </div>
            <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden mb-4">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${isFinished ? 'bg-green-500' : 'bg-indigo-600'}`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <Link
              href={`/courses/${course.slug}`}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-xs hover:bg-indigo-700 transition-all"
            >
              {isFinished ? "Review Course" : progress > 0 ? "Resume Learning" : "Start Course"}
              <ChevronRight size={14} />
            </Link>
            {isFinished && (
              <Link
                href={`/courses/${course.slug}/certificate`}
                className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl font-semibold text-xs hover:bg-amber-100 transition-all"
              >
                <Award size={14} /> Claim Certificate
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm font-medium">Loading your dashboard...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-gray-100 flex flex-col fixed top-0 left-0 h-screen z-30">
        <div className="px-6 py-5 border-b border-gray-100">
          <span className="text-xl font-black text-indigo-600 tracking-tight">LEARNFLOW</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          <div className="px-3 py-2 mb-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Main Menu</span>
          </div>
          <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm bg-indigo-600 text-white shadow-sm shadow-indigo-200">
            <LayoutDashboard size={17} /> Dashboard
          </button>
          <Link href="/courses" className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm text-gray-500 hover:bg-gray-50 transition-all">
            <Compass size={17} /> Explore
          </Link>
          {/* ✅ Routes to instructor or student analytics based on role */}
          <Link href={analyticsPath} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm text-gray-500 hover:bg-gray-50 transition-all">
            <BarChart2 size={17} /> Analytics
          </Link>
        </nav>

        {/* User profile at bottom */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 mb-3">
            <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-black flex-shrink-0">
              {getInitials(user?.username || "")}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">{user?.username}</p>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                user?.is_instructor ? 'bg-purple-100 text-purple-600' : 'bg-green-100 text-green-600'
              }`}>
                {user?.is_instructor ? '👩‍🏫 Instructor' : '👨‍🎓 Student'}
              </span>
            </div>
          </div>
          <button
            onClick={() => { localStorage.clear(); router.push("/login"); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm text-red-500 hover:bg-red-50 transition-all"
          >
            <LogOut size={17} /> Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 ml-60 flex flex-col min-h-screen">

        {/* Top navbar */}
        <header className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between sticky top-0 z-20">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Dashboard</h1>
            <p className="text-xs text-gray-400">Welcome back, {user?.username}</p>
          </div>
          {/* ✅ Username + role chip top right */}
          <div className="flex items-center gap-2.5 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2">
            <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[10px] font-black">
              {getInitials(user?.username || "")}
            </div>
            <div>
              <p className="text-xs font-bold text-gray-800 leading-tight">{user?.username}</p>
              <p className={`text-[10px] font-semibold leading-tight ${user?.is_instructor ? 'text-purple-500' : 'text-green-500'}`}>
                {user?.is_instructor ? 'Instructor' : 'Student'}
              </p>
            </div>
          </div>
        </header>

        <main className="flex-1 p-8">

          {/* Stats row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Enrolled", value: totalCourses, sub: "Total courses", icon: <BookOpen size={18} />, bg: "bg-indigo-50", text: "text-indigo-600" },
              { label: "Completed", value: completedCourses, sub: "Courses finished", icon: <CheckCircle size={18} />, bg: "bg-green-50", text: "text-green-600" },
              { label: "In Progress", value: inProgressCourses, sub: "Ongoing courses", icon: <TrendingUp size={18} />, bg: "bg-amber-50", text: "text-amber-600" },
              { label: "Lessons Done", value: `${completedLessons}/${totalLessons}`, sub: "Overall lessons", icon: <Star size={18} />, bg: "bg-purple-50", text: "text-purple-600" },
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{stat.label}</span>
                  <div className={`p-2 rounded-xl ${stat.bg} ${stat.text}`}>{stat.icon}</div>
                </div>
                <p className="text-2xl font-black text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-400 mt-1">{stat.sub}</p>
              </div>
            ))}
          </div>

          {/* Progress + Analytics CTA */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Overall Learning Progress</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{completedLessons} of {totalLessons} lessons completed</p>
                </div>
                <span className="text-2xl font-black text-indigo-600">{avgProgress}%</span>
              </div>
              <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden mb-5">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-1000"
                  style={{ width: `${avgProgress}%` }}
                />
              </div>
              <div className="space-y-2.5">
                {myCourses.slice(0, 3).map((e: any) => (
                  <div key={e.id} className="flex items-center gap-3">
                    <span className="text-[11px] text-gray-500 w-36 truncate font-medium">{e.course_details?.title}</span>
                    <div className="flex-1 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${e.progress ?? 0}%` }} />
                    </div>
                    <span className="text-[11px] font-bold text-gray-400 w-8 text-right">{e.progress ?? 0}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ✅ Analytics CTA — routes based on role */}
            <Link
              href={analyticsPath}
              className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl p-6 flex flex-col justify-between text-white hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer group"
            >
              <div>
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                  <BarChart2 size={24} className="text-white" />
                </div>
                <h3 className="font-black text-lg leading-tight mb-2">View Analytics</h3>
                <p className="text-indigo-200 text-xs font-medium leading-relaxed">
                  {user?.is_instructor
                    ? "See how your students are performing, course enrollments and progress."
                    : "Deep dive into your learning patterns, quiz scores and course completion trends."}
                </p>
              </div>
              <div className="flex items-center gap-2 mt-6 text-sm font-bold text-white/80 group-hover:text-white transition-colors">
                Open Analytics <ChevronRight size={16} />
              </div>
            </Link>
          </div>

          {/* My Courses */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-gray-900">My Courses</h2>
            <Link href="/courses" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
              Explore More <ChevronRight size={14} />
            </Link>
          </div>

          {myCourses.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
              <GraduationCap size={48} className="text-gray-200 mx-auto mb-4" />
              <p className="text-gray-500 font-bold mb-1">No courses yet</p>
              <p className="text-gray-300 text-sm mb-6">Start your learning journey today</p>
              <Link href="/courses" className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-all">
                Explore Courses
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {myCourses.map(enroll => renderCourseCard(enroll))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}