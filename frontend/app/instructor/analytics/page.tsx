"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import Link from "next/link";
import { ArrowLeft, Users, BarChart, AlertCircle } from "lucide-react";

export default function InstructorAnalyticsPage() {
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get("/instructor/analytics/");
        setAnalytics(res.data);
      } catch (err) {
        console.error("Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) return <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center">Loading Real-Time Analytics...</div>;

  return (
    <div className="min-h-screen bg-[#F8F9FB] p-8 lg:p-12">
      <div className="max-w-6xl mx-auto">
        <Link href="/dashboard" className="inline-flex items-center text-slate-500 font-bold text-sm mb-8 hover:text-indigo-600">
          <ArrowLeft className="h-4 w-4 mr-2" /> BACK TO DASHBOARD
        </Link>

        <div className="mb-10">
          <h1 className="text-4xl font-black text-slate-900 italic tracking-tighter uppercase mb-2">Class Progress</h1>
          <p className="text-slate-500 font-medium text-lg">Monitor live student enrollments and true completion tracking.</p>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {analytics.map(course => (
            <div key={course.id} className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-8">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{course.difficulty}</span>
                  <h2 className="text-2xl font-black text-slate-900 mt-1">{course.title}</h2>
                </div>
                <div className="bg-slate-50 px-4 py-2 rounded-xl flex items-center gap-2">
                  <BarChart className="h-4 w-4 text-slate-400" />
                  <span className="text-sm font-bold text-slate-700">{course.total_lessons} Total Lessons</span>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-8">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Users className="h-4 w-4" /> Enrolled Students ({course.students.length})
                </h3>
                
                {course.students.length > 0 ? (
                  <div className="space-y-4">
                    {course.students.map((student: any, idx: number) => (
                      <div key={idx} className="bg-slate-50 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                         <div className="flex items-center gap-4">
                           <div className="h-10 w-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                             {student.username[0].toUpperCase()}
                           </div>
                           <div>
                             <p className="font-bold text-slate-900 text-sm">{student.username}</p>
                             <p className="text-xs text-slate-500 font-medium">Enrolled: {student.enrolled_at}</p>
                           </div>
                         </div>
                         
                         <div className="flex items-center gap-4 w-full md:w-64">
                            <div className="flex-1 bg-slate-200 h-2 rounded-full overflow-hidden">
                              <div className="bg-indigo-600 h-full rounded-full transition-all duration-1000" style={{ width: `${student.percentage}%` }}></div>
                            </div>
                            <span className="text-sm font-black text-slate-900 w-12 text-right">{student.percentage}%</span>
                         </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-4 rounded-xl text-sm font-bold">
                    <AlertCircle className="h-5 w-5" /> No students have enrolled in this course yet.
                  </div>
                )}
              </div>
            </div>
          ))}

          {analytics.length === 0 && (
            <div className="text-center py-20 bg-white rounded-[2rem] border-2 border-dashed border-slate-200">
               <h3 className="text-xl font-bold text-slate-400">You haven't created any courses yet.</h3>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}