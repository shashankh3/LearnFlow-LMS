"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { ArrowLeft, Award, Download, Share2, CheckCircle } from "lucide-react";

export default function CertificatePage() {
  const router = useRouter();
  const { slug } = useParams();
  const certRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState<any>(null);
  const [course, setCourse] = useState<any>(null);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [completedDate, setCompletedDate] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("access");
        if (!token) { router.push("/login"); return; }

        const [profileRes, courseRes, enrollRes] = await Promise.all([
          api.get("/auth/me/"),
          api.get(`/courses/${slug}/`),
          api.get("/enrollments/")
        ]);

        const found = enrollRes.data.find(
          (e: any) => e.course === courseRes.data.id || e.course_details?.slug === slug
        );

        if (!found) {
          setError("You are not enrolled in this course.");
          setLoading(false);
          return;
        }

        if (!found.is_completed) {
          setError("Complete all lessons to unlock your certificate.");
          setLoading(false);
          return;
        }

        setUser(profileRes.data);
        setCourse(courseRes.data);
        setEnrollment(found);

        // Format date
        const date = found.enrolled_at
          ? new Date(found.enrolled_at)
          : new Date();
        setCompletedDate(date.toLocaleDateString("en-US", {
          year: "numeric", month: "long", day: "numeric"
        }));

      } catch {
        setError("Something went wrong. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [slug, router]);

  const handlePrint = () => window.print();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7]">
      <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7] p-6">
      <div className="bg-white rounded-3xl p-10 max-w-md w-full shadow-xl border border-gray-200/60 text-center">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <Award size={30} className="text-amber-500" />
        </div>
        <h2 className="text-xl font-black text-gray-900 mb-2">Certificate Unavailable</h2>
        <p className="text-sm text-gray-400 leading-relaxed mb-8">{error}</p>
        <div className="flex flex-col gap-3">
          <Link href={`/courses/${slug}`}
            className="w-full py-3.5 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-all text-center">
            Continue Learning
          </Link>
          <Link href="/student/dashboard"
            className="w-full py-3.5 bg-gray-100 text-gray-700 rounded-2xl font-bold text-sm hover:bg-gray-200 transition-all text-center">
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f5f5f7]">

      {/* Top nav — hidden on print */}
      <div className="print:hidden bg-white border-b border-gray-200/60 px-8 py-4 flex items-center justify-between">
        <Link href={`/courses/${slug}`}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 font-semibold transition-colors group">
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          Back to Course
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 active:scale-95 transition-all shadow-sm shadow-indigo-200"
          >
            <Download size={15} /> Download / Print
          </button>
        </div>
      </div>

      {/* Certificate wrapper */}
      <div className="flex items-center justify-center p-8 print:p-0">
        <div ref={certRef}
          className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl shadow-gray-300/50 overflow-hidden print:shadow-none print:rounded-none print:max-w-full">

          {/* Top accent bar */}
          <div className="h-2 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600" />

          {/* Certificate body */}
          <div className="px-16 py-14 text-center relative">

            {/* Subtle background pattern */}
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
              style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, #6366f1 1px, transparent 0)`,
                backgroundSize: "32px 32px"
              }}
            />

            {/* Logo / Brand */}
            <div className="flex items-center justify-center gap-2 mb-10">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                <Award size={20} className="text-white" />
              </div>
              <span className="text-2xl font-black text-indigo-600 tracking-tight">LEARNFLOW</span>
            </div>

            {/* Header text */}
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.3em] mb-4">
              Certificate of Completion
            </p>

            <p className="text-base text-gray-500 font-medium mb-3">
              This is to proudly certify that
            </p>

            {/* Student name */}
            <div className="relative inline-block mb-3">
              <h1 className="text-5xl font-black text-gray-900 tracking-tight"
                style={{ fontFamily: "Georgia, serif" }}>
                {user?.username}
              </h1>
              <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 rounded-full" />
            </div>

            <p className="text-base text-gray-500 font-medium mt-6 mb-3">
              has successfully completed the course
            </p>

            {/* Course name */}
            <h2 className="text-2xl font-black text-gray-900 mb-2 max-w-lg mx-auto leading-tight">
              {course?.title}
            </h2>

            <div className="flex items-center justify-center gap-2 mb-10">
              <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-full border border-indigo-100">
                {course?.difficulty}
              </span>
              <span className="px-3 py-1 bg-gray-50 text-gray-500 text-xs font-bold rounded-full border border-gray-100">
                {course?.lessons?.length || 0} Lessons
              </span>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4 mb-10">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
              <div className="w-8 h-8 bg-indigo-50 rounded-full flex items-center justify-center">
                <CheckCircle size={16} className="text-indigo-500" />
              </div>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
            </div>

            {/* Footer details */}
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Instructor</p>
                <p className="text-sm font-black text-gray-800">{course?.instructor_name}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Issued On</p>
                <p className="text-sm font-black text-gray-800">{completedDate}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Platform</p>
                <p className="text-sm font-black text-gray-800">LearnFlow</p>
              </div>
            </div>

            {/* Seal */}
            <div className="absolute bottom-10 right-14 print:block hidden">
              <div className="w-20 h-20 rounded-full border-4 border-indigo-200 flex flex-col items-center justify-center bg-indigo-50">
                <Award size={24} className="text-indigo-600 mb-0.5" />
                <p className="text-[8px] font-black text-indigo-600 uppercase tracking-wider">Verified</p>
              </div>
            </div>
          </div>

          {/* Bottom accent bar */}
          <div className="h-2 bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600" />
        </div>
      </div>

      {/* Share / actions below cert — hidden on print */}
      <div className="print:hidden flex justify-center pb-10">
        <div className="bg-white rounded-2xl border border-gray-200/60 px-8 py-5 flex items-center gap-6 shadow-sm">
          <div>
            <p className="text-sm font-black text-gray-900">🎉 Congratulations!</p>
            <p className="text-xs text-gray-400 mt-0.5">You've earned this certificate</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all">
              <Download size={14} /> Save as PDF
            </button>
            <Link href="/student/dashboard"
              className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200 transition-all">
              Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          .print\\:block, .print\\:block * { visibility: visible; }
          [ref="certRef"], [ref="certRef"] * { visibility: visible; }
          .bg-white.rounded-3xl { visibility: visible !important; }
          .bg-white.rounded-3xl * { visibility: visible !important; }
          @page { margin: 0; size: A4 landscape; }
        }
      `}</style>
    </div>
  );
}