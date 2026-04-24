"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { BookOpen, PlusCircle, LogOut, Search, LayoutDashboard, Compass, Award, PlayCircle } from "lucide-react";
import toast from "react-hot-toast";

const getCourseThumbnail = (url: string, title: string) => {
  if (url) {
    const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    if (ytMatch && ytMatch[1]) return `https://img.youtube.com/vi/${ytMatch[1]}/maxresdefault.jpg`;
  }
  return `https://ui-avatars.com/api/?name=${title}&background=4f46e5&color=fff&size=512`;
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
        
        if (!token) {
          router.push("/login");
          return;
        }

        const config = {
          headers: { Authorization: `Bearer ${token}` }
        };

        const profileRes = await api.get("/auth/me/", config);
        setUser(profileRes.data);
        
        const allCoursesRes = await api.get("/courses/", config);
        setExploreCourses(allCoursesRes.data);

        // FIXED: Now correctly checks the boolean sent by the Django backend
        if (profileRes.data.is_instructor) {
           setMyCourses(allCoursesRes.data.filter((c: any) => c.instructor_name === profileRes.data.username));
        } else {
           const studentDashboardRes = await api.get("/student/dashboard/", config);
           setMyCourses(studentDashboardRes.data);
        }
      } catch (err) {
        console.error("Dashboard Authentication Error:", err);
        localStorage.clear();
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [router]);

  const handleLogout = () => {
    localStorage.clear();
    toast.success("Logged out successfully");
    router.push("/login");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div></div>;

  const renderCourseCard = (course: any, isStudentView: boolean = false) => {
    const videoUrl = isStudentView ? course.video_url : course.lessons?.[0]?.video_url;
    const isCompleted = isStudentView && course.percentage === 100;
    
    return (
      <div key={course.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden hover:shadow-2xl transition-all group flex flex-col h-full">
        <div className="aspect-video bg-indigo-500 relative flex items-center justify-center overflow-hidden">
          <PlayCircle className="text-white/30 h-16 w-16 absolute z-10 group-hover:scale-110 transition-transform" />
          <img src={getCourseThumbnail(videoUrl, course.title)} alt={course.title} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
        </div>
        <div className="p-6 flex flex-col flex-1">
          <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2">{course.difficulty}</div>
          <h3 className="font-bold text-slate-900 mb-2 leading-tight">{course.title}</h3>
          
          {/* FIXED: Replaced role check with is_instructor check */}
          {isStudentView && !user?.is_instructor ? (
             <div className="mt-auto pt-4 border-t border-slate-100">
               <div className="flex justify-between text-xs font-bold text-slate-500 mb-2">
                 <span>Progress</span><span>{course.percentage}%</span>
               </div>
               <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-4">
                 <div className={`h-full rounded-full transition-all duration-1000 ${isCompleted ? 'bg-green-500' : 'bg-indigo-600'}`} style={{ width: `${course.percentage}%` }}></div>
               </div>
               
               {isCompleted ? (
                 <Link href={`/courses/${course.slug}/certificate`} className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white rounded-xl font-black text-xs tracking-widest hover:from-yellow-500 hover:to-yellow-700 transition-colors shadow-lg shadow-yellow-500/30">
                   <Award className="h-4 w-4" /> VIEW CERTIFICATE
                 </Link>
               ) : (
                 <Link href={`/courses/${course.slug}`} className="w-full block text-center py-3 bg-slate-900 text-white rounded-xl font-bold text-xs tracking-widest hover:bg-indigo-600 transition-colors">
                   RESUME LEARNING
                 </Link>
               )}
             </div>
          ) : (
            <>
              <p className="text-sm text-slate-500 line-clamp-2 mb-6 flex-1">{course.description}</p>
              <Link href={`/courses/${course.slug}`} className="w-full block text-center py-3 bg-slate-900 text-white rounded-xl font-bold text-xs tracking-widest hover:bg-indigo-600 transition-colors mt-auto">
                VIEW COURSE
              </Link>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex">
      <aside className="w-64 bg-white border-r border-slate-200 hidden lg:flex flex-col sticky top-0 h-screen">
        
        <Link href="/" className="p-6 flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
          <BookOpen className="h-7 w-7 text-indigo-600" />
          <span className="text-xl font-black text-slate-900 tracking-tighter">LEARNFLOW</span>
        </Link>

        <nav className="flex-1 px-4 space-y-1 mt-4">
          <button onClick={() => setActiveTab("home")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === "home" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "text-slate-500 hover:bg-slate-50"}`}>
            <LayoutDashboard className="h-5 w-5" /> Dashboard
          </button>
          <button onClick={() => setActiveTab("explore")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === "explore" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "text-slate-500 hover:bg-slate-50"}`}>
            <Compass className="h-5 w-5" /> Explore
          </button>
        </nav>
        <div className="p-6">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-red-500 hover:bg-red-50 transition-colors">
            <LogOut className="h-5 w-5" /> Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <header className="bg-white/80 backdrop-blur-md h-20 border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-20">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input type="text" placeholder="Search courses..." className="w-full bg-slate-100 border-none rounded-xl py-2 pl-10 pr-4 text-sm outline-none" />
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-bold text-slate-900">{user?.username}</p>
              {/* FIXED: Evaluates is_instructor to display the correct title */}
              <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">
                {user?.is_instructor ? "INSTRUCTOR" : "STUDENT"}
              </p>
            </div>
            <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black">
              {user?.username ? user.username[0].toUpperCase() : "U"}
            </div>
          </div>
        </header>

        <div className="p-8 lg:p-12">
          {activeTab === "home" && (
            <div className="animate-in fade-in duration-500">
              <div className="flex justify-between items-center mb-10">
                <div>
                  <h1 className="text-3xl font-black text-slate-900 tracking-tight">Welcome, {user?.username}</h1>
                  <p className="text-slate-500 font-medium">Here’s what’s happening with your learning today.</p>
                </div>
                {/* FIXED: Correctly identifies instructor to show Create Course button */}
                {user?.is_instructor && (
                  <div className="flex gap-3">
                    <Link href="/instructor/analytics" className="bg-white text-slate-900 border border-slate-200 px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 shadow-sm">VIEW ANALYTICS</Link>
                    <Link href="/instructor/courses/create" className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 shadow-xl shadow-indigo-100"><PlusCircle className="h-5 w-5" /> CREATE COURSE</Link>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {myCourses.map(course => renderCourseCard(course, !user?.is_instructor))}
              </div>
              {myCourses.length === 0 && (
                <div className="text-center py-20 bg-white rounded-[2rem] border-2 border-dashed border-slate-200">
                   <h3 className="text-xl font-bold text-slate-400">No active courses.</h3>
                   {!user?.is_instructor && <p className="text-slate-400 mt-2 cursor-pointer text-indigo-600" onClick={() => setActiveTab("explore")}>Click here to Explore new courses to enroll in.</p>}
                </div>
              )}
            </div>
          )}

          {activeTab === "explore" && (
            <div className="animate-in fade-in duration-500">
               <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-10">Explore Network</h1>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                 {exploreCourses.map(course => renderCourseCard(course, false))}
               </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}