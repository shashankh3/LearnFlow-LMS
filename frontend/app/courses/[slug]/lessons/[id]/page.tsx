"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { ArrowLeft, CheckCircle, Sparkles, Flame, RefreshCw, Trophy } from "lucide-react";

const getEmbedUrl = (url: string) => {
  if (!url) return "";
  const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  return ytMatch && ytMatch[1] ? `https://www.youtube.com/embed/${ytMatch[1]}` : url;
};

export default function LessonPlayerPage() {
  const { slug, id } = useParams();
  const [lesson, setLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);
  
  const [quizLoading, setQuizLoading] = useState(false);
  const [quiz, setQuiz] = useState<any[] | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const fetchLesson = async () => {
      try {
        const res = await api.get(`/courses/${slug}/lessons/${id}/`);
        setLesson(res.data);
      } catch (err) { console.error("Error fetching lesson"); }
      finally { setLoading(false); }
    };
    fetchLesson();
  }, [slug, id]);

  const toggleCompletion = async () => {
    try {
      const res = await api.post(`/lessons/${id}/toggle-progress/`);
      setCompleted(res.data.completed);
    } catch (err) { alert("Enrollment required."); }
  };

  const generateAIQuiz = async () => {
    setQuizLoading(true); setQuiz(null); setShowResults(false); setAnswers({});
    try {
      const res = await api.post(`/lessons/${id}/generate-quiz/`);
      setQuiz(res.data.quiz);
    } catch (err: any) { 
      const errorMsg = err.response?.data?.error || err.message || "Unknown Error";
      alert(`AI ERROR: ${errorMsg}`); 
    }
    finally { setQuizLoading(false); }
  };

  const calculateScore = () => {
    if (!quiz) return 0;
    let score = 0;
    quiz.forEach((q, idx) => { if (answers[idx] === q.correctIndex) score++; });
    return score;
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  const score = calculateScore();

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex flex-col">
      <header className="bg-slate-900 text-white px-8 py-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <Link href={`/courses/${slug}`} className="p-2 hover:bg-slate-800 rounded-full"><ArrowLeft className="h-5 w-5" /></Link>
          <h1 className="font-bold text-lg">{lesson.title}</h1>
        </div>
        <button onClick={toggleCompletion} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${completed ? 'bg-green-500 text-white' : 'bg-slate-800 text-slate-300'}`}>
          <CheckCircle className="h-4 w-4" /> {completed ? "COMPLETED" : "MARK AS COMPLETE"}
        </button>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {lesson.video_url && (
            <div className="aspect-video w-full bg-black rounded-3xl overflow-hidden shadow-2xl">
              <iframe src={getEmbedUrl(lesson.video_url)} className="w-full h-full border-0" allowFullScreen></iframe>
            </div>
          )}
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
            <h2 className="text-2xl font-black text-slate-900 mb-6 italic uppercase tracking-tighter">Lesson Scroll</h2>
            <div className="prose max-w-none text-slate-600 font-medium whitespace-pre-wrap">{lesson.content}</div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="bg-gradient-to-b from-red-600 to-red-800 rounded-[2rem] p-8 text-white shadow-2xl shadow-red-200/50 relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <Flame className="h-8 w-8 text-yellow-400 animate-pulse" />
                <h3 className="text-2xl font-black italic tracking-tighter uppercase">Test Your Might!</h3>
              </div>
              <p className="text-red-100 text-xs font-bold mb-6 tracking-widest uppercase">Generate AI Quiz</p>

              {!quiz && !quizLoading && (
                <button onClick={generateAIQuiz} className="w-full py-4 bg-white text-red-600 rounded-2xl font-black text-xs tracking-[0.2em] hover:bg-yellow-400 hover:text-red-800 transition-all shadow-lg">
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
          </div>

          {quiz && (
            <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              {quiz.map((q, idx) => (
                <div key={idx} className="space-y-3">
                  <p className="font-bold text-slate-900 text-sm">{idx + 1}. {q.question}</p>
                  <div className="grid gap-2">
                    {q.options.map((opt: string, oIdx: number) => {
                      const isSelected = answers[idx] === oIdx;
                      const isCorrect = showResults && oIdx === q.correctIndex;
                      const isWrong = showResults && isSelected && !isCorrect;
                      let style = "bg-slate-50 border-slate-100 text-slate-500";
                      if (isSelected) style = "bg-slate-900 border-slate-900 text-white";
                      if (isCorrect) style = "bg-green-500 border-green-500 text-white font-bold";
                      if (isWrong) style = "bg-red-500 border-red-500 text-white";
                      return (
                        <button key={oIdx} onClick={() => !showResults && setAnswers({...answers, [idx]: oIdx})} className={`w-full text-left p-3 rounded-xl text-xs font-bold border-2 transition-all ${style}`}>
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {!showResults ? (
                <button onClick={() => setShowResults(true)} disabled={Object.keys(answers).length < 7} className="w-full py-4 bg-red-600 text-white rounded-2xl font-black text-xs tracking-widest disabled:opacity-30">
                  FINISH THEM
                </button>
              ) : (
                <div className="text-center p-6 bg-slate-900 rounded-2xl text-white">
                  <Trophy className="h-10 w-10 text-yellow-400 mx-auto mb-2" />
                  <p className="text-4xl font-black italic">{score}/7</p>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] mt-2 text-red-500">
                    {score === 7 ? "FLAWLESS VICTORY!" : score > 4 ? "VICTORY" : "FATALITY"}
                  </p>
                  <button onClick={generateAIQuiz} className="mt-4 text-[10px] font-black text-slate-400 hover:text-white uppercase tracking-widest">
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