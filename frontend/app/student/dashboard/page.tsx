"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import {
  LogOut, LayoutDashboard, Compass, Award,
  CheckCircle, BookOpen, BarChart2, ChevronRight, GraduationCap, Play
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

export default function StudentDashboard() {
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
        if (profileRes.data.is_instructor) { router.replace("/instructor/dashboard"); return; }
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

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const completedCount = myCourses.filter((e: any) => e.is_completed).length;

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-gray-100 flex flex-col fixed top-0 left-0 h-screen z-30">
        <div className="px-6 py-5 border-b border-gray-100">
          <span className="text-xl font-black text-indigo-600 tracking-tight">LEARNFLOW</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          <div className="px-3 py-2 mb-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Student</span>
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
        <header className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between sticky top-0 z-20">
          <div>
            <h1 className="text-lg font-bold text-gray-900">
              Welcome back, {user?.username} 👋
            </h1>
            <p className="text-xs text-gray-400">
              {myCourses.length} course{myCourses.length !== 1 ? "s" : ""} enrolled
              {completedCount > 0 && ` · ${completedCount} completed 🎉`}
            </p>
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

          {myCourses.length === 0 ? (
            /* Empty state */
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center">
                <div className="w-24 h-24 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <GraduationCap size={40} className="text-indigo-400" />
                </div>
                <h2 className="text-xl font-black text-gray-900 mb-2">No courses yet</h2>
                <p className="text-gray-400 text-sm mb-8 max-w-xs">
                  Discover and enroll in courses to start your learning journey
                </p>
                <Link href="/courses"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
                  <Compass size={18} /> Explore Courses
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-base font-bold text-gray-900">My Courses</h2>
                <Link href="/courses" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                  Explore More <ChevronRight size={14} />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {myCourses.map((enrollment: any) => {
                  const course = enrollment.course_details;
                  if (!course) return null;
                  const progress = enrollment.progress ?? 0;
                  const isFinished = enrollment.is_completed === true;
                  const totalL = course.lessons?.length || 0;
                  const completedL = enrollment.completed_lessons?.length || 0;
                  const thumbnail = getYoutubeThumbnail(course.lessons);

                  return (
                    <div key={enrollment.id}
                      className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:shadow-gray-200/60 transition-all duration-300 group flex flex-col">

                      {/* Thumbnail */}
                      <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-indigo-100 to-violet-100">
                        {thumbnail ? (
                          <img src={thumbnail} alt={course.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BookOpen size={36} className="text-indigo-300" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-300" />

                        {/* Play button overlay */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-xl">
                            <Play size={20} className="text-indigo-600 ml-1" fill="currentColor" />
                          </div>
                        </div>

                        {/* Status badge */}
                        <div className="absolute top-3 left-3">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            isFinished
                              ? 'bg-green-500 text-white'
                              : progress > 0
                              ? 'bg-indigo-600 text-white'
                              : 'bg-black/50 backdrop-blur text-white'
                          }`}>
                            {isFinished ? '✓ Done' : progress > 0 ? `${progress}%` : 'New'}
                          </span>
                        </div>

                        {/* Completed checkmark */}
                        {isFinished && (
                          <div className="absolute top-3 right-3">
                            <div className="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center">
                              <CheckCircle size={16} className="text-white" />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Card body */}
                      <div className="p-5 flex flex-col flex-1">
                        <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-1.5">
                          {course.difficulty} · {totalL} lessons
                        </span>
                        <h3 className="text-sm font-bold text-gray-900 line-clamp-2 leading-snug mb-1">
                          {course.title}
                        </h3>
                        <p className="text-xs text-gray-400 mb-4">by {course.instructor_name}</p>

                        <div className="mt-auto">
                          {/* Progress */}
                          <div className="flex justify-between text-[10px] font-semibold text-gray-400 mb-1.5">
                            <span>{completedL}/{totalL} lessons</span>
                            <span className={isFinished ? 'text-green-600' : 'text-indigo-600'}>{progress}%</span>
                          </div>
                          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden mb-4">
                            <div
                              className={`h-full rounded-full transition-all duration-1000 ${isFinished ? 'bg-green-500' : 'bg-indigo-600'}`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>

                          {/* CTA */}
                          <Link href={`/courses/${course.slug}`}
                            className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-xs hover:bg-indigo-700 transition-all">
                            {isFinished ? "Review" : progress > 0 ? "Resume" : "Start"} Course
                            <ChevronRight size={13} />
                          </Link>

                          {isFinished && (
                            <Link href={`/courses/${course.slug}/certificate`}
                              className="mt-2 w-full flex items-center justify-center gap-1.5 py-2.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl font-semibold text-xs hover:bg-amber-100 transition-all">
                              <Award size={13} /> Claim Certificate
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}