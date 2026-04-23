"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import api from "@/lib/api";
import { BookOpen, Users, ArrowRight, Search, AlertCircle, Loader2 } from "lucide-react";

export default function CoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get("/courses/")
      .then((res) => {
        const list = res.data?.results || res.data || [];
        setCourses(list);
        setFiltered(list);
      })
      .catch((err) => {
        console.error("API Error:", err);
        setError("Failed to load courses.");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleNavigate = (slug: string) => {
    console.log("Navigating to course:", slug);
    // Standard Next.js navigation
    router.push(`/courses/${slug}`);
  };

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(courses.filter((c) =>
      c.title.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q)
    ));
  }, [search, courses]);

  const difficultyColor: Record<string, string> = {
    beginner: "bg-green-100 text-green-700",
    intermediate: "bg-yellow-100 text-yellow-700",
    advanced: "bg-red-100 text-red-700",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-16 text-center text-white">
        <h1 className="text-4xl font-extrabold mb-3 tracking-tight italic">Explore Courses</h1>
        <div className="max-w-xl mx-auto relative mt-8">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search for a topic..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-4 rounded-2xl text-gray-800 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-300 shadow-2xl transition-all"
          />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {loading && (
          <div className="text-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          </div>
        )}

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((course: any) => (
            <div 
              key={course.id} 
              // Using a button-like div for better click handling
              role="button"
              tabIndex={0}
              onClick={() => handleNavigate(course.slug)}
              onKeyDown={(e) => e.key === 'Enter' && handleNavigate(course.slug)}
              className="group bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 cursor-pointer flex flex-col h-full overflow-hidden"
            >
              <div className="p-8 flex flex-col h-full">
                <div className="flex justify-between items-start mb-6">
                   <span className={`text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-widest ${difficultyColor[course.difficulty?.toLowerCase()] || "bg-gray-100 text-gray-500"}`}>
                    {course.difficulty || "Beginner"}
                  </span>
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <ArrowRight size={16} />
                  </div>
                </div>

                <h2 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors capitalize">
                  {course.title}
                </h2>
                
                <p className="text-gray-500 text-sm leading-relaxed line-clamp-3 mb-6 flex-1">
                  {course.description}
                </p>

                <div className="pt-6 border-t border-gray-50 flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2 text-gray-400 font-bold uppercase tracking-tighter">
                    <Users size={16} className="text-indigo-400" />
                    <span>{course.total_students || 0} Learners</span>
                  </div>
                  <span className="text-indigo-600 font-black text-xs tracking-widest">
                    VIEW COURSE
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}