"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import {
  Compass, LayoutDashboard, LogOut, BookOpen,
  Users, ChevronRight, Search, BarChart2
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

export default function ExplorePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("All");
  const [loading, setLoading] = useState(true);
  const [enrollingId, setEnrollingId] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("access");
        if (!token) { router.push("/login"); return; }
        const [profileRes, coursesRes] = await Promise.all([
          api.get("/auth/me/"),
          api.get("/courses/explore/")
        ]);
        setUser(profileRes.data);
        setCourses(coursesRes.data);
        setFiltered(coursesRes.data);
      } catch {
        localStorage.clear();
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [router]);

  useEffect(() => {
    let result = courses;
    if (search.trim()) {
      result = result.filter(c =>
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.instructor_name?.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (difficulty !== "All") {
      result = result.filter(c => c.difficulty === difficulty);
    }
    setFiltered(result);
  }, [search, difficulty, courses]);

  const handleEnroll = async (courseId: number, courseSlug: string) => {
    setEnrollingId(courseId);
    try {
      await api.post("/enrollments/", { course: courseId });
      router.push(`/courses/${courseSlug}`);
    } catch (err: any) {
      const respStatus = err.response?.status;
      const data = err.response?.data;
      const rawError = JSON.stringify(data);

      // ✅ Already enrolled — just go to the course silently
      if (
        respStatus === 400 &&
        rawError.toLowerCase().match(/already|unique|exists|duplicate/)
      ) {
        router.push(`/courses/${courseSlug}`);
        return;
      }

      // ✅ Shows EXACT backend error so we can debug
      alert(`DEBUG — Status ${respStatus}: ${rawError}`);
    } finally {
      setEnrollingId(null);
    }
  };

  const dashboardPath = user?.is_instructor ? "/instructor/dashboard" : "/student/dashboard";
  const analyticsPath = user?.is_instructor ? "/instructor/analytics" : "/student/analytics";

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
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Menu</span>
          </div>
          <Link href={dashboardPath} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm text-gray-500 hover:bg-gray-50 transition-all">
            <LayoutDashboard size={17} /> Dashboard
          </Link>
          <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm bg-indigo-600 text-white shadow-sm">
            <Compass size={17} /> Explore
          </button>
          <Link href={analyticsPath} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm text-gray-500 hover:bg-gray-50 transition-all">
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
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                user?.is_instructor ? 'bg-purple-100 text-purple-600' : 'bg-green-100 text-green-600'
              }`}>
                {user?.is_instructor ? '👩‍🏫 Instructor' : '👨‍🎓 Student'}
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
            <h1 className="text-lg font-bold text-gray-900">Explore Courses</h1>
            <p className="text-xs text-gray-400">Find your next course and start learning today</p>
          </div>
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
          {/* Search + Filter */}
          <div className="flex items-center gap-3 mb-8 flex-wrap">
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search courses or instructors..."
                className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
            <div className="flex gap-2">
              {["All", "Beginner", "Intermediate", "Advanced"].map(d => (
                <button key={d} onClick={() => setDifficulty(d)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                    difficulty === d
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-300'
                  }`}>
                  {d}
                </button>
              ))}
            </div>
          </div>

          <p className="text-xs text-gray-400 font-semibold mb-5">
            {filtered.length} course{filtered.length !== 1 ? "s" : ""} available
          </p>

          {filtered.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
              <BookOpen size={48} className="text-gray-200 mx-auto mb-4" />
              <p className="text-gray-500 font-bold mb-1">No courses found</p>
              <p className="text-gray-300 text-sm">Try a different search or filter</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map((course: any) => {
                const thumbnail = getYoutubeThumbnail(course.lessons);
                const lessonCount = course.lessons?.length || 0;

                return (
                  <div key={course.id}
                    className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:shadow-gray-200/60 transition-all duration-300 group flex flex-col">

                    {/* Thumbnail */}
                    <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-indigo-100 to-violet-100">
                      {thumbnail ? (
                        <img src={thumbnail} alt={course.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                          <div className="w-16 h-16 bg-indigo-600/20 rounded-2xl flex items-center justify-center">
                            <BookOpen size={28} className="text-indigo-500" />
                          </div>
                          <p className="text-indigo-400 text-xs font-bold px-4 text-center line-clamp-1">{course.title}</p>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                      <div className="absolute top-3 left-3">
                        <span className="px-2.5 py-1 bg-black/60 backdrop-blur text-white text-[10px] font-bold rounded-full">
                          {course.difficulty}
                        </span>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="p-5 flex flex-col flex-1">
                      <h3 className="text-sm font-bold text-gray-900 line-clamp-2 leading-snug mb-1">
                        {course.title}
                      </h3>
                      <p className="text-xs text-gray-400 line-clamp-2 mb-3">{course.description}</p>
                      <div className="flex items-center gap-3 text-[11px] text-gray-400 mb-5">
                        <span className="flex items-center gap-1"><Users size={11} /> {course.instructor_name}</span>
                        <span className="flex items-center gap-1"><BookOpen size={11} /> {lessonCount} lessons</span>
                      </div>
                      <div className="mt-auto space-y-2">
                        <button
                          onClick={() => handleEnroll(course.id, course.slug)}
                          disabled={enrollingId === course.id}
                          className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-700 disabled:opacity-60 transition-all"
                        >
                          {enrollingId === course.id ? "Enrolling..." : "Enroll Now"}
                        </button>
                        <Link href={`/courses/${course.slug}`}
                          className="w-full flex items-center justify-center gap-1 py-2.5 bg-gray-50 border border-gray-200 text-gray-600 rounded-xl font-semibold text-xs hover:bg-gray-100 transition-all">
                          Preview <ChevronRight size={12} />
                        </Link>
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