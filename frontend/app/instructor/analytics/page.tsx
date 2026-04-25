"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import {
  ArrowLeft, Users, BarChart2, AlertCircle, LayoutDashboard,
  BookOpen, TrendingUp, Award, LogOut, ChevronDown, ChevronUp
} from "lucide-react";

const getInitials = (name: string) => name?.slice(0, 2).toUpperCase() || "U";

export default function InstructorAnalyticsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCourse, setExpandedCourse] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("access");
        if (!token) { router.push("/login"); return; }
        const [profileRes, analyticsRes] = await Promise.all([
          api.get("/auth/me/"),
          api.get("/instructor/analytics/")
        ]);
        setUser(profileRes.data);
        setAnalytics(analyticsRes.data);
        // Auto-expand first course
        if (analyticsRes.data.length > 0) setExpandedCourse(analyticsRes.data[0].id);
      } catch {
        localStorage.clear();
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [router]);

  // Global stats across all courses
  const totalCourses = analytics.length;
  const totalStudents = analytics.reduce((s, c) => s + c.total_students, 0);
  const totalCompletions = analytics.reduce((s, c) => s + c.completed_students, 0);
  const avgProgress = analytics.length > 0
    ? Math.round(analytics.reduce((s, c) => s + c.avg_progress, 0) / analytics.length)
    : 0;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm font-medium">Loading analytics...</p>
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
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Instructor Menu</span>
          </div>
          <Link href="/dashboard" className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm text-gray-500 hover:bg-gray-50 transition-all">
            <LayoutDashboard size={17} /> Dashboard
          </Link>
          <Link href="/instructor/dashboard" className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm text-gray-500 hover:bg-gray-50 transition-all">
            <BookOpen size={17} /> My Courses
          </Link>
          <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm bg-indigo-600 text-white shadow-sm">
            <BarChart2 size={17} /> Analytics
          </button>
        </nav>
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 mb-3">
            <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-black">
              {getInitials(user?.username || "")}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">{user?.username}</p>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-600">
                👩‍🏫 Instructor
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
      <div className="flex-1 ml-60 flex flex-col">

        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
              <ArrowLeft size={18} className="text-gray-500" />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Class Analytics</h1>
              <p className="text-xs text-gray-400">Student progress across all your courses</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2">
            <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[10px] font-black">
              {getInitials(user?.username || "")}
            </div>
            <div>
              <p className="text-xs font-bold text-gray-800 leading-tight">{user?.username}</p>
              <p className="text-[10px] font-semibold leading-tight text-purple-500">Instructor</p>
            </div>
          </div>
        </header>

        <main className="flex-1 p-8">

          {/* Global KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Total Courses", value: totalCourses, sub: "Published", icon: <BookOpen size={18} />, bg: "bg-indigo-50", text: "text-indigo-600" },
              { label: "Total Students", value: totalStudents, sub: "Enrolled", icon: <Users size={18} />, bg: "bg-blue-50", text: "text-blue-600" },
              { label: "Completions", value: totalCompletions, sub: "Course finishes", icon: <Award size={18} />, bg: "bg-green-50", text: "text-green-600" },
              { label: "Avg Progress", value: `${avgProgress}%`, sub: "Across all courses", icon: <TrendingUp size={18} />, bg: "bg-amber-50", text: "text-amber-600" },
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

          {/* Course Overview Table */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 hover:shadow-md transition-shadow">
            <h3 className="text-sm font-bold text-gray-900 mb-5">Course Overview</h3>
            {analytics.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen size={40} className="text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 font-semibold">No courses created yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {analytics.map((course) => (
                  <div key={course.id} className="border border-gray-100 rounded-xl overflow-hidden">
                    {/* Course Row */}
                    <button
                      onClick={() => setExpandedCourse(expandedCourse === course.id ? null : course.id)}
                      className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                        <BookOpen size={18} className="text-indigo-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-bold text-gray-900 truncate">{course.title}</p>
                          <div className="flex items-center gap-4 ml-4 flex-shrink-0">
                            <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{course.difficulty}</span>
                            <span className="text-xs text-gray-400">{course.total_lessons} lessons</span>
                            <span className="text-xs font-bold text-gray-700">{course.total_students} students</span>
                            <span className="text-xs font-bold text-indigo-600">{course.avg_progress}% avg</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${course.avg_progress}%` }} />
                          </div>
                          <span className="text-[10px] text-gray-400">{course.completed_students} completed</span>
                        </div>
                      </div>
                      {expandedCourse === course.id
                        ? <ChevronUp size={16} className="text-gray-400 flex-shrink-0" />
                        : <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />
                      }
                    </button>

                    {/* Expanded Student List */}
                    {expandedCourse === course.id && (
                      <div className="border-t border-gray-100 bg-gray-50 p-4">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <Users size={12} /> Enrolled Students ({course.students.length})
                        </p>

                        {course.students.length === 0 ? (
                          <div className="flex items-center gap-2 text-amber-600 bg-amber-50 border border-amber-200 p-3 rounded-xl text-xs font-semibold">
                            <AlertCircle size={16} /> No students enrolled yet.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {course.students.map((student: any, idx: number) => (
                              <div key={idx} className="bg-white rounded-xl border border-gray-100 p-3 flex items-center gap-4">
                                {/* Avatar */}
                                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-black flex-shrink-0">
                                  {student.username[0].toUpperCase()}
                                </div>
                                {/* Name + date */}
                                <div className="w-36 flex-shrink-0">
                                  <p className="text-xs font-bold text-gray-900 truncate">{student.username}</p>
                                  <p className="text-[10px] text-gray-400">{student.enrolled_at}</p>
                                </div>
                                {/* Progress bar */}
                                <div className="flex-1 flex items-center gap-3">
                                  <div className="flex-1 bg-gray-100 h-2 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all duration-700 ${student.is_completed ? 'bg-green-500' : 'bg-indigo-500'}`}
                                      style={{ width: `${student.percentage}%` }}
                                    />
                                  </div>
                                  <span className="text-xs font-black text-gray-700 w-10 text-right">{student.percentage}%</span>
                                </div>
                                {/* Lessons count */}
                                <span className="text-[10px] text-gray-400 flex-shrink-0 w-20 text-right">
                                  {student.completed_lessons}/{student.total_lessons} lessons
                                </span>
                                {/* Status badge */}
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0 ${
                                  student.is_completed
                                    ? 'bg-green-100 text-green-600'
                                    : student.percentage > 0
                                    ? 'bg-indigo-100 text-indigo-600'
                                    : 'bg-gray-100 text-gray-400'
                                }`}>
                                  {student.is_completed ? '✓ Done' : student.percentage > 0 ? 'Active' : 'Not started'}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </main>
      </div>
    </div>
  );
}