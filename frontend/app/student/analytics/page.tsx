"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import {
  ArrowLeft, BookOpen, CheckCircle, TrendingUp,
  Award, BarChart2, Target, ChevronRight, LayoutDashboard, Compass, LogOut
} from "lucide-react";

const getInitials = (name: string) => name?.slice(0, 2).toUpperCase() || "U";

export default function StudentAnalyticsPage() {
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

  const totalCourses = enrollments.length;
  const completedCourses = enrollments.filter((e: any) => e.is_completed).length;
  const inProgress = enrollments.filter((e: any) => !e.is_completed && e.progress > 0).length;
  const notStarted = enrollments.filter((e: any) => e.progress === 0).length;
  const avgProgress = totalCourses > 0
    ? Math.round(enrollments.reduce((s: number, e: any) => s + (e.progress ?? 0), 0) / totalCourses)
    : 0;
  const totalLessons = enrollments.reduce((s: number, e: any) => s + (e.course_details?.lessons?.length || 0), 0);
  const completedLessons = enrollments.reduce((s: number, e: any) => s + (e.completed_lessons?.length || 0), 0);
  const completionRate = totalCourses > 0 ? Math.round((completedCourses / totalCourses) * 100) : 0;

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
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Main Menu</span>
          </div>
          <Link href="/dashboard" className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm text-gray-500 hover:bg-gray-50 transition-all">
            <LayoutDashboard size={17} /> Dashboard
          </Link>
          <Link href="/courses" className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm text-gray-500 hover:bg-gray-50 transition-all">
            <Compass size={17} /> Explore
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
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-600">
                👨‍🎓 Student
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
        <header className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
              <ArrowLeft size={18} className="text-gray-500" />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Learning Analytics</h1>
              <p className="text-xs text-gray-400">Your complete performance overview</p>
            </div>
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
        </header>

        <main className="flex-1 p-8">

          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Completion Rate", value: `${completionRate}%`, sub: `${completedCourses} of ${totalCourses} courses`, icon: <Target size={20} />, bg: "bg-indigo-50", text: "text-indigo-600", bar: completionRate, barColor: "bg-indigo-500" },
              { label: "Avg Progress", value: `${avgProgress}%`, sub: "Across all courses", icon: <TrendingUp size={20} />, bg: "bg-violet-50", text: "text-violet-600", bar: avgProgress, barColor: "bg-violet-500" },
              { label: "Lessons Done", value: completedLessons, sub: `of ${totalLessons} total`, icon: <BookOpen size={20} />, bg: "bg-blue-50", text: "text-blue-600", bar: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0, barColor: "bg-blue-500" },
              { label: "Certificates", value: completedCourses, sub: "Ready to claim", icon: <Award size={20} />, bg: "bg-amber-50", text: "text-amber-600", bar: completionRate, barColor: "bg-amber-500" },
            ].map((kpi) => (
              <div key={kpi.label} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{kpi.label}</span>
                  <div className={`p-2 rounded-xl ${kpi.bg} ${kpi.text}`}>{kpi.icon}</div>
                </div>
                <p className="text-2xl font-black text-gray-900 mb-1">{kpi.value}</p>
                <p className="text-xs text-gray-400 mb-3">{kpi.sub}</p>
                <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                  <div className={`h-full ${kpi.barColor} rounded-full`} style={{ width: `${kpi.bar}%` }} />
                </div>
              </div>
            ))}
          </div>

          {/* Status Breakdown + Per Course Table */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="text-sm font-bold text-gray-900 mb-5">Course Status</h3>
              <div className="space-y-4">
                {[
                  { label: "Completed", value: completedCourses, color: "bg-green-500", textColor: "text-green-600" },
                  { label: "In Progress", value: inProgress, color: "bg-indigo-500", textColor: "text-indigo-600" },
                  { label: "Not Started", value: notStarted, color: "bg-gray-300", textColor: "text-gray-500" },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between items-center mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                        <span className="text-xs font-semibold text-gray-600">{item.label}</span>
                      </div>
                      <span className={`text-xs font-black ${item.textColor}`}>{item.value}</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div className={`h-full ${item.color} rounded-full transition-all duration-1000`}
                        style={{ width: totalCourses > 0 ? `${(item.value / totalCourses) * 100}%` : '0%' }} />
                    </div>
                  </div>
                ))}
                <div className="pt-4 border-t border-gray-100 grid grid-cols-3 gap-2 text-center">
                  <div><p className="text-lg font-black text-gray-900">{totalCourses}</p><p className="text-[10px] text-gray-400">Total</p></div>
                  <div><p className="text-lg font-black text-green-600">{completedCourses}</p><p className="text-[10px] text-gray-400">Done</p></div>
                  <div><p className="text-lg font-black text-indigo-600">{inProgress}</p><p className="text-[10px] text-gray-400">Active</p></div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="text-sm font-bold text-gray-900 mb-5">Per Course Breakdown</h3>
              {enrollments.length === 0 ? (
                <p className="text-gray-300 text-sm text-center py-8">No courses enrolled yet.</p>
              ) : (
                <div className="space-y-3">
                  {enrollments.map((e: any) => {
                    const course = e.course_details;
                    if (!course) return null;
                    const progress = e.progress ?? 0;
                    const totalL = course.lessons?.length || 0;
                    const completedL = e.completed_lessons?.length || 0;
                    return (
                      <div key={e.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                          <BookOpen size={18} className="text-indigo-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-bold text-gray-800 truncate">{course.title}</p>
                            <span className={`text-xs font-bold ml-2 flex-shrink-0 ${e.is_completed ? 'text-green-600' : 'text-indigo-600'}`}>{progress}%</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${e.is_completed ? 'bg-green-500' : 'bg-indigo-500'}`} style={{ width: `${progress}%` }} />
                            </div>
                            <span className="text-[10px] text-gray-400 flex-shrink-0">{completedL}/{totalL} lessons</span>
                          </div>
                        </div>
                        <Link href={`/courses/${course.slug}`}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-indigo-50 rounded-lg text-indigo-600 hover:bg-indigo-100">
                          <ChevronRight size={14} />
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Certificates */}
          {completedCourses > 0 && (
            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                  <Award size={20} className="text-amber-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Certificates Earned</h3>
                  <p className="text-xs text-gray-500">You've completed {completedCourses} course{completedCourses > 1 ? 's' : ''}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {enrollments.filter((e: any) => e.is_completed).map((e: any) => (
                  <Link key={e.id} href={`/courses/${e.course_details?.slug}/certificate`}
                    className="flex items-center gap-3 p-4 bg-white rounded-xl border border-amber-200 hover:shadow-md transition-all group">
                    <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Award size={16} className="text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-800 truncate">{e.course_details?.title}</p>
                      <p className="text-[10px] text-amber-600 font-semibold">Tap to claim →</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}