"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { BookOpen, Clock, PlayCircle, Edit3, PlusCircle, Layout, ArrowLeft, Lock, Trash2 } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function CourseDetailPage() {
  const { slug } = useParams();
  const router = useRouter();
  const [course, setCourse] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [enrollmentId, setEnrollmentId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const courseRes = await api.get(`/courses/${slug}/`);
        setCourse(courseRes.data);

        try {
          const [userRes, enrollRes] = await Promise.all([
            api.get("/auth/me/"),
            api.get("/enrollments/")
          ]);
          setUser(userRes.data);
          
          // Find the specific enrollment ID for this course
          const activeEnrollment = enrollRes.data.find((e: any) => e.course === courseRes.data.id);
          if (activeEnrollment) setEnrollmentId(activeEnrollment.id);
          
        } catch (authErr) {
          console.warn("User not authenticated.");
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [slug]);

  const handleEnroll = async () => {
    if (!user) { router.push("/login"); return; }
    setActionLoading(true);
    try {
      const res = await api.post("/enrollments/", { course: course.id });
      setEnrollmentId(res.data.id);
      toast.success("Enrolled successfully!");
    } catch (err: any) {
      toast.error("Failed to enroll");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnenroll = async () => {
    if (!confirm("Are you sure you want to opt out? Your progress will be lost.")) return;
    if (!enrollmentId) return;

    setActionLoading(true);
    try {
      // FIXED: Using the specific Enrollment ID for a clean REST delete
      await api.delete(`/enrollments/${enrollmentId}/`);
      setEnrollmentId(null);
      toast.success("Opted out successfully");
      router.push("/dashboard");
    } catch (err) {
      toast.error("Failed to unenroll");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-slate-400">Loading...</div>;
  if (!course) return <div className="min-h-screen flex flex-col items-center justify-center font-bold text-slate-800 text-2xl">Course not found</div>;

  const isInstructor = user?.username === course.instructor_name;
  const isEnrolled = !!enrollmentId;

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-[#4f46e5] text-white py-12 px-8">
        <div className="max-w-7xl mx-auto">
          <Link href="/dashboard" className="inline-flex items-center text-white/70 hover:text-white font-bold text-sm mb-8 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" /> BACK TO DASHBOARD
          </Link>
          <br/>
          <span className="bg-white/20 px-3 py-1 rounded text-xs font-bold uppercase tracking-widest">{course.difficulty}</span>
          <h1 className="text-5xl font-black mt-4 mb-6 italic tracking-tighter">{course.title}</h1>
          <div className="flex items-center gap-6 text-sm font-medium opacity-90">
            <div className="flex items-center gap-2"><BookOpen className="h-4 w-4"/> {course.instructor_name}</div>
            <div className="flex items-center gap-2"><Clock className="h-4 w-4"/> {course.lessons?.length || 0} Lessons</div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-12 flex flex-col lg:flex-row gap-12">
        <div className="flex-1">
          <h2 className="text-2xl font-black text-slate-900 mb-8 uppercase italic tracking-tight">Course Curriculum</h2>
          <div className="space-y-4">
            {course.lessons?.map((lesson: any, index: number) => {
              const canView = isInstructor || isEnrolled;
              return (
                <div key={lesson.id} onClick={() => canView && router.push(`/courses/${course.slug}/lessons/${lesson.id}`)} 
                  className={`flex items-center justify-between p-5 bg-slate-50 border border-slate-200 rounded-2xl transition-all ${canView ? 'hover:border-indigo-600 cursor-pointer group' : 'opacity-70 cursor-not-allowed'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center font-bold text-slate-400 group-hover:text-indigo-600">{index + 1}</div>
                    <span className="font-bold text-slate-700 group-hover:text-indigo-600">{lesson.title}</span>
                  </div>
                  {canView ? <PlayCircle className="h-5 w-5 text-slate-300 group-hover:text-indigo-600" /> : <Lock className="h-5 w-5 text-slate-300" />}
                </div>
              );
            })}
          </div>
        </div>

        <div className="w-full lg:w-96">
          <div className="sticky top-24 bg-white border border-slate-200 rounded-[2rem] p-8 shadow-xl text-center">
            {isInstructor ? (
              <div className="space-y-3">
                <div className="bg-indigo-50 h-16 w-16 rounded-2xl flex items-center justify-center mx-auto mb-6"><Layout className="h-8 w-8 text-indigo-600" /></div>
                <h3 className="text-xl font-black text-slate-900 mb-8 uppercase tracking-tighter">Instructor Tools</h3>
                <Link href={`/instructor/courses/${course.slug}/lessons/create`} className="w-full flex items-center justify-center gap-2 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs tracking-widest hover:bg-indigo-700 transition-all"><PlusCircle className="h-4 w-4" /> ADD LESSONS</Link>
                <Link href={`/instructor/courses/${course.slug}/edit`} className="w-full flex items-center justify-center gap-2 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs tracking-widest hover:bg-slate-800 transition-all"><Edit3 className="h-4 w-4" /> EDIT COURSE</Link>
              </div>
            ) : isEnrolled ? (
               <div className="space-y-4">
                 <h3 className="text-2xl font-black text-slate-900 mb-6 uppercase tracking-tighter italic">Enrolled</h3>
                 <button onClick={() => course.lessons?.length > 0 ? router.push(`/courses/${course.slug}/lessons/${course.lessons[0].id}`) : toast.error("No lessons yet.")} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-sm tracking-widest hover:bg-indigo-700 transition-all shadow-lg">CONTINUE COURSE</button>
                 <button onClick={handleUnenroll} disabled={actionLoading} className="w-full flex items-center justify-center gap-2 py-4 text-red-500 font-bold text-xs tracking-widest hover:bg-red-50 rounded-2xl transition-all"><Trash2 className="h-4 w-4" /> OPT OUT OF COURSE</button>
               </div>
            ) : (
               <div>
                 <h3 className="text-2xl font-black text-slate-900 mb-6 uppercase tracking-tighter italic">Enroll Now</h3>
                 <button onClick={handleEnroll} disabled={actionLoading} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-sm tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50">{actionLoading ? "ENROLLING..." : "ENROLL NOW — FREE"}</button>
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}