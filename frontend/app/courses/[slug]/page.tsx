"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import {
  ArrowLeft, CheckCircle, PlayCircle, Lock, Award,
  Sparkles, Edit, Trash2, Plus, AlertTriangle,
  ChevronRight, Play, RotateCcw, BookOpen, Loader2
} from "lucide-react";

const getYoutubeId = (url: string) => {
  const match = url?.match(/(?:youtu\.be\/|youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  return match?.[1] || null;
};

const getYoutubeThumbnail = (lessons: any[]) => {
  for (const lesson of lessons || []) {
    const id = lesson.video_url ? getYoutubeId(lesson.video_url) : null;
    if (id) return `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
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
  const [toggling, setToggling] = useState(false);

  // Quiz state
  const [quiz, setQuiz] = useState<any[]>([]);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizError, setQuizError] = useState("");
  const [quizAnswers, setQuizAnswers] = useState<{ [key: number]: number }>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);

  // Delete state
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

  const isLessonDone = (lessonId: number) =>
    enrollment?.completed_lessons?.includes(lessonId);

  // ✅ Toggle mark/unmark — updates state immediately without page refresh
  const handleToggleComplete = async () => {
    if (!activeLesson || !enrollment || toggling) return;
    setToggling(true);
    try {
      const res = await api.post(`/courses/${slug}/lessons/${activeLesson.id}/complete/`);
      // Update enrollment in place — no refetch needed
      setEnrollment((prev: any) => ({
        ...prev,
        progress: res.data.progress,
        is_completed: res.data.is_completed,
        completed_lessons: res.data.completed_lessons,
      }));
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to update lesson status.");
    } finally {
      setToggling(false);
    }
  };

  // ✅ Fixed quiz — clears previous state properly and shows inline errors
  const handleGenerateQuiz = async () => {
    if (!activeLesson || quizLoading) return;
    setQuizLoading(true);
    setQuiz([]);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizError("");
    setShowQuiz(true);
    try {
      const res = await api.post(`/lessons/${activeLesson.id}/quiz/`);
      if (!Array.isArray(res.data) || res.data.length === 0) {
        setQuizError("Quiz generation returned empty. Try again.");
        return;
      }
      setQuiz(res.data);
    } catch (err: any) {
      const msg = err.response?.data?.error || "Quiz generation failed. Try again.";
      setQuizError(msg);
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
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400 font-medium">Loading course...</p>
      </div>
    </div>
  );

  if (!course) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7]">
      <p className="text-gray-400 font-semibold">Course not found</p>
    </div>
  );

  const isInstructor = user?.is_instructor && course.instructor_name === user?.username;
  const progress = enrollment?.progress ?? 0;
  const ytId = activeLesson?.video_url ? getYoutubeId(activeLesson.video_url) : null;
  const heroThumb = getYoutubeThumbnail(course.lessons);
  const totalLessons = course.lessons?.length || 0;
  const completedCount = enrollment?.completed_lessons?.length || 0;
  const activeLessonDone = activeLesson ? isLessonDone(activeLesson.id) : false;
  const activeLessonIndex = course.lessons?.findIndex((l: any) => l.id === activeLesson?.id) ?? 0;

  return (
    <div className="min-h-screen bg-[#f5f5f7]">

      {/* ── Delete Modal ── */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <AlertTriangle size={28} className="text-red-500" />
            </div>
            <h3 className="text-lg font-black text-gray-900 text-center mb-1">Delete this course?</h3>
            <p className="text-xs text-red-400 text-center mb-6 leading-relaxed">
              All lessons and student progress will be permanently lost.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-3.5 bg-gray-100 text-gray-700 rounded-2xl font-bold text-sm hover:bg-gray-200 transition-all">
                Cancel
              </button>
              <button onClick={handleDeleteCourse} disabled={deleting}
                className="flex-1 py-3.5 bg-red-500 text-white rounded-2xl font-bold text-sm hover:bg-red-600 disabled:opacity-60 transition-all">
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Top Nav ── */}
      <div className="bg-white border-b border-gray-200/60 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link
            href={isInstructor ? "/instructor/dashboard" : "/student/dashboard"}
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 font-semibold transition-colors group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            Dashboard
          </Link>

          {/* Progress pill for students */}
          {!isInstructor && enrollment && (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500 font-semibold">
                <span>{completedCount}/{totalLessons} lessons</span>
              </div>
              <div className="w-32 bg-gray-100 h-2 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }} />
              </div>
              <span className="text-sm font-black text-gray-900">{progress}%</span>
            </div>
          )}

          {/* Instructor tools in nav */}
          {isInstructor && (
            <div className="flex items-center gap-2">
              <Link href={`/instructor/courses/${slug}/lessons/create`}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-all">
                <Plus size={13} /> Add Lesson
              </Link>
              <Link href={`/courses/${slug}/edit`}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-200 transition-all">
                <Edit size={13} /> Edit
              </Link>
              <button onClick={() => setShowDeleteModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-500 rounded-lg text-xs font-bold hover:bg-red-100 transition-all">
                <Trash2 size={13} /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Main Layout ── */}
      <div className="max-w-7xl mx-auto px-6 py-6 flex gap-6">

        {/* ── LEFT: Lesson Sidebar ── */}
        <aside className="w-72 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden sticky top-20">
            {/* Course info */}
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-full">
                  {course.difficulty}
                </span>
              </div>
              <h2 className="text-sm font-black text-gray-900 line-clamp-2 leading-snug mb-3">
                {course.title}
              </h2>
              {/* Progress bar */}
              {!isInstructor && enrollment && (
                <div>
                  <div className="flex justify-between text-[10px] text-gray-400 font-semibold mb-1.5">
                    <span>Progress</span>
                    <span className="text-indigo-600 font-black">{completedCount}/{totalLessons}</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 rounded-full transition-all duration-700"
                      style={{ width: `${progress}%` }} />
                  </div>
                </div>
              )}
            </div>

            {/* Lesson list */}
            <div className="overflow-y-auto max-h-[calc(100vh-280px)]">
              {course.lessons?.map((lesson: any, idx: number) => {
                const done = isLessonDone(lesson.id);
                const isActive = activeLesson?.id === lesson.id;
                return (
                  <button
                    key={lesson.id}
                    onClick={() => {
                      setActiveLesson(lesson);
                      setShowQuiz(false);
                      setQuiz([]);
                      setQuizSubmitted(false);
                      setQuizAnswers({});
                      setQuizError("");
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all border-l-2 ${
                      isActive
                        ? 'bg-indigo-50 border-indigo-600'
                        : 'border-transparent hover:bg-gray-50 hover:border-gray-200'
                    }`}
                  >
                    {/* Status circle */}
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 transition-all ${
                      done ? 'bg-green-500 text-white' :
                      isActive ? 'bg-indigo-600 text-white' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {done ? <CheckCircle size={14} /> : idx + 1}
                    </div>

                    {/* Lesson title */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold truncate ${
                        isActive ? 'text-indigo-700' : done ? 'text-gray-400' : 'text-gray-800'
                      }`}>
                        {lesson.title}
                      </p>
                      {isActive && (
                        <p className="text-[10px] text-indigo-400 font-medium mt-0.5">▶ Now playing</p>
                      )}
                    </div>

                    {done && !isActive && (
                      <CheckCircle size={12} className="text-green-400 flex-shrink-0" />
                    )}
                    {!isInstructor && !enrollment && (
                      <Lock size={11} className="text-gray-300 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Certificate */}
            {!isInstructor && enrollment?.is_completed && (
              <div className="p-3 border-t border-gray-100">
                <Link href={`/courses/${slug}/certificate`}
                  className="flex items-center gap-3 p-3 bg-gradient-to-r from-amber-400 to-orange-500 rounded-xl text-white hover:shadow-md transition-all group">
                  <Award size={18} />
                  <div className="flex-1">
                    <p className="text-xs font-black">Get Certificate</p>
                    <p className="text-[10px] text-amber-100">Course complete 🎉</p>
                  </div>
                  <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            )}
          </div>
        </aside>

        {/* ── RIGHT: Video + Actions ── */}
        <div className="flex-1 min-w-0 space-y-5">

          {activeLesson ? (
            <>
              {/* Video Player */}
              <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
                {/* Video */}
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
                  <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col items-center justify-center gap-3">
                    <PlayCircle size={48} className="text-gray-300" />
                    <p className="text-xs text-gray-400 font-medium">No video for this lesson</p>
                  </div>
                )}

                {/* Lesson info + actions */}
                <div className="p-6">
                  {/* Lesson title row */}
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <p className="text-[11px] font-bold text-indigo-500 uppercase tracking-widest mb-1">
                        Lesson {activeLessonIndex + 1} of {totalLessons}
                      </p>
                      <h1 className="text-xl font-black text-gray-900 leading-tight">
                        {activeLesson.title}
                      </h1>
                    </div>
                  </div>

                  {activeLesson.content && (
                    <p className="text-sm text-gray-500 leading-relaxed mt-3 mb-5 pb-5 border-b border-gray-100">
                      {activeLesson.content}
                    </p>
                  )}

                  {/* ── Student Action Bar ── */}
                  {!isInstructor && enrollment && (
                    <div className="flex flex-wrap items-center gap-3 mt-4">

                      {/* ✅ Toggle Mark Complete — always visible, works for every lesson */}
                      <button
                        onClick={handleToggleComplete}
                        disabled={toggling}
                        className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all active:scale-95 disabled:opacity-60 ${
                          activeLessonDone
                            ? 'bg-green-100 text-green-700 border-2 border-green-300 hover:bg-green-200'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-200'
                        }`}
                      >
                        {toggling ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : activeLessonDone ? (
                          <CheckCircle size={16} />
                        ) : (
                          <CheckCircle size={16} />
                        )}
                        {toggling
                          ? "Saving..."
                          : activeLessonDone
                          ? "Completed ✓ (click to undo)"
                          : "Mark as Complete"
                        }
                      </button>

                      {/* AI Quiz button */}
                      <button
                        onClick={showQuiz ? () => setShowQuiz(false) : handleGenerateQuiz}
                        disabled={quizLoading}
                        className="flex items-center gap-2 px-5 py-3 bg-violet-600 text-white rounded-2xl font-bold text-sm hover:bg-violet-700 active:scale-95 disabled:opacity-60 transition-all shadow-sm shadow-violet-200"
                      >
                        {quizLoading
                          ? <><Loader2 size={16} className="animate-spin" /> Generating...</>
                          : showQuiz
                          ? <><RotateCcw size={16} /> Hide Quiz</>
                          : <><Sparkles size={16} /> Practice Quiz</>
                        }
                      </button>

                      {/* Next lesson button */}
                      {activeLessonIndex < totalLessons - 1 && (
                        <button
                          onClick={() => {
                            const next = course.lessons[activeLessonIndex + 1];
                            setActiveLesson(next);
                            setShowQuiz(false);
                            setQuiz([]);
                            setQuizSubmitted(false);
                            setQuizAnswers({});
                          }}
                          className="flex items-center gap-2 px-5 py-3 bg-gray-100 text-gray-700 rounded-2xl font-bold text-sm hover:bg-gray-200 active:scale-95 transition-all ml-auto"
                        >
                          Next Lesson <ChevronRight size={16} />
                        </button>
                      )}
                    </div>
                  )}

                  {/* Not enrolled notice */}
                  {!isInstructor && !enrollment && (
                    <div className="mt-4 flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                      <Lock size={18} className="text-amber-500 flex-shrink-0" />
                      <p className="text-sm font-semibold text-amber-800">
                        Enroll in this course to track your progress
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* ── AI Quiz Section ── */}
              {showQuiz && (
                <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
                  <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
                    <div className="w-9 h-9 bg-violet-100 rounded-xl flex items-center justify-center">
                      <Sparkles size={16} className="text-violet-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-gray-900">AI Practice Quiz</h3>
                      <p className="text-xs text-gray-400">Based on: {activeLesson.title}</p>
                    </div>
                  </div>

                  <div className="p-6">
                    {/* Loading state */}
                    {quizLoading && (
                      <div className="flex flex-col items-center py-10 gap-3">
                        <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm text-gray-400 font-medium">Generating quiz questions...</p>
                      </div>
                    )}

                    {/* Error state */}
                    {quizError && !quizLoading && (
                      <div className="flex flex-col items-center py-8 gap-4">
                        <p className="text-sm text-red-500 font-semibold text-center">{quizError}</p>
                        <button onClick={handleGenerateQuiz}
                          className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white rounded-xl font-bold text-sm hover:bg-violet-700 transition-all">
                          <RotateCcw size={14} /> Try Again
                        </button>
                      </div>
                    )}

                    {/* Quiz questions */}
                    {quiz.length > 0 && !quizLoading && (
                      <>
                        <div className="space-y-7">
                          {quiz.map((q, qi) => (
                            <div key={qi}>
                              <p className="text-sm font-bold text-gray-900 mb-3 leading-relaxed">
                                <span className="inline-flex w-6 h-6 bg-violet-100 text-violet-600 rounded-full items-center justify-center text-xs font-black mr-2">
                                  {qi + 1}
                                </span>
                                {q.question}
                              </p>
                              <div className="grid gap-2">
                                {q.options.map((opt: string, oi: number) => {
                                  let cls = "border-gray-200 bg-gray-50 text-gray-700 hover:border-violet-300 hover:bg-violet-50/50";
                                  if (quizSubmitted) {
                                    if (oi === q.correctIndex) cls = "border-green-400 bg-green-50 text-green-700";
                                    else if (quizAnswers[qi] === oi) cls = "border-red-400 bg-red-50 text-red-600";
                                    else cls = "border-gray-100 bg-gray-50 text-gray-400";
                                  } else if (quizAnswers[qi] === oi) {
                                    cls = "border-violet-500 bg-violet-50 text-violet-700";
                                  }
                                  return (
                                    <button key={oi} disabled={quizSubmitted}
                                      onClick={() => setQuizAnswers(prev => ({ ...prev, [qi]: oi }))}
                                      className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium border-2 transition-all ${cls} disabled:cursor-default`}>
                                      <span className="font-black opacity-50 mr-2">{String.fromCharCode(65 + oi)}.</span>
                                      {opt}
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
                            className="mt-7 w-full py-4 bg-violet-600 text-white rounded-2xl font-bold text-sm hover:bg-violet-700 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                          >
                            Submit — {Object.keys(quizAnswers).length}/{quiz.length} answered
                          </button>
                        ) : (
                          <div className={`mt-7 p-6 rounded-2xl text-center ${
                            quizScore === quiz.length ? 'bg-green-50 border-2 border-green-200' :
                            quizScore >= quiz.length / 2 ? 'bg-amber-50 border-2 border-amber-200' :
                            'bg-red-50 border-2 border-red-200'
                          }`}>
                            <p className="text-3xl mb-2">
                              {quizScore === quiz.length ? "🎉" : quizScore >= quiz.length / 2 ? "👍" : "📚"}
                            </p>
                            <p className={`text-2xl font-black mb-1 ${
                              quizScore === quiz.length ? 'text-green-700' :
                              quizScore >= quiz.length / 2 ? 'text-amber-700' : 'text-red-600'
                            }`}>
                              {quizScore}/{quiz.length}
                            </p>
                            <p className="text-sm text-gray-500 mb-4">
                              {quizScore === quiz.length ? "Perfect! You nailed it." :
                               quizScore >= quiz.length / 2 ? "Good job! Review the ones you missed." :
                               "Keep studying — you've got this!"}
                            </p>
                            <button
                              onClick={() => { setQuizSubmitted(false); setQuizAnswers({}); }}
                              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-50 transition-all"
                            >
                              <RotateCcw size={13} /> Retry Quiz
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200/60 p-20 text-center">
              <BookOpen size={48} className="text-gray-200 mx-auto mb-4" />
              <p className="text-gray-400 font-semibold">No lessons in this course yet</p>
              {isInstructor && (
                <Link href={`/instructor/courses/${slug}/lessons/create`}
                  className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all">
                  <Plus size={16} /> Add First Lesson
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}