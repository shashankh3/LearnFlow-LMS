"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { ArrowLeft, CheckCircle, Flame, RefreshCw, Trophy } from "lucide-react";

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
  const [certUrl, setCertUrl] = useState<string | null>(null);
  
  const [quizLoading, setQuizLoading] = useState(false);
  const [quiz, setQuiz] = useState<any[] | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const fetchLesson = async () => {
      try {
        const res = await api.get(`/lessons/${id}/`);
        setLesson(res.data);
      } catch (err) { 
        console.error("Error fetching lesson", err); 
      } finally { 
        setLoading(false); 
      }
    };
    if (id) fetchLesson();
  }, [id]);

  const markAsComplete = async () => {
    try {
      const res = await api.post(`/courses/${slug}/lessons/${id}/complete/`);
      setCompleted(true);
      
      if (res.data.is_completed && res.data.certificate_url) {
        setCertUrl(res.data.certificate_url);
        alert(`🎉 Course Completed! Certificate generated: ${res.data.certificate_url}`);
      }
    } catch (err: any) { 
      alert(err.response?.data?.detail || "Error marking complete."); 
    }
  };

  const generateAIQuiz = async () => {
    setQuizLoading(true); setQuiz(null); setShowResults(false); setAnswers({});
    try {
      const res = await api.post(`/lessons/${id}/generate-quiz/`);
      // Backend now sends pre-parsed, perfect JSON. No more frontend crashing.
      const parsedQuiz = res.data.quiz;
      setQuiz(Array.isArray(parsedQuiz) ? parsedQuiz : [parsedQuiz]);
    } catch (err: any) { 
      console.error(err);
      alert(`AI ERROR: System busy or returned invalid format. Try again.`); 
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

  if (loading) return <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center font-bold text-slate-500">Loading Lesson Data...</div>;
  if (!lesson) return <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center font-bold text-red-500">Lesson not found.</div>;

  const score = calculateScore();

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex flex-col">
      <header className="bg-slate-900 text-white px-8 py-4 flex items-center justify-between sticky top-0 z-20 shadow-xl">
        <div className="flex items-center gap-4">
          <Link href={`/courses/${slug}`} className="p-2 hover:bg-slate-800 rounded-full transition-colors"><ArrowLeft className="h-5 w-5" /></Link>
          <h1 className="font-bold text-lg">{lesson?.title || "Lesson"}</h1>
        </div>
        
        <div className="flex gap-4">
          {certUrl && (
            <a href={certUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm bg-yellow-500 text-yellow-950 hover:bg-yellow-400 transition-all">
              <Trophy className="h-4 w-4" /> VIEW CERTIFICATE
            </a>
          )}
          <button 
            onClick={markAsComplete} 
            disabled={completed}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${completed ? 'bg-green-500 text-white cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 text-white'}`}
          >
            <CheckCircle className="h-4 w-4" /> {completed ? "COMPLETED" : "MARK AS COMPLETE"}
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {lesson?.video_url && (
            <div className="aspect-video w-full bg-slate-900 rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white">
              <iframe src={getEmbedUrl(lesson.video_url)} className="w-full h-full border-0" allowFullScreen></iframe>
            </div>
          )}
          <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm">
            <h2 className="text-2xl font-black text-slate-900 mb-6 italic uppercase tracking-tighter">Lesson Material</h2>
            <div className="prose max-w-none text-slate-600 font-medium whitespace-pre-wrap">{lesson?.content}</div>
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
                  <p className="font-bold text-slate-900 text-sm">{idx + 1}. {q?.question}</p>
                  <div className="grid gap-2">
                    {q?.options?.map((opt: string, oIdx: number) => {
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
                <button 
                  onClick={() => setShowResults(true)} 
                  disabled={Object.keys(answers).length < quiz.length} 
                  className="w-full py-4 bg-red-600 text-white rounded-2xl font-black text-xs tracking-widest disabled:opacity-30 transition-all"
                >
                  FINISH THEM
                </button>
              ) : (
                <div className="text-center p-6 bg-slate-900 rounded-[2rem] text-white">
                  <Trophy className="h-10 w-10 text-yellow-400 mx-auto mb-2" />
                  <p className="text-4xl font-black italic">{score}/{quiz.length}</p>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] mt-2 text-red-500">
                    {score === quiz.length ? "FLAWLESS VICTORY!" : score > (quiz.length / 2) ? "VICTORY" : "FATALITY"}
                  </p>
                  <button onClick={generateAIQuiz} className="mt-4 text-[10px] font-black text-slate-400 hover:text-white uppercase tracking-widest transition-colors">
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