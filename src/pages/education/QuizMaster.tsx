import { useState, useRef, useEffect } from 'react';
import { FileText, Image as ImageIcon, UploadCloud, Loader2, Target, CheckCircle2, XCircle, ArrowRight, ArrowLeft, Lightbulb, Beaker } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // Index of the correct option
  explanation: string;
}

export default function QuizMaster() {
  const [view, setView] = useState<'upload' | 'generating' | 'taking' | 'results'>('upload');
  
  // Input State
  const [topicInput, setTopicInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Quiz State
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<number, number>>({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [memoryContext, setMemoryContext] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const { user } = useAuth();

  useEffect(() => {
    let isMounted = true;
    if (!user?.uid) return;
    const fetchMemory = async () => {
      try {
        const memRef = doc(db, 'users', user.uid, 'memories', 'education');
        const snap = await getDoc(memRef);
        if (snap.exists() && isMounted) {
          setMemoryContext(snap.data().data);
        }
      } catch (e) {
        console.error("Failed to fetch memory", e);
      }
    };
    fetchMemory();
    return () => { isMounted = false; };
  }, [user?.uid]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const fileToGenerativePart = async (file: File) => {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.readAsDataURL(file);
    });
    return {
      inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
  };

  const parseQuestionsFromResponse = (text: string) => {
    try {
      const cleanedText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
      const rawQuestions = JSON.parse(cleanedText);
      return rawQuestions.map((q: any, index: number) => ({
        id: `q-${Date.now()}-${index}`,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer, // ensuring 0-indexed integer
        explanation: q.explanation
      }));
    } catch (e) {
      console.error("Parse Error:", e);
      throw new Error("Failed to parse Gemini's response. The format was unexpected.");
    }
  };

  const generateQuiz = async () => {
    if (!topicInput.trim() && !selectedFile) return;
    
    setView('generating');
    setError(null);
    setSelectedOptions({});
    setShowExplanation(false);
    setCurrentQuestionIndex(0);

    try {
      const studentProfile = memoryContext 
        ? `Student Profile: Board: ${memoryContext.board}, Standard: ${memoryContext.standard}, Goals: ${memoryContext.goal}, Weak Areas: ${memoryContext.weakAreas?.join(', ')}` 
        : 'Student Context: General High School/College';

      const promptText = `Generate exactly 5 multiple-choice questions based on the provided material or topic. 
      ${studentProfile}
      
      If a file is attached: 
      1. Recognize the exact source/board/exam it comes from (e.g., JEE Advanced 2023, CBSE Class 12, etc.).
      2. Provide approximately 10% repeated or near-identical questions directly from the provided PYQ material.
      3. For the remaining 90%, synthesize highly trained, brand new questions that mimic the exact pattern, difficulty, and flavor of the recognized source. Use external knowledge about that specific exam to generate authentic questions.
      
      If it's just a text topic:
      Synthesize questions relevant to the topic, heavily targeted towards the Student Profile and their Weak Areas.

      Output strictly as a JSON array of objects. Each object must structurally be:
      {
        "question": "The question text here (use formatting if necessary)",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": 0,  // The array index of the correct option (0-3)
        "explanation": "A concise explanation of why this is correct."
      }
      Do not include markdown wrappers (like \`\`\`json) or any conversational text. Return raw JSON only.`;

      let response;

      if (selectedFile) {
        const filePart = await fileToGenerativePart(selectedFile);
        response = await ai.models.generateContent({
          model: 'gemini-3.1-pro-preview',
          contents: [{ role: 'user', parts: [filePart, { text: promptText + (topicInput ? `\n\nAdditional Context: ${topicInput}` : '') }] }]
        });
      } else {
        response = await ai.models.generateContent({
          model: 'gemini-3.1-pro-preview',
          contents: [{ role: 'user', parts: [{ text: promptText + `\n\nTopic: ${topicInput}` }] }]
        });
      }

      const generatedQs = parseQuestionsFromResponse(response.text || "[]");
      
      if (generatedQs.length === 0) throw new Error("No questions could be generated.");
      
      setQuestions(generatedQs);
      setView('taking');
    } catch (err) {
      console.error(err);
      setError("Failed to generate quiz. Please ensure the file is readable or try a simpler topic.");
      setView('upload');
    }
  };

  const handleOptionSelect = (optionIndex: number) => {
    if (showExplanation) return; // Prevent changing answer after it's checked
    setSelectedOptions(prev => ({ ...prev, [currentQuestionIndex]: optionIndex }));
    setShowExplanation(true);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setShowExplanation(false);
    } else {
      setView('results');
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  
  // Calculate Results
  const score = questions.reduce((acc, q, idx) => {
    return selectedOptions[idx] === q.correctAnswer ? acc + 1 : acc;
  }, 0);

  return (
    <div className="w-full h-full flex flex-col items-center">
      
      {/* ---------------- UPLOAD / CONFIG VIEW ---------------- */}
      {view === 'upload' && (
        <div className="w-full max-w-4xl animate-in fade-in duration-500 space-y-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Quiz Master Engine</h1>
            <p className="text-slate-500 dark:text-slate-400">Generate targeted MCQs from Previous Year Papers or typed topics.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Left Col: Topic */}
            <div className="space-y-4">
              <div className="bg-white dark:bg-[#161B22] p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm transition-colors duration-200">
                 <div className="flex items-center mb-6">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center mr-4">
                      <Target className="w-5 h-5" />
                    </div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Q Practice</h2>
                 </div>
                 
                 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Subject or Chapter</label>
                 <textarea
                   value={topicInput}
                   onChange={e => setTopicInput(e.target.value)}
                   className="w-full min-h-[120px] px-4 py-3 bg-slate-50 dark:bg-[#0D1117] border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all resize-none shadow-inner dark:text-white"
                   placeholder="e.g. Test me on advanced calculus integrals and derivatives..."
                 />
              </div>

              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 rounded-xl flex items-center text-sm shadow-sm">
                  <XCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                  {error}
                </div>
              )}
            </div>

            {/* Right Col: PYQ File Upload */}
            <div className="bg-white dark:bg-[#161B22] p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm transition-colors duration-200 flex flex-col">
                 <div className="flex items-center mb-6">
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center mr-4">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Context (PYQ)</h2>
                      <p className="text-xs text-slate-500">ML recognizes patterns to generate 10% repeats, 90% new variants.</p>
                    </div>
                 </div>

                 <input 
                   type="file" 
                   accept="application/pdf,image/*" 
                   className="hidden" 
                   ref={fileInputRef}
                   onChange={handleFileSelect}
                 />

                 <div 
                   onClick={() => fileInputRef.current?.click()}
                   className={`flex-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-8 text-center cursor-pointer transition-all duration-200 min-h-[160px] ${
                     selectedFile 
                     ? 'border-emerald-500/50 bg-emerald-50 dark:bg-emerald-500/5' 
                     : 'border-slate-200 dark:border-white/10 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/5 bg-slate-50 dark:bg-[#0D1117]'
                   }`}
                 >
                   {selectedFile ? (
                     <>
                       <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4">
                         <CheckCircle2 className="w-8 h-8" />
                       </div>
                       <p className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-1">{selectedFile.name}</p>
                       <p className="text-xs text-slate-500 mt-1">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Ready to process</p>
                     </>
                   ) : (
                     <>
                       <div className="w-16 h-16 bg-white dark:bg-[#161B22] border border-slate-100 dark:border-white/5 rounded-full shadow-sm flex items-center justify-center text-slate-400 mb-4">
                         <UploadCloud className="w-8 h-8" />
                       </div>
                       <p className="text-sm font-medium text-slate-900 dark:text-white">Click or drag a PDF/Image</p>
                       <p className="text-xs text-slate-500 mt-1">Karma Vision handles complex pages automatically.</p>
                     </>
                   )}
                 </div>
            </div>
            
          </div>

          <button 
             onClick={generateQuiz}
             disabled={!topicInput.trim() && !selectedFile}
             className="w-full py-4 bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl font-bold shadow-lg transition-all active:scale-95 flex items-center justify-center"
           >
             Generate & Start Exam <ArrowRight className="w-5 h-5 ml-2" />
           </button>
        </div>
      )}

      {/* ---------------- GENERATING VIEW ---------------- */}
      {view === 'generating' && (
        <div className="flex flex-col items-center justify-center h-64 animate-pulse">
           <div className="w-20 h-20 bg-blue-100 dark:bg-blue-500/20 rounded-full flex items-center justify-center mb-6">
             <Beaker className="w-10 h-10 text-blue-600 dark:text-blue-400 animate-bounce" />
           </div>
           <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Extracting Knowledge...</h2>
           <p className="text-slate-500 dark:text-slate-400">Parsing complex layouts and synthesizing logical distractors.</p>
        </div>
      )}

      {/* ---------------- TAKING QUIZ VIEW ---------------- */}
      {view === 'taking' && currentQuestion && (
        <div className="w-full max-w-3xl animate-in fade-in slide-in-from-right-8 duration-500 mt-4">
           {/* Progress Bar */}
           <div className="mb-8">
             <div className="flex justify-between text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
               <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
               <span>{Math.round(((currentQuestionIndex) / questions.length) * 100)}% Complete</span>
             </div>
             <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
               <div 
                 className="h-full bg-blue-500 rounded-full transition-all duration-300" 
                 style={{ width: `${((currentQuestionIndex) / questions.length) * 100}%` }}
               />
             </div>
           </div>

           {/* Question Card */}
           <div className="bg-white dark:bg-[#161B22] border border-slate-200 dark:border-white/10 p-6 sm:p-10 rounded-3xl shadow-sm mb-6 transition-colors duration-200">
             <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white leading-relaxed mb-8">
               {currentQuestion.question}
             </h2>

             <div className="space-y-3">
               {currentQuestion.options.map((option, idx) => {
                 let optionStyle = "border-slate-200 dark:border-white/10 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 text-slate-700 dark:text-slate-200";
                 
                 // If an answer was locked in
                 if (showExplanation) {
                   if (idx === currentQuestion.correctAnswer) {
                     optionStyle = "bg-emerald-50 dark:bg-emerald-500/20 border-emerald-400 dark:border-emerald-500/50 text-emerald-900 dark:text-emerald-100 shadow-sm";
                   } else if (idx === selectedOptions[currentQuestionIndex]) {
                     optionStyle = "bg-red-50 dark:bg-red-500/20 border-red-400 dark:border-red-500/50 text-red-900 dark:text-red-100";
                   } else {
                     optionStyle = "border-slate-200 dark:border-white/10 opacity-50";
                   }
                 }

                 return (
                   <button 
                     key={idx}
                     onClick={() => handleOptionSelect(idx)}
                     disabled={showExplanation}
                     className={`w-full text-left p-4 rounded-xl border-2 transition-all font-medium ${optionStyle}`}
                   >
                     <span className="inline-block w-8 text-slate-400">{String.fromCharCode(65 + idx)}.</span>
                     {option}
                   </button>
                 );
               })}
             </div>

             {/* Explanation Reveal */}
             {showExplanation && (
               <div className="mt-8 p-5 bg-blue-50 dark:bg-blue-500/10 border-l-4 border-blue-500 rounded-r-xl rounded-bl-xl animate-in fade-in slide-in-from-top-2">
                 <div className="flex items-start">
                   <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
                   <div>
                     <span className="font-bold text-slate-900 dark:text-white block mb-1">AI Explanation</span>
                     <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{currentQuestion.explanation}</p>
                   </div>
                 </div>
               </div>
             )}
           </div>

           <div className="flex justify-end">
             <button 
               onClick={nextQuestion}
               disabled={!showExplanation} // Force answering before continuing
               className="px-8 py-3.5 bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white rounded-xl font-bold shadow-md transition-all active:scale-95 flex items-center"
             >
               {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'View Results'} <ArrowRight className="w-4 h-4 ml-2" />
             </button>
           </div>
        </div>
      )}

      {/* ---------------- RESULTS VIEW ---------------- */}
      {view === 'results' && (
        <div className="w-full max-w-2xl bg-white dark:bg-[#161B22] border border-slate-200 dark:border-white/10 rounded-3xl p-10 shadow-sm animate-in zoom-in-95 duration-500 mt-8 text-center">
           <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inset relative">
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle cx="48" cy="48" r="44" fill="none" stroke="currentColor" strokeWidth="6" className="text-slate-100 dark:text-slate-800" />
                <circle 
                  cx="48" cy="48" r="44" fill="none" stroke="currentColor" strokeWidth="6" 
                  className={score >= questions.length * 0.7 ? "text-emerald-500" : "text-amber-500"} 
                  strokeDasharray={`${(score / questions.length) * 276} 276`} 
                  strokeLinecap="round" 
                />
              </svg>
              <span className="text-3xl font-bold text-slate-900 dark:text-white">
                {Math.round((score / questions.length) * 100)}%
              </span>
           </div>
           
           <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
             {score >= questions.length * 0.7 ? 'Excellent Work!' : 'Keep Practicing!'}
           </h2>
           <p className="text-slate-500 dark:text-slate-400 mb-8">You answered {score} out of {questions.length} questions correctly.</p>

           <div className="flex gap-4 justify-center">
             <button 
               onClick={() => setView('upload')}
               className="px-6 py-3 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 rounded-xl font-semibold transition-all"
               >
               Try Another Topic
             </button>
             <button 
               onClick={() => {
                 setSelectedOptions({});
                 setView('taking');
                 setCurrentQuestionIndex(0);
                 setShowExplanation(false);
               }}
               className="px-6 py-3 bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white rounded-xl font-semibold transition-all shadow-md"
             >
               Retake Quiz
             </button>
           </div>
        </div>
      )}

    </div>
  );
}
