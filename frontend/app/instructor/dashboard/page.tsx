"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import {
  LogOut, LayoutDashboard, BarChart2, BookOpen,
  TrendingUp, Users, Plus, Edit, Trash2,
  ChevronRight, Video, FileText, AlertCircle
} from "lucide-react";

const getInitials = (name: string) => name?.slice(0, 2).toUpperCase() || "U";

export default function InstructorDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("access");
        if (!token) { router.push("/login"); return; }
        const [profileRes, coursesRes, analyticsRes] = await Promise.all([
          api.get("/auth/me/"),
          api.get("/courses/"),
          api.get("/instructor/analytics/")
        ]);
        // Redirect students away
        if (!profileRes.data.is_instructor) { router.replace("/student/dashboard"); return; }
        setUser(profileRes.data);
        // Only show courses created by this instructor
        const myCourses = coursesRes.data.filter((c: any) => c.instructor_name === profileRes.data.username);
        setCourses(myCourses);
        setAnalytics(analyticsRes.data);
      } catch {
        localStorage.clear();
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [router]);

  const handleDelete = async (slug: string, id: number) => {
    if (!confirm("Delete this course? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await api.delete(`/courses/${slug}/`);
      setCourses(prev => prev.filter(c => c.slug !== slug));
      setAnalytics(prev => prev.filter(c => c.slug !== slug));
    } catch {
      alert("Failed to delete course.");
    } finally {
      setDeletingId(null);
    }
  };

  // Stats
  const totalStudents = analytics.reduce((s, c) => s + c.total_students, 0);
  const totalLessons = courses.reduce((s: number, c: any) => s + (c.lessons?.length || 0), 0);
  const avgProgress = analytics.length > 0
    ? Math.round(analytics.reduce((s, c) => s + c.avg_progress, 0) / analytics.length) : 0;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
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
          <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm bg-indigo-600 text-white shadow-sm">
            <LayoutDashboard size={17} /> Dashboard
          </button>
          <Link href="/instructor/analytics" className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm text-gray-500 hover:bg-gray-50 transition-all">
            <BarChart2 size={17} /> Analytics
          </Link>
          <Link href="/courses/create" className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm text-gray-500 hover:bg-gray-50 transition-all">
            <Plus size={17} /> Create Course
          </Link>
        </nav>
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 mb-3">
            <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-black">
              {getInitials(user?.username || "")}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">{user?.username}</p>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-600">👩‍🏫 Instructor</span>
            </div>
          </div>
          <button onClick={() => { localStorage.clear(); router.push("/login"); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm text-red-500 hover:bg-red-50 transition-all">
            <LogOut size={17} /> Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 ml-60 flex flex-col min-h-screen">
        {/* Top navbar */}
        <header className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between sticky top-0 z-20">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Instructor Dashboard</h1>
            <p className="text-xs text-gray-400">Manage your courses and track student progress</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Quick create button */}
            <Link href="/courses/create"
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-semibold text-xs hover:bg-indigo-700 transition-all">
              <Plus size={15} /> New Course
            </Link>
            {/* User chip */}
            <div className="flex items-center gap-2.5 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2">
              <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[10px] font-black">
                {getInitials(user?.username || "")}
              </div>
              <div>
                <p className="text-xs font-bold text-gray-800 leading-tight">{user?.username}</p>
                <p className="text-[10px] font-semibold leading-tight text-purple-500">Instructor</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-8">

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: "My Courses", value: courses.length, sub: "Published", icon: <BookOpen size={18} />, bg: "bg-indigo-50", text: "text-indigo-600" },
              { label: "Total Students", value: totalStudents, sub: "Enrolled", icon: <Users size={18} />, bg: "bg-blue-50", text: "text-blue-600" },
              { label: "Total Lessons", value: totalLessons, sub: "Across courses", icon: <Video size={18} />, bg: "bg-green-50", text: "text-green-600" },
              { label: "Avg Progress", value: `${avgProgress}%`, sub: "Student completion", icon: <TrendingUp size={18} />, bg: "bg-amber-50", text: "text-amber-600" },
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

          {/* Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
            <Link href="/courses/create"
              className="flex items-center gap-4 p-5 bg-white border-2 border-dashed border-indigo-200 rounded-2xl hover:border-indigo-400 hover:bg-indigo-50 transition-all group">
              <div className="w-12 h-12 bg-indigo-50 group-hover:bg-indigo-100 rounded-xl flex items-center justify-center transition-colors">
                <Plus size={22} className="text-indigo-600" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">Create New Course</p>
                <p className="text-xs text-gray-400">Add title, description, thumbnail</p>
              </div>
            </Link>

            <Link href="/instructor/analytics"
              className="flex items-center gap-4 p-5 bg-white border border-gray-100 rounded-2xl hover:shadow-md transition-all group">
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                <BarChart2 size={22} className="text-purple-600" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">View Analytics</p>
                <p className="text-xs text-gray-400">Student progress & completion</p>
              </div>
              <ChevronRight size={16} className="text-gray-300 ml-auto group-hover:text-indigo-600 transition-colors" />
            </Link>

            <div className="flex items-center gap-4 p-5 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl text-white">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Users size={22} className="text-white" />
              </div>
              <div>
                <p className="font-black text-lg leading-tight">{totalStudents}</p>
                <p className="text-indigo-200 text-xs">Total students enrolled</p>
              </div>
            </div>
          </div>

          {/* My Courses List */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-gray-900">My Courses</h2>
            <Link href="/courses/create" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
              <Plus size={14} /> Add New
            </Link>
          </div>

          {courses.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
              <BookOpen size={48} className="text-gray-200 mx-auto mb-4" />
              <p className="text-gray-500 font-bold mb-1">No courses yet</p>
              <p className="text-gray-300 text-sm mb-6">Create your first course to get started</p>
              <Link href="/courses/create" className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-all">
                Create First Course
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="divide-y divide-gray-50">
                {courses.map((course: any) => {
                  const courseAnalytics = analytics.find(a => a.slug === course.slug);
                  const lessonCount = course.lessons?.length || 0;
                  const studentCount = courseAnalytics?.total_students || 0;
                  const avgProg = courseAnalytics?.avg_progress || 0;

                  return (
                    <div key={course.id} className="flex items-center gap-4 p-5 hover:bg-gray-50 transition-colors group">
                      {/* Course icon */}
                      <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                        <BookOpen size={20} className="text-indigo-600" />
                      </div>

                      {/* Course info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-bold text-gray-900 truncate">{course.title}</p>
                          <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full flex-shrink-0">{course.difficulty}</span>
                        </div>
                        <div className="flex items-center gap-4 text-[11px] text-gray-400">
                          <span className="flex items-center gap-1"><Video size={11} /> {lessonCount} lessons</span>
                          <span className="flex items-center gap-1"><Users size={11} /> {studentCount} students</span>
                          <span className="flex items-center gap-1"><TrendingUp size={11} /> {avgProg}% avg progress</span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="hidden lg:flex items-center gap-2 w-32">
                        <div className="flex-1 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${avgProg}%` }} />
                        </div>
                        <span className="text-[10px] font-bold text-gray-400">{avgProg}%</span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/courses/${course.slug}`}
                          className="p-2 bg-gray-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors text-gray-500" title="View Course">
                          <FileText size={15} />
                        </Link>
                        <Link href={`/courses/${course.slug}/edit`}
                          className="p-2 bg-gray-100 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors text-gray-500" title="Edit Course">
                          <Edit size={15} />
                        </Link>
                        <Link href={`/instructor/courses/${course.slug}/lessons/create`}
                          className="p-2 bg-gray-100 hover:bg-green-50 hover:text-green-600 rounded-lg transition-colors text-gray-500" title="Add Lesson">
                          <Plus size={15} />
                        </Link>
                        <button
                          onClick={() => handleDelete(course.slug, course.id)}
                          disabled={deletingId === course.id}
                          className="p-2 bg-gray-100 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors text-gray-500 disabled:opacity-50" title="Delete Course">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}