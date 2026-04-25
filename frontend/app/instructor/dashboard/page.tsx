"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import {
  LogOut, LayoutDashboard, BarChart2, BookOpen,
  Users, Plus, Video, ChevronRight, TrendingUp
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

export default function InstructorDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
        if (!profileRes.data.is_instructor) { router.replace("/student/dashboard"); return; }
        setUser(profileRes.data);
        const mine = coursesRes.data.filter(
          (c: any) => c.instructor_name === profileRes.data.username
        );
        setCourses(mine);
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

  const totalStudents = analytics.reduce((s, c) => s + c.total_students, 0);
  const totalLessons = courses.reduce((s: number, c: any) => s + (c.lessons?.length || 0), 0);

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
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Instructor</span>
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
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-600">
                👩‍🏫 Instructor
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
        <header className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between sticky top-0 z-20">
          <div>
            <h1 className="text-lg font-bold text-gray-900">My Courses</h1>
            <p className="text-xs text-gray-400">
              {courses.length} course{courses.length !== 1 ? "s" : ""} · {totalStudents} student{totalStudents !== 1 ? "s" : ""} · {totalLessons} lessons
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/courses/create"
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-200">
              <Plus size={16} /> New Course
            </Link>
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
          {courses.length === 0 ? (
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center">
                <div className="w-24 h-24 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <BookOpen size={40} className="text-indigo-400" />
                </div>
                <h2 className="text-xl font-black text-gray-900 mb-2">No courses yet</h2>
                <p className="text-gray-400 text-sm mb-8 max-w-xs">
                  Create your first course and start teaching students
                </p>
                <Link href="/courses/create"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
                  <Plus size={18} /> Create First Course
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course: any) => {
                const courseAnalytics = analytics.find(a => a.slug === course.slug);
                const lessonCount = course.lessons?.length || 0;
                const studentCount = courseAnalytics?.total_students || 0;
                const avgProg = courseAnalytics?.avg_progress || 0;
                const thumbnail = getYoutubeThumbnail(course.lessons);

                return (
                  <div key={course.id}
                    className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:shadow-gray-200/60 transition-all duration-300 group flex flex-col">

                    {/* Thumbnail — hover shows ONLY Add Lesson */}
                    <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-indigo-100 to-violet-100">
                      {thumbnail ? (
                        <img src={thumbnail} alt={course.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen size={40} className="text-indigo-300" />
                        </div>
                      )}

                      {/* ✅ Hover overlay — ONLY Add Lesson button */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <Link
                          href={`/instructor/courses/${course.slug}/lessons/create`}
                          className="flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors shadow-lg"
                          onClick={e => e.stopPropagation()}
                        >
                          <Plus size={16} /> Add Lesson
                        </Link>
                      </div>

                      {/* Difficulty badge */}
                      <div className="absolute top-3 left-3">
                        <span className="px-2.5 py-1 bg-black/60 backdrop-blur text-white text-[10px] font-bold rounded-full">
                          {course.difficulty}
                        </span>
                      </div>
                    </div>

                    {/* Card body */}
                    <div className="p-5 flex flex-col flex-1">
                      <h3 className="text-sm font-bold text-gray-900 mb-1 line-clamp-2 leading-snug">
                        {course.title}
                      </h3>
                      <p className="text-xs text-gray-400 mb-4 line-clamp-1">{course.description || "No description"}</p>

                      {/* Stats */}
                      <div className="flex items-center gap-4 text-[11px] text-gray-400 mb-4">
                        <span className="flex items-center gap-1"><Video size={11} /> {lessonCount} lessons</span>
                        <span className="flex items-center gap-1"><Users size={11} /> {studentCount} students</span>
                        <span className="flex items-center gap-1 text-indigo-500 font-bold"><TrendingUp size={11} /> {avgProg}%</span>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden mb-5">
                        <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                          style={{ width: `${avgProg}%` }} />
                      </div>

                      {/* View Course — Edit/Delete are inside the course page */}
                      <Link href={`/courses/${course.slug}`}
                        className="mt-auto w-full flex items-center justify-center gap-2 py-2.5 bg-gray-50 border border-gray-200 text-gray-700 rounded-xl font-semibold text-xs hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all">
                        View Course <ChevronRight size={13} />
                      </Link>
                    </div>
                  </div>
                );
              })}

              {/* Add new course card */}
              <Link href="/courses/create"
                className="bg-white rounded-2xl border-2 border-dashed border-gray-200 hover:border-indigo-400 hover:bg-indigo-50/30 transition-all duration-300 flex flex-col items-center justify-center min-h-[300px] group cursor-pointer">
                <div className="w-16 h-16 bg-indigo-50 group-hover:bg-indigo-100 rounded-2xl flex items-center justify-center mb-4 transition-colors">
                  <Plus size={28} className="text-indigo-400 group-hover:text-indigo-600 transition-colors" />
                </div>
                <p className="text-sm font-bold text-gray-400 group-hover:text-indigo-600 transition-colors">New Course</p>
                <p className="text-xs text-gray-300 mt-1">Click to create</p>
              </Link>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}