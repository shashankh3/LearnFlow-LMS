"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import api from "@/lib/api";
import { isLoggedIn, getUser } from "@/lib/auth";
import { BookOpen, Users, PlusCircle, ArrowRight, BarChart3, FileText, Trash2 } from "lucide-react";
import toast from "react-hot-toast"; // Imported toast for success/error popups

export default function InstructorDashboard() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  
  // Strict loading state to prevent the infinite redirect race condition
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const initializeDashboard = async () => {
      // 1. Wait for client-side hydration before doing anything
      if (typeof window === "undefined") return;

      // 2. Safely check login status
      if (!isLoggedIn()) { 
        router.push("/login"); 
        return; 
      }
      
      // 3. Safely check role
      const user = getUser();
      if (!user || user?.role?.toUpperCase() !== "INSTRUCTOR") { 
        router.push("/dashboard"); 
        return; 
      }
      
      // 4. If authorized, fetch the data
      try {
        const res = await api.get("/courses/my-overview/");
        setData(res.data);
        setIsAuthorized(true);
      } catch (error) {
        console.error("Dashboard data fetch failed:", error);
        router.push("/login");
      } finally {
        // 5. Only turn off the loading gate when ALL checks and fetches are done
        setLoading(false);
      }
    };

    initializeDashboard();
  }, [router]);

  // NEW: Secure Delete Logic
  const handleDeleteCourse = async (courseSlug: string) => {
    // Safety check so instructors don't accidentally click it
    if (!confirm("Are you absolutely sure you want to delete this ENTIRE course? This action cannot be undone and will delete all lessons inside it.")) return;

    try {
      // Hit the secure backend endpoint
      await api.delete(`/courses/${courseSlug}/`);
      
      // Instantly remove the course from the screen without reloading
      setData((prevData: any) => ({
        ...prevData,
        courses: prevData.courses.filter((c: any) => c.slug !== courseSlug)
      }));
      
      toast.success("Course deleted successfully!");
    } catch (error) {
      console.error("Failed to delete course:", error);
      toast.error("Failed to delete course. Please try again.");
    }
  };

  // GATE 1: Show your custom loading spinner while auth and data resolve
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // GATE 2: Security fallback. Return nothing if they somehow bypassed the loading state without auth
  if (!isAuthorized) return null;

  // Data processing
  const courses = data?.courses || [];
  const totalStudents = courses.reduce((sum: number, c: any) => sum + (c.total_students || 0), 0);

  // GATE 3: Render the UI
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Instructor Dashboard</h1>
            <p className="text-gray-400 mt-1">Manage your courses and track students</p>
          </div>
          <Link href="/instructor/courses/create"
            className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 hover:scale-105 transition-all shadow-md shadow-indigo-200">
            <PlusCircle size={18} /> New Course
          </Link>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { icon: <BookOpen size={20} className="text-indigo-600" />, label: "Total Courses", value: courses.length, bg: "bg-indigo-50" },
            { icon: <Users size={20} className="text-green-600" />, label: "Total Students", value: totalStudents, bg: "bg-green-50" },
            { icon: <BarChart3 size={20} className="text-purple-600" />, label: "Avg per Course", value: courses.length ? Math.round(totalStudents / courses.length) : 0, bg: "bg-purple-50" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
              <div className={`${stat.bg} p-3 rounded-xl`}>{stat.icon}</div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                <p className="text-sm text-gray-400">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Courses List */}
        {courses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
            <BookOpen size={40} className="text-gray-200 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No courses yet</h3>
            <p className="text-gray-400 text-sm mb-6">Create your first course and start teaching.</p>
            <Link href="/instructor/courses/create"
              className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition">
              Create First Course
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {courses.map((course: any) => (
              <div key={course.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md hover:-translate-y-0.5 transition-all">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800">{course.title}</h2>
                    <p className="text-sm text-gray-400 mt-0.5">{course.total_lessons || 0} lessons</p>
                  </div>
                  <span className="flex items-center gap-1 text-sm bg-green-50 text-green-700 font-semibold px-3 py-1 rounded-full">
                    <Users size={13} /> {course.total_students || 0}
                  </span>
                </div>
                <p className="text-sm text-gray-500 line-clamp-2 mb-4">{course.description}</p>
                
                {/* Action Links */}
                <div className="flex flex-wrap gap-4 mt-auto">
                  <Link href={`/courses/${course.slug}`}
                    className="flex items-center gap-1 text-sm text-indigo-600 font-semibold hover:underline">
                    View <ArrowRight size={14} />
                  </Link>

                  <Link href={`/instructor/courses/${course.slug}/lessons/create`}
                    className="flex items-center gap-1 text-sm text-blue-600 font-semibold hover:underline">
                    Add Lesson <FileText size={14} />
                  </Link>

                  <Link href={`/courses/${course.slug}/dashboard`}
                    className="flex items-center gap-1 text-sm text-green-600 font-semibold hover:underline">
                    Analytics <BarChart3 size={14} />
                  </Link>

                  {/* The New Delete Button */}
                  <button 
                    onClick={() => handleDeleteCourse(course.slug)}
                    className="flex items-center gap-1 text-sm text-red-600 font-semibold hover:underline ml-auto"
                  >
                    Delete <Trash2 size={14} />
                  </button>
                </div>
                
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}