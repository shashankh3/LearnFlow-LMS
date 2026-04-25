"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import {
  ArrowLeft, BookOpen, Clock, CheckCircle, PlayCircle,
  Lock, Award, Sparkles, Edit, Trash2, Plus,
  AlertTriangle, ChevronRight, Users, TrendingUp, Play
} from "lucide-react";

const getYoutubeId = (url: string) => {
  const match = url?.match(/(?:youtu\.be\/|youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  return match?.[1] || null;
};

const getYoutubeThumbnail = (lessons: any[]) => {
  for (const lesson of lessons || []) {
    if (lesson.video_url) {
      const id = getYoutubeId(lesson.video_url);
      if (id) return `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
    }
  }
  return null;
};

export default function CourseDetailPage() {
  const router = useRouter();
  const { slug } = useParams();

  const [course, setCourse] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeLesson, setActiveLesson] = useState<any>(null);
  const [marking, setMarking] = useState(false);
  const [quiz, setQuiz] = useState<any[]>([]);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<{ [key: number]: number }>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("access");
        if (!token) { router.push("/login"); return; }
        const [profileRes, courseRes] = await Promise.all([
          api.get("/auth/me/"),
          api.get(`/courses/${slug}/`)
        ]);
        setUser(profileRes.data);
        setCourse(courseRes.data);
        if (!profileRes.data.is_instructor) {
          try {
            const enrollRes = await api.get("/enrollments/");
            const found = enrollRes.data.find(
              (e: any) => e.course === courseRes.data.id || e.course_details?.slug === slug
            );
            setEnrollment(found || null);
          } catch {}
        }
        if (courseRes.data.lessons?.length > 0) setActiveLesson(courseRes.data.lessons[0]);
      } catch {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [slug, router]);

  const isCompleted = (lessonId: number) => enrollment?.completed_lessons?.includes(lessonId);

  const handleMarkComplete = async () => {
    if (!activeLesson || !enrollment) return;
    setMarking(true);
    try {
      await api.post(`/courses/${slug}/lessons/${activeLesson.id}/complete/`);
      const enrollRes = await api.get("/enrollments/");
      const updated = enrollRes.data.find((e: any) => e.course_details?.slug === slug);
      setEnrollment(updated);
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to mark complete.");
    } finally {
      setMarking(false);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!activeLesson) return;
    setQuizLoading(true);
    setQuiz([]);
    setQuizAnswers({});
    setQuizSubmitted(false);
    try {
      const res = await api.post(`/lessons/${activeLesson.id}/quiz/`);
      setQuiz(res.data);
    } catch {
      alert("Quiz generation failed. Try again.");
    } finally {
      setQuizLoading(false);
    }
  };

  const handleDeleteCourse = async () => {
    setDeleting(true);
    try {
      await api.delete(`/courses/${slug}/`);
      router.push("/instructor/dashboard");
    } catch {
      alert("Failed to delete course.");
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const quizScore = quiz.filter((q, i) => quizAnswers[i] === q.correctIndex).length;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400 font-medium">Loading course...</p>
      </div>
    </div>
  );

  if (!course) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="text-gray-400 font-semibold">Course not found</p>
    </div>
  );

  const isInstructor = user?.is_instructor && course.instructor_name === user?.username;
  const progress = enrollment?.progress ?? 0;
  const ytId = activeLesson?.video_url ? getYoutubeId(activeLesson.video_url) : null;
  const heroThumbnail = getYoutubeThumbnail(course.lessons);
  const totalLessons = course.lessons?.length || 0;
  const completedCount = enrollment?.completed_lessons?.length || 0;

  return (
    <div className="min-h-screen bg-[#f5f5f7]">

      {/* ── Delete Confirmation Modal ── */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <AlertTriangle size={30} className="text-red-500" />
            </div>
            <h3 className="text-xl font-black text-gray-900 text-center mb-2">Delete Course?</h3>
            <p className="text-sm text-gray-400 text-center mb-2 leading-relaxed">
              You're about to permanently delete
            </p>
            <p className="text-sm font-bold text-gray-800 text-center mb-6 px-4 line-clamp-2">
              "{course.title}"
            </p>
            <p className="text-xs text-red-400 text-center mb-8 font-medium">
              ⚠️ All lessons and student progress will be lost. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-3.5 bg-gray-100 text-gray-700 rounded-2xl font-bold text-sm hover:bg-gray-200 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCourse}
                disabled={deleting}
                className="flex-1 py-3.5 bg-red-500 text-white rounded-2xl font-bold text-sm hover:bg-red-600 active:scale-95 disabled:opacity-60 transition-all"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Hero Banner ── */}
      <div className="relative overflow-hidden bg-gray-900">
        {/* Background thumbnail blurred */}
        {heroThumbnail && (
          <div className="absolute inset-0">
            <img src={heroThumbnail} className="w-full h-full object-cover opacity-20 scale-105 blur-sm" alt="" />
            <div className="absolute inset-0 bg-gradient-to-r from-gray-900/95 via-gray-900/80 to-gray-900/60" />
          </div>
        )}

        <div className="relative max-w-6xl mx-auto px-8 py-10">
          {/* Back link */}
          <Link
            href={isInstructor ? "/instructor/dashboard" : "/student/dashboard"}
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm font-semibold mb-8 transition-colors group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </Link>

          <div className="flex items-start gap-10 flex-wrap lg:flex-nowrap">
            {/* Left — course info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1 bg-indigo-500/30 text-indigo-300 text-[11px] font-bold uppercase tracking-widest rounded-full border border-indigo-500/30">
                  {course.difficulty}
                </span>
                {enrollment?.is_completed && (
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 text-[11px] font-bold uppercase tracking-widest rounded-full border border-green-500/30">
                    ✓ Completed
                  </span>
                )}
              </div>

              <h1 className="text-3xl lg:text-4xl font-black text-white mb-4 leading-tight tracking-tight">
                {course.title}
              </h1>
              <p className="text-gray-400 text-sm leading-relaxed mb-6 max-w-xl">
                {course.description}
              </p>

              <div className="flex items-center gap-6 text-sm text-gray-400">
                <span className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[9px] font-black">
                    {course.instructor_name?.[0]?.toUpperCase()}
                  </div>
                  {course.instructor_name}
                </span>
                <span className="flex items-center gap-1.5">
                  <BookOpen size={14} /> {totalLessons} lessons
                </span>
                {!isInstructor && enrollment && (
                  <span className="flex items-center gap-1.5">
                    <TrendingUp size={14} /> {progress}% complete
                  </span>
                )}
              </div>

              {/* Student progress bar */}
              {!isInstructor && enrollment && (
                <div className="mt-6 max-w-sm">
                  <div className="flex justify-between text-xs text-gray-400 mb-2">
                    <span>{completedCount}/{totalLessons} lessons done</span>
                    <span className="font-bold text-white">{progress}%</span>
                  </div>
                  <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Right — thumbnail preview card */}
            <div className="w-full lg:w-72 flex-shrink-0">
              <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                {heroThumbnail ? (
                  <div className="relative aspect-video">
                    <img src={heroThumbnail} className="w-full h-full object-cover" alt={course.title} />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center shadow-xl">
                        <Play size={22} className="text-indigo-600 ml-1" fill="currentColor" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-video bg-indigo-900/50 flex items-center justify-center">
                    <PlayCircle size={40} className="text-indigo-400" />
                  </div>
                )}

                {/* Instructor tools inside card */}
                {isInstructor && (
                  <div className="bg-gray-900/80 backdrop-blur p-4 space-y-2 border-t border-white/10">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Instructor Tools</p>
                    <Link href={`/instructor/courses/${slug}/lessons/create`}
                      className="flex items-center gap-2.5 w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs transition-all">
                      <Plus size={14} /> Add Lesson
                    </Link>
                    <Link href={`/courses/${slug}/edit`}
                      className="flex items-center gap-2.5 w-full px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-xs transition-all border border-white/10">
                      <Edit size={14} /> Edit Course
                    </Link>
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="flex items-center gap-2.5 w-full px-4 py-2.5 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-xl font-bold text-xs transition-all border border-red-500/20">
                      <Trash2 size={14} /> Delete Course
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-6xl mx-auto px-8 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left — Video + Quiz */}
        <div className="lg:col-span-2 space-y-6">

          {/* Video Player */}
          {activeLesson && (
            <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-200/60">
              {ytId ? (
                <div className="aspect-video bg-black">
                  <iframe
                    src={`https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1`}
                    className="w-full h-full"
                    allowFullScreen
                    title={activeLesson.title}
                  />
                </div>
              ) : (
                <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <div className="text-center">
                    <PlayCircle size={48} className="text-gray-300 mx-auto mb-2" />
                    <p className="text-xs text-gray-400 font-medium">No video available</p>
                  </div>
                </div>
              )}

              <div className="p-6">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <p className="text-[11px] font-bold text-indigo-500 uppercase tracking-widest mb-1">
                      Lesson {(course.lessons?.findIndex((l: any) => l.id === activeLesson.id) ?? 0) + 1} of {totalLessons}
                    </p>
                    <h2 className="text-xl font-black text-gray-900">{activeLesson.title}</h2>
                  </div>
                  {isCompleted(activeLesson.id) && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-600 rounded-full border border-green-200 flex-shrink-0">
                      <CheckCircle size={14} />
                      <span className="text-[11px] font-bold">Done</span>
                    </div>
                  )}
                </div>

                {activeLesson.content && (
                  <p className="text-sm text-gray-500 leading-relaxed mb-6 pb-6 border-b border-gray-100">
                    {activeLesson.content}
                  </p>
                )}

                {/* Student action buttons */}
                {!isInstructor && enrollment && (
                  <div className="flex flex-wrap gap-3">
                    {!isCompleted(activeLesson.id) ? (
                      <button
                        onClick={handleMarkComplete}
                        disabled={marking}
                        className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 active:scale-95 disabled:opacity-60 transition-all shadow-sm shadow-indigo-200"
                      >
                        <CheckCircle size={16} />
                        {marking ? "Saving..." : "Mark as Complete"}
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 px-6 py-3 bg-green-50 text-green-600 rounded-2xl font-bold text-sm border border-green-200">
                        <CheckCircle size={16} /> Lesson Complete ✓
                      </div>
                    )}

                    <button
                      onClick={handleGenerateQuiz}
                      disabled={quizLoading}
                      className="flex items-center gap-2 px-6 py-3 bg-violet-600 text-white rounded-2xl font-bold text-sm hover:bg-violet-700 active:scale-95 disabled:opacity-60 transition-all shadow-sm shadow-violet-200"
                    >
                      <Sparkles size={16} />
                      {quizLoading ? "Generating Quiz..." : "Generate AI Quiz"}
                    </button>
                  </div>
                )}

                {!isInstructor && !enrollment && (
                  <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                    <Lock size={18} className="text-amber-500 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-amber-800">Enroll to track progress</p>
                      <p className="text-xs text-amber-600">Go to Explore to enroll in this course</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* AI Quiz */}
          {quiz.length > 0 && (
            <div className="bg-white rounded-3xl border border-gray-200/60 p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-violet-100 rounded-2xl flex items-center justify-center">
                  <Sparkles size={18} className="text-violet-600" />
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900">AI Practice Quiz</h3>
                  <p className="text-xs text-gray-400">{quiz.length} questions based on this lesson</p>
                </div>
              </div>

              <div className="space-y-8">
                {quiz.map((q, qi) => (
                  <div key={qi}>
                    <p className="text-sm font-bold text-gray-900 mb-3 leading-relaxed">
                      <span className="text-indigo-500 mr-2">Q{qi + 1}.</span>{q.question}
                    </p>
                    <div className="grid gap-2">
                      {q.options.map((opt: string, oi: number) => {
                        let cls = "border-gray-200 bg-gray-50 text-gray-700 hover:border-indigo-300 hover:bg-indigo-50";
                        if (quizSubmitted) {
                          if (oi === q.correctIndex) cls = "border-green-400 bg-green-50 text-green-700";
                          else if (quizAnswers[qi] === oi) cls = "border-red-400 bg-red-50 text-red-600";
                          else cls = "border-gray-100 bg-gray-50 text-gray-400";
                        } else if (quizAnswers[qi] === oi) {
                          cls = "border-indigo-500 bg-indigo-50 text-indigo-700";
                        }
                        return (
                          <button key={oi} disabled={quizSubmitted}
                            onClick={() => setQuizAnswers(prev => ({ ...prev, [qi]: oi }))}
                            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium border-2 transition-all ${cls} disabled:cursor-default`}>
                            <span className="font-bold mr-2 opacity-60">{String.fromCharCode(65 + oi)}.</span>{opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {!quizSubmitted ? (
                <button
                  onClick={() => setQuizSubmitted(true)}
                  disabled={Object.keys(quizAnswers).length < quiz.length}
                  className="mt-8 w-full py-4 bg-violet-600 text-white rounded-2xl font-bold text-sm hover:bg-violet-700 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Submit Answers ({Object.keys(quizAnswers).length}/{quiz.length} answered)
                </button>
              ) : (
                <div className={`mt-8 p-5 rounded-2xl text-center ${
                  quizScore === quiz.length
                    ? 'bg-green-50 border-2 border-green-200'
                    : quizScore >= quiz.length / 2
                    ? 'bg-amber-50 border-2 border-amber-200'
                    : 'bg-red-50 border-2 border-red-200'
                }`}>
                  <p className="text-2xl font-black mb-1">
                    {quizScore === quiz.length ? "🎉" : quizScore >= quiz.length / 2 ? "👍" : "📚"}
                  </p>
                  <p className={`text-lg font-black ${
                    quizScore === quiz.length ? 'text-green-700' : quizScore >= quiz.length / 2 ? 'text-amber-700' : 'text-red-600'
                  }`}>
                    {quizScore}/{quiz.length} correct
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {quizScore === quiz.length ? "Perfect score!" : quizScore >= quiz.length / 2 ? "Good job! Review the missed ones." : "Keep studying and try again."}
                  </p>
                  <button
                    onClick={() => { setQuizSubmitted(false); setQuizAnswers({}); }}
                    className="mt-4 px-5 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-50 transition-all"
                  >
                    Retry Quiz
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right — Lesson list + Certificate */}
        <div className="space-y-5">

          {/* Lesson Sidebar */}
          <div className="bg-white rounded-3xl border border-gray-200/60 overflow-hidden shadow-sm">
            <div className="px-6 py-5 border-b border-gray-100">
              <h3 className="text-sm font-black text-gray-900">Course Curriculum</h3>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex-1 bg-gray-100 h-1 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                </div>
                <span className="text-[11px] font-bold text-gray-400">{completedCount}/{totalLessons}</span>
              </div>
            </div>

            <div className="divide-y divide-gray-50 max-h-[500px] overflow-y-auto">
              {course.lessons?.map((lesson: any, idx: number) => {
                const done = isCompleted(lesson.id);
                const isActive = activeLesson?.id === lesson.id;
                return (
                  <button
                    key={lesson.id}
                    onClick={() => {
                      setActiveLesson(lesson);
                      setQuiz([]);
                      setQuizSubmitted(false);
                      setQuizAnswers({});
                    }}
                    className={`w-full flex items-center gap-3 px-5 py-4 text-left transition-all ${
                      isActive ? 'bg-indigo-50' : 'hover:bg-gray-50/80'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 transition-colors ${
                      done
                        ? 'bg-green-500 text-white'
                        : isActive
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {done ? <CheckCircle size={14} /> : idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold truncate transition-colors ${
                        isActive ? 'text-indigo-700' : done ? 'text-gray-500' : 'text-gray-800'
                      }`}>
                        {lesson.title}
                      </p>
                      {isActive && (
                        <p className="text-[10px] text-indigo-400 font-medium mt-0.5">Now playing</p>
                      )}
                    </div>
                    {isActive && !done && (
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" />
                    )}
                    {!isInstructor && !enrollment && (
                      <Lock size={11} className="text-gray-300 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Certificate card */}
          {!isInstructor && enrollment?.is_completed && (
            <Link href={`/courses/${slug}/certificate`}
              className="flex items-center gap-4 p-5 bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl text-white hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Award size={24} />
              </div>
              <div className="flex-1">
                <p className="font-black text-sm">Claim Certificate</p>
                <p className="text-amber-100 text-xs mt-0.5">You completed this course 🎉</p>
              </div>
              <ChevronRight size={18} className="opacity-70 group-hover:translate-x-1 transition-transform" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}