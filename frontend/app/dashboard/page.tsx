"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { BookOpen, PlusCircle, LogOut, Search, LayoutDashboard, Compass, Award, PlayCircle, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

const getCourseThumbnail = (url: string, title: string) => {
  if (url) {
    const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    if (ytMatch && ytMatch[1]) return `https://img.youtube.com/vi/${ytMatch[1]}/maxresdefault.jpg`;
  }
  // Better fallback with initials
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(title)}&background=4f46e5&color=fff&size=512`;
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [myCourses, setMyCourses] = useState([]);
  const [exploreCourses, setExploreCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("home");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("access");
        if (!token) { router.push("/login"); return; }
        const config = { headers: { Authorization: `Bearer ${token}` } };

        const [profileRes, allCoursesRes, enrollRes] = await Promise.all([
          api.get("/auth/me/", config),
          api.get("/courses/", config),
          api.get("/enrollments/", config)
        ]);

        setUser(profileRes.data);
        setExploreCourses(allCoursesRes.data);

        if (profileRes.data.is_instructor) {
           setMyCourses(allCoursesRes.data.filter((c: any) => c.instructor_name === profileRes.data.username));
        } else {
           setMyCourses(enrollRes.data);
        }
      } catch (err) {
        console.error("Dashboard Error:", err);
        localStorage.clear();
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [router]);

  const handleLogout = () => { localStorage.clear(); router.push("/login"); };

  const renderCourseCard = (item: any, isStudentView: boolean = false) => {
    const course = isStudentView ? item.course_details : item;
    if (!course) return null;

    // Grab first lesson video for thumbnail
    const videoUrl = course.lessons?.[0]?.video_url || "";
    
    // Calculate Progress
    const totalLessons = course.lessons?.length || 0;
    const completedCount = isStudentView ? (item.completed_lessons?.length || 0) : 0;
    const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
    
    const isOwner = user?.is_instructor && course.instructor_name === user?.username;

    return (
      <div key={item.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden hover:shadow-xl transition-all group flex flex-col h-full">
        <div className="aspect-video bg-indigo-500 relative flex items-center justify-center overflow-hidden">
          <PlayCircle className="text-white/30 h-16 w-16 absolute z-10 group-hover:scale-110 transition-all" />
          <img src={getCourseThumbnail(videoUrl, course.title)} alt={course.title} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-all" />
        </div>
        <div className="p-6 flex flex-col flex-1">
          <div className="text-[10px] font-black text-indigo-600 uppercase mb-2">{course.difficulty || "ALL LEVELS"}</div>
          <h3 className="font-bold text-slate-900 mb-2 leading-tight">{course.title}</h3>
          
          {isStudentView ? (
             <div className="mt-auto pt-4 border-t border-slate-100">
               <div className="flex justify-between text-xs font-bold text-slate-500 mb-2">
                 <span>Progress</span><span>{progressPercent}%</span>
               </div>
               <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-4">
                 <div className="h-full bg-indigo-600 rounded-full transition-all" style={{ width: `${progressPercent}%` }}></div>
               </div>
               <Link href={`/courses/${course.slug}`} className="w-full block text-center py-3 bg-slate-900 text-white rounded-xl font-bold text-xs tracking-widest hover:bg-indigo-600">
                 RESUME LEARNING
               </Link>
             </div>
          ) : (
            <div className="mt-auto pt-4 border-t border-slate-100 flex gap-2">
              <Link href={`/courses/${course.slug}`} className="flex-1 block text-center py-3 bg-slate-900 text-white rounded-xl font-bold text-xs tracking-widest hover:bg-indigo-600">VIEW COURSE</Link>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex">
      <aside className="w-64 bg-white border-r border-slate-200 hidden lg:flex flex-col sticky top-0 h-screen">
        <Link href="/" className="p-6 flex items-center gap-2 font-black text-xl tracking-tighter text-indigo-600"><BookOpen /> LEARNFLOW</Link>
        <nav className="flex-1 px-4 mt-4">
          <button onClick={() => setActiveTab("home")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold ${activeTab === "home" ? "bg-indigo-600 text-white" : "text-slate-500"}`}><LayoutDashboard /> Dashboard</button>
          <button onClick={() => setActiveTab("explore")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold ${activeTab === "explore" ? "bg-indigo-600 text-white" : "text-slate-500"}`}><Compass /> Explore</button>
        </nav>
        <button onClick={handleLogout} className="m-6 flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-red-500 hover:bg-red-50"><LogOut /> Logout</button>
      </aside>
      <main className="flex-1 p-8">
        <h1 className="text-3xl font-black text-slate-900 mb-10">Welcome, {user?.username}</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {(activeTab === "home" ? myCourses : exploreCourses).map(item => renderCourseCard(item, activeTab === "home" && !user?.is_instructor))}
        </div>
      </main>
    </div>
  );
}