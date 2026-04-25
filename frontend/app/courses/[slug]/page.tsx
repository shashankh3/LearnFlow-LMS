"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import {
  ArrowLeft, BookOpen, Clock, CheckCircle,
  PlayCircle, Lock, Award, Sparkles, Edit, Trash2,
  Plus, AlertTriangle
} from "lucide-react";

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
            const found = enrollRes.data.find((e: any) => e.course === courseRes.data.id || e.course_details?.slug === slug);
            setEnrollment(found || null);
          } catch {}
        }

        if (courseRes.data.lessons?.length > 0) {
          setActiveLesson(courseRes.data.lessons[0]);
        }
      } catch {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [slug, router]);

  const isCompleted = (lessonId: number) =>
    enrollment?.completed_lessons?.includes(lessonId);

  const handleMarkComplete = async () => {
    if (!activeLesson || !enrollment) return;
    setMarking(true);
    try {
      const res = await api.post(`/courses/${slug}/lessons/${activeLesson.id}/complete/`);
      const updatedEnrollRes = await api.get("/enrollments/");
      const updated = updatedEnrollRes.data.find((e: any) => e.course_details?.slug === slug);
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

  const quizScore = quiz.length > 0
    ? quiz.filter((q, i) => quizAnswers[i] === q.correctIndex).length
    : 0;

  const getYoutubeId = (url: string) => {
    const match = url?.match(/(?:youtu\.be\/|youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match?.[1] || null;
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!course) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="text-gray-500 font-semibold">Course not found</p>
    </div>
  );

  const isInstructor = user?.is_instructor && course.instructor_name === user?.username;
  const progress = enrollment?.progress ?? 0;
  const ytId = activeLesson?.video_url ? getYoutubeId(activeLesson.video_url) : null;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <AlertTriangle size={28} className="text-red-500" />
            </div>
            <h3 className="text-lg font-black text-gray-900 text-center mb-2">Delete Course?</h3>
            <p className="text-sm text-gray-400 text-center mb-8 leading-relaxed">
              This will permanently delete <strong>"{course.title}"</strong> and all its lessons. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCourse}
                disabled={deleting}
                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold text-sm hover:bg-red-600 disabled:opacity-60 transition-all"
              >
                {deleting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero */}
      <div className="bg-indigo-700 text-white px-8 py-10">
        <div className="max-w-6xl mx-auto">
          <Link
            href={isInstructor ? "/instructor/dashboard" : "/student/dashboard"}
            className="inline-flex items-center gap-2 text-indigo-200 hover:text-white text-sm font-semibold mb-6 transition-colors"
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>

          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div className="flex-1 min-w-0">
              <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
                {course.difficulty}
              </span>
              <h1 className="text-3xl font-black mb-3 leading-tight">{course.title}</h1>
              <p className="text-indigo-200 text-sm mb-4 max-w-2xl">{course.description}</p>
              <div className="flex items-center gap-4 text-sm text-indigo-200">
                <span className="flex items-center gap-1.5"><BookOpen size={14} /> {course.instructor_name}</span>
                <span className="flex items-center gap-1.5"><Clock size={14} /> {course.lessons?.length || 0} Lessons</span>
              </div>
            </div>

            {/* ✅ Instructor controls — Edit & Delete only visible here inside course view */}
            {isInstructor && (
              <div className="flex flex-col gap-3 flex-shrink-0">
                <div className="bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/20">
                  <p className="text-xs font-bold text-indigo-200 uppercase tracking-wider mb-3">Instructor Tools</p>
                  <div className="flex flex-col gap-2">
                    <Link
                      href={`/instructor/courses/${slug}/lessons/create`}
                      className="flex items-center gap-2 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl font-bold text-xs transition-all"
                    >
                      <Plus size={14} /> Add Lesson
                    </Link>
                    <Link
                      href={`/courses/${slug}/edit`}
                      className="flex items-center gap-2 px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl font-bold text-xs transition-all"
                    >
                      <Edit size={14} /> Edit Course
                    </Link>
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-red-500/80 hover:bg-red-500 text-white rounded-xl font-bold text-xs transition-all"
                    >
                      <Trash2 size={14} /> Delete Course
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Student progress bar */}
          {!isInstructor && enrollment && (
            <div className="mt-6">
              <div className="flex justify-between text-xs text-indigo-200 mb-2">
                <span>Your Progress</span>
                <span className="font-bold">{progress}%</span>
              </div>
              <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full transition-all duration-1000" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="max-w-6xl mx-auto px-8 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Video Player */}
        <div className="lg:col-span-2 space-y-6">
          {activeLesson && (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              {ytId ? (
                <div className="aspect-video">
                  <iframe
                    src={`https://www.youtube.com/embed/${ytId}?rel=0`}
                    className="w-full h-full"
                    allowFullScreen
                    title={activeLesson.title}
                  />
                </div>
              ) : (
                <div className="aspect-video bg-gray-100 flex items-center justify-center">
                  <PlayCircle size={48} className="text-gray-300" />
                </div>
              )}
              <div className="p-6">
                <h2 className="text-lg font-black text-gray-900 mb-2">{activeLesson.title}</h2>
                {activeLesson.content && (
                  <p className="text-sm text-gray-500 leading-relaxed mb-5">{activeLesson.content}</p>
                )}

                {/* Student actions */}
                {!isInstructor && enrollment && (
                  <div className="flex flex-wrap gap-3">
                    {!isCompleted(activeLesson.id) ? (
                      <button
                        onClick={handleMarkComplete}
                        disabled={marking}
                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 disabled:opacity-60 transition-all"
                      >
                        <CheckCircle size={16} />
                        {marking ? "Saving..." : "Mark as Complete"}
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 px-5 py-2.5 bg-green-50 text-green-600 rounded-xl font-bold text-sm border border-green-200">
                        <CheckCircle size={16} /> Completed ✓
                      </div>
                    )}
                    <button
                      onClick={handleGenerateQuiz}
                      disabled={quizLoading}
                      className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white rounded-xl font-bold text-sm hover:bg-violet-700 disabled:opacity-60 transition-all"
                    >
                      <Sparkles size={16} />
                      {quizLoading ? "Generating..." : "AI Quiz"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* AI Quiz */}
          {quiz.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h3 className="text-base font-black text-gray-900 mb-5 flex items-center gap-2">
                <Sparkles size={18} className="text-violet-500" /> AI Practice Quiz
              </h3>
              <div className="space-y-6">
                {quiz.map((q, qi) => (
                  <div key={qi}>
                    <p className="text-sm font-bold text-gray-900 mb-3">{qi + 1}. {q.question}</p>
                    <div className="space-y-2">
                      {q.options.map((opt: string, oi: number) => {
                        let cls = "border border-gray-200 text-gray-700";
                        if (quizSubmitted) {
                          if (oi === q.correctIndex) cls = "border-green-400 bg-green-50 text-green-700";
                          else if (quizAnswers[qi] === oi) cls = "border-red-400 bg-red-50 text-red-700";
                        } else if (quizAnswers[qi] === oi) {
                          cls = "border-indigo-400 bg-indigo-50 text-indigo-700";
                        }
                        return (
                          <button key={oi} disabled={quizSubmitted}
                            onClick={() => setQuizAnswers(prev => ({ ...prev, [qi]: oi }))}
                            className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${cls} hover:border-indigo-300`}>
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
                  className="mt-6 w-full py-3 bg-violet-600 text-white rounded-xl font-bold text-sm hover:bg-violet-700 disabled:opacity-40 transition-all"
                >
                  Submit Quiz
                </button>
              ) : (
                <div className={`mt-6 p-4 rounded-xl text-center font-bold text-sm ${
                  quizScore === quiz.length ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
                }`}>
                  {quizScore === quiz.length ? "🎉 Perfect Score!" : `Score: ${quizScore}/${quiz.length}`}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Lesson Sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">Course Curriculum</h3>
              <p className="text-xs text-gray-400 mt-0.5">{course.lessons?.length || 0} lessons</p>
            </div>
            <div className="divide-y divide-gray-50">
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
                      isActive ? 'bg-indigo-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${
                      done ? 'bg-green-500 text-white' : isActive ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {done ? <CheckCircle size={14} /> : idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold truncate ${isActive ? 'text-indigo-700' : 'text-gray-700'}`}>
                        {lesson.title}
                      </p>
                    </div>
                    {!isInstructor && !enrollment && <Lock size={12} className="text-gray-300 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Certificate */}
          {!isInstructor && enrollment?.is_completed && (
            <Link href={`/courses/${slug}/certificate`}
              className="flex items-center gap-3 p-4 bg-gradient-to-r from-amber-400 to-orange-400 rounded-2xl text-white hover:shadow-lg transition-all">
              <Award size={24} />
              <div>
                <p className="font-black text-sm">Claim Certificate</p>
                <p className="text-xs text-amber-100">Course completed 🎉</p>
              </div>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}