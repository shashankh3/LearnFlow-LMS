"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { ArrowLeft, CheckCircle, Flame, RefreshCw, Trophy, BookOpen, Lock } from "lucide-react";

const getEmbedUrl = (url: string) => {
  if (!url) return "";
  const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  return ytMatch && ytMatch[1] ? `https://www.youtube.com/embed/${ytMatch[1]}` : url;
};

export default function LessonPlayerPage() {
  const { slug, id } = useParams();
  const [lesson, setLesson] = useState<any>(null);
  const [allLessons, setAllLessons] = useState<any[]>([]);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [completed, setCompleted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [certUrl, setCertUrl] = useState<string | null>(null);

  const [quizLoading, setQuizLoading] = useState(false);
  const [quizError, setQuizError] = useState<string | null>(null);
  const [quiz, setQuiz] = useState<any[] | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        // Fetch lesson data, all lessons for sidebar, and enrollment status in parallel
        const [lessonRes, enrollRes] = await Promise.all([
          api.get(`/lessons/${id}/`),
          api.get(`/enrollments/`)
        ]);

        const lessonData = lessonRes.data;
        setLesson(lessonData);

        // Get enrollment for this course
        const enrollments = enrollRes.data;
        const currentEnrollment = enrollments.find(
          (e: any) => e.course_details?.slug === slug
        );

        if (currentEnrollment) {
          setEnrollment(currentEnrollment);
          setProgress(currentEnrollment.progress ?? 0);

          // ✅ Sync completed state from backend — persists across refreshes
          const completedIds = currentEnrollment.completed_lessons || [];
          setCompleted(completedIds.includes(Number(id)));

          // Fetch all lessons for sidebar
          const courseRes = await api.get(`/courses/${slug}/`);
          setAllLessons(courseRes.data.lessons || []);
        }
      } catch (err) {
        console.error("Error fetching lesson data", err);
      } finally {
        setLoading(false);
      }
    };
    if (id && slug) fetchAll();
  }, [id, slug]);

  const markAsComplete = async () => {
    try {
      const res = await api.post(`/courses/${slug}/lessons/${id}/complete/`);
      setCompleted(true);
      setProgress(res.data.progress ?? progress);

      if (res.data.is_completed && res.data.certificate_url) {
        setCertUrl(res.data.certificate_url);
      }
    } catch (err: any) {
      alert(err.response?.data?.error || err.response?.data?.detail || "Error marking complete.");
    }
  };

  const generateAIQuiz = async () => {
    setQuizLoading(true);
    setQuiz(null);
    setQuizError(null);
    setShowResults(false);
    setAnswers({});
    try {
      const res = await api.post(`/lessons/${id}/generate-quiz/`);
      const parsedQuiz = res.data;
      if (!Array.isArray(parsedQuiz) || parsedQuiz.length === 0) {
        setQuizError("Quiz data was empty. Try again.");
        return;
      }
      setQuiz(parsedQuiz);
    } catch (err: any) {
      setQuizError(err.response?.data?.error || "System busy. Try again in a few seconds.");
    } finally {
      setQuizLoading(false);
    }
  };

  const calculateScore = () => {
    if (!quiz) return 0;
    let score = 0;
    quiz.forEach((q, idx) => { if (answers[idx] === q.correctIndex) score++; });
    return score;
  };

  if (loading) return (
    <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center font-bold text-slate-500">
      Loading Lesson...
    </div>
  );

  if (!lesson) return (
    <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center font-bold text-red-500">
      Lesson not found.
    </div>
  );

  const score = calculateScore();
  const completedIds: number[] = enrollment?.completed_lessons || [];

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex flex-col">
      {/* Header */}
      <header className="bg-slate-900 text-white px-8 py-4 flex items-center justify-between sticky top-0 z-20 shadow-xl">
        <div className="flex items-center gap-4">
          <Link href={`/courses/${slug}`} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="font-bold text-lg leading-tight">{lesson?.title || "Lesson"}</h1>
            {/* ✅ Live progress bar in header */}
            <div className="flex items-center gap-2 mt-1">
              <div className="w-32 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-400 transition-all duration-700"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-400 font-bold">{progress}% COMPLETE</span>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          {certUrl && (
            <a href={certUrl} target="_blank" rel="noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm bg-yellow-500 text-yellow-950 hover:bg-yellow-400 transition-all">
              <Trophy className="h-4 w-4" /> VIEW CERTIFICATE
            </a>
          )}
          {/* ✅ Button reflects actual backend state */}
          <button
            onClick={markAsComplete}
            disabled={completed}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg font-bold text-sm transition-all ${
              completed
                ? 'bg-green-500 text-white cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
            }`}
          >
            <CheckCircle className="h-4 w-4" />
            {completed ? "✓ COMPLETED" : "MARK AS COMPLETE"}
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Video + Content */}
        <div className="lg:col-span-2 space-y-8">
          {lesson?.video_url && (
            <div className="aspect-video w-full bg-slate-900 rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white">
              <iframe src={getEmbedUrl(lesson.video_url)} className="w-full h-full border-0" allowFullScreen />
            </div>
          )}
          <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm">
            <h2 className="text-2xl font-black text-slate-900 mb-6 italic uppercase tracking-tighter">Lesson Material</h2>
            <div className="prose max-w-none text-slate-600 font-medium whitespace-pre-wrap">{lesson?.content}</div>
          </div>
        </div>

        {/* Right: Sidebar */}
        <aside className="space-y-6">

          {/* Lesson List Sidebar */}
          {allLessons.length > 0 && (
            <div className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                <BookOpen size={16} className="text-indigo-600" /> Course Lessons
              </h3>
              <div className="space-y-2">
                {allLessons.map((l: any, idx: number) => {
                  const isDone = completedIds.includes(l.id);
                  const isCurrent = l.id === Number(id);
                  return (
                    <Link
                      key={l.id}
                      href={`/courses/${slug}/lessons/${l.id}`}
                      className={`flex items-center gap-3 p-3 rounded-xl text-xs font-bold transition-all ${
                        isCurrent
                          ? 'bg-indigo-600 text-white'
                          : isDone
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 ${
                        isCurrent ? 'bg-white text-indigo-600' : isDone ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-500'
                      }`}>
                        {isDone && !isCurrent ? '✓' : idx + 1}
                      </span>
                      <span className="line-clamp-1">{l.title}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* AI Quiz Card */}
          <div className="bg-gradient-to-b from-red-600 to-red-800 rounded-[2rem] p-8 text-white shadow-2xl shadow-red-200/50">
            <div className="flex items-center gap-3 mb-4">
              <Flame className="h-8 w-8 text-yellow-400 animate-pulse" />
              <h3 className="text-2xl font-black italic tracking-tighter uppercase">Test Your Might!</h3>
            </div>
            <p className="text-red-100 text-xs font-bold mb-6 tracking-widest uppercase">Generate AI Quiz</p>

            {quizError && (
              <div className="mb-4 p-3 bg-red-900/50 border border-red-400 rounded-xl text-xs text-red-200 font-bold">
                ⚠️ {quizError}
              </div>
            )}

            {!quiz && !quizLoading && (
              <button onClick={generateAIQuiz}
                className="w-full py-4 bg-white text-red-600 rounded-2xl font-black text-xs tracking-[0.2em] hover:bg-yellow-400 hover:text-red-800 transition-all shadow-lg">
                CHALLENGE AI
              </button>
            )}

            {quizLoading && (
              <div className="text-center py-4">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-white" />
                <p className="text-[10px] font-black uppercase tracking-widest">Forging the Gauntlet...</p>
              </div>
            )}
          </div>

          {/* Quiz Questions */}
          {quiz && (
            <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm space-y-8">
              {quiz.map((q, idx) => (
                <div key={idx} className="space-y-3">
                  <p className="font-bold text-slate-900 text-sm">{idx + 1}. {q?.question}</p>
                  <div className="grid gap-2">
                    {q?.options?.map((opt: string, oIdx: number) => {
                      const isSelected = answers[idx] === oIdx;
                      const isCorrect = showResults && oIdx === q.correctIndex;
                      const isWrong = showResults && isSelected && !isCorrect;

                      let style = "bg-slate-50 border-slate-100 text-slate-500";
                      if (isSelected && !showResults) style = "bg-slate-900 border-slate-900 text-white";
                      if (isCorrect) style = "bg-green-500 border-green-500 text-white font-bold";
                      if (isWrong) style = "bg-red-500 border-red-500 text-white";

                      return (
                        <button key={oIdx}
                          onClick={() => !showResults && setAnswers({ ...answers, [idx]: oIdx })}
                          className={`w-full text-left p-3 rounded-xl text-xs font-bold border-2 transition-all ${style}`}>
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {!showResults ? (
                <button onClick={() => setShowResults(true)}
                  disabled={Object.keys(answers).length < quiz.length}
                  className="w-full py-4 bg-red-600 text-white rounded-2xl font-black text-xs tracking-widest disabled:opacity-30 transition-all">
                  FINISH THEM
                </button>
              ) : (
                <div className="text-center p-6 bg-slate-900 rounded-[2rem] text-white">
                  <Trophy className="h-10 w-10 text-yellow-400 mx-auto mb-2" />
                  <p className="text-4xl font-black italic">{score}/{quiz.length}</p>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] mt-2 text-red-500">
                    {score === quiz.length ? "FLAWLESS VICTORY!" : score > quiz.length / 2 ? "VICTORY" : "FATALITY"}
                  </p>
                  <button onClick={generateAIQuiz}
                    className="mt-4 text-[10px] font-black text-slate-400 hover:text-white uppercase tracking-widest transition-colors">
                    Try New Gauntlet
                  </button>
                </div>
              )}
            </div>
          )}
        </aside>
      </main>
    </div>
  );
}