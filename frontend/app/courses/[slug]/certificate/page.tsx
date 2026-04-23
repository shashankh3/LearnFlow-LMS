"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { ArrowLeft, Printer, Award, CheckCircle, BookOpen } from "lucide-react";

export default function CertificatePage() {
  const { slug } = useParams();
  const router = useRouter();
  const [course, setCourse] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [courseRes, userRes, dashboardRes] = await Promise.all([
          api.get(`/courses/${slug}/`),
          api.get("/auth/me/"),
          api.get("/student/dashboard/")
        ]);
        
        const currentCourse = dashboardRes.data.find((c: any) => c.slug === slug);
        
        if (!currentCourse || currentCourse.percentage < 100) {
          alert("You must complete the course to view this certificate.");
          router.push("/dashboard");
          return;
        }

        setCourse(courseRes.data);
        setUser(userRes.data);
      } catch (err) {
        console.error("Error fetching certificate data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [slug, router]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Generating Certificate...</div>;
  if (!course || !user) return <div>Certificate Not Found</div>;

  const handlePrint = () => {
    window.print();
  };

  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <>
      {/* This strict print CSS forces Landscape, removes all browser margins, 
        and ensures it fits on exactly 1 page without splitting borders. 
      */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { size: landscape; margin: 0; }
          body { margin: 0; padding: 0; background-color: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          html, body { height: 100%; overflow: hidden; }
          #certificate-wrapper { width: 100vw; height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; box-sizing: border-box; }
          #certificate-card { width: 100%; height: 100%; max-width: none; max-height: none; box-shadow: none !important; border-radius: 0 !important; }
          .hide-on-print { display: none !important; }
        }
      `}} />

      <div className="min-h-screen bg-slate-900 py-12 px-8 flex flex-col items-center justify-center">
        
        {/* Web-only Controls */}
        <div className="w-full max-w-[1000px] mb-8 flex justify-between items-center hide-on-print">
          <Link href="/dashboard" className="inline-flex items-center text-slate-400 hover:text-white font-bold text-sm transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" /> BACK TO DASHBOARD
          </Link>
          <button onClick={handlePrint} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-black text-sm tracking-widest flex items-center gap-2 hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-900/50">
            <Printer className="h-4 w-4" /> PRINT / SAVE AS PDF
          </button>
        </div>

        {/* Certificate Container */}
        <div id="certificate-wrapper" className="w-full max-w-[1000px] flex items-center justify-center">
          
          <div id="certificate-card" className="w-full aspect-[1.414/1] bg-white rounded-none lg:rounded-[2rem] p-4 lg:p-8 shadow-2xl relative overflow-hidden">
            
            {/* The V1 Elegant Cream Inner Border */}
            <div className="w-full h-full border-[12px] border-double border-slate-200 p-10 lg:p-14 relative flex flex-col bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]">
              
              {/* Corner Decorations */}
              <div className="absolute top-4 left-4 w-12 h-12 border-t-4 border-l-4 border-indigo-600"></div>
              <div className="absolute top-4 right-4 w-12 h-12 border-t-4 border-r-4 border-indigo-600"></div>
              <div className="absolute bottom-4 left-4 w-12 h-12 border-b-4 border-l-4 border-indigo-600"></div>
              <div className="absolute bottom-4 right-4 w-12 h-12 border-b-4 border-r-4 border-indigo-600"></div>

              {/* Top Branding (Coursera Style) */}
              <div className="flex items-center gap-3 mb-8">
                <div className="h-10 w-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                  <BookOpen className="h-6 w-6" />
                </div>
                <span className="text-xl font-black text-slate-900 tracking-tighter">LEARNFLOW <span className="font-medium text-slate-500">ACADEMY</span></span>
              </div>
              
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <h1 className="text-[12px] lg:text-sm font-black text-indigo-600 uppercase tracking-[0.5em] mb-6">
                  Certificate of Completion
                </h1>
                
                <p className="text-xs lg:text-sm font-bold text-slate-500 tracking-widest uppercase mb-8">
                  This is to certify that
                </p>

                {/* Name */}
                <h2 className="text-5xl lg:text-6xl font-black text-slate-900 italic tracking-tighter mb-8 pb-4 px-12 inline-block">
                  {user.username}
                </h2>

                <p className="text-xs lg:text-sm font-bold text-slate-500 tracking-widest uppercase mb-4">
                  Has successfully completed the course
                </p>

                {/* Course Title */}
                <h3 className="text-2xl lg:text-3xl font-black text-slate-800 mb-8 max-w-2xl leading-tight">
                  {course.title}
                </h3>
              </div>

              {/* Footer Signatures */}
              <div className="w-full flex justify-between items-end px-4 lg:px-12 mt-auto">
                <div className="text-center w-48">
                  <p className="text-base lg:text-lg font-black text-slate-900 italic mb-2">{today}</p>
                  <div className="w-full h-[2px] bg-slate-300 mb-2 mx-auto"></div>
                  <p className="text-[8px] lg:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date Issued</p>
                </div>
                
                <div className="flex flex-col items-center opacity-30 pb-2">
                   <CheckCircle className="h-14 w-14 lg:h-16 lg:w-16 text-slate-900" />
                   <p className="text-[8px] font-black tracking-widest mt-2 uppercase">Verified</p>
                </div>

                <div className="text-center w-48">
                  <p className="text-base lg:text-lg font-black text-slate-900 italic mb-2">{course.instructor_name}</p>
                  <div className="w-full h-[2px] bg-slate-300 mb-2 mx-auto"></div>
                  <p className="text-[8px] lg:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Instructor Signature</p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </>
  );
}