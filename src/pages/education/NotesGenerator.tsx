import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { UploadCloud, Bookmark, Lightbulb, FunctionSquare, FileText, Image as ImageIcon, Loader2, PenTool, Target } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { db } from '../../lib/firebase';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import ResizableWorkspace from '../../components/ResizableWorkspace';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

export default function NotesGenerator() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'pdf' | 'text'>('text');
  const [inputText, setInputText] = useState('');
  const [inputFile, setInputFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedNotes, setGeneratedNotes] = useState<any>(null);
  const [memoryContext, setMemoryContext] = useState<any>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  useEffect(() => {
    let isMounted = true;
    const loadMemory = async () => {
      if (!user?.uid) return;
      try {
        const docRef = doc(db, 'users', user.uid, 'memories', 'education');
        const snap = await getDoc(docRef);
        if (snap.exists() && isMounted) {
          setMemoryContext(snap.data().data);
        }
      } catch (e) {
        console.error("Failed to load memory context", e);
      }
    };
    loadMemory();
    return () => { isMounted = false; };
  }, [user?.uid]);

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

  const handleGenerate = async () => {
    if (activeTab === 'text' && !inputText.trim()) return;
    if (activeTab === 'pdf' && !inputFile) return;

    setIsGenerating(true);
    setGeneratedNotes(null);

    try {
      const systemPrompt = `You are an expert educational content designer.
Transform the following content into highly readable study notes tuned specifically for this student.

STUDENT RELEVANCE: Standard: ${memoryContext?.standard || 'Generic'} | Board: ${memoryContext?.board || 'Generic'} | Goal: ${memoryContext?.goal || 'General Knowledge'}

Generate notes in this EXACT JSON structure. Ensure you escape quotes properly so it is valid JSON. ONLY output JSON, nothing else. No markdown blocks wrapping the JSON.
{
  "subject": "detected subject name",
  "topic": "main topic title",
  "summary": "2-3 sentence overview using simple analogies.",
  "illustration_svg": "Generate a beautiful, clean, modern inline SVG code (viewBox='0 0 400 300') that visually illustrates the main concept. Use Tailwind-like colors (e.g. hex #3b82f6 for blue, #10b981 for green). Do not include any HTML wrapping, just the raw <svg> tag.",
  "key_concepts": [
    {
      "title": "concept name",
      "explanation": "clear explanation using markdown. Include LaTeX math equations using $...$ or $$...$$ if applicable."
    }
  ],
  "formulas": [
    {
      "formula": "The LaTeX formula, e.g. $$E=mc^2$$",
      "description": "what it calculates or means"
    }
  ],
  "practice_questions": [
    {
      "type": "PYQ (Previous Year Question) or Targeted Practice",
      "question": "A high-quality question aligned with their goal. Use LaTeX for math.",
      "hint": "A small nudge on how to solve it."
    }
  ]
}`;

      let response;

      if (activeTab === 'pdf' && inputFile) {
        const filePart = await fileToGenerativePart(inputFile);
        response = await ai.models.generateContent({
           model: 'gemini-3.1-pro-preview',
           config: { systemInstruction: systemPrompt },
           contents: [{ role: 'user', parts: [filePart, { text: 'Extract and structure ALL educational content from this document. Preserve formulas using LaTeX and key points.' }] }]
        });
      } else {
        response = await ai.models.generateContent({
           model: 'gemini-3.1-pro-preview',
           config: { systemInstruction: systemPrompt },
           contents: [{ role: 'user', parts: [{ text: `Here is the raw text content:\n\n${inputText}` }] }]
        });
      }

      const text = response.text || '';
      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const jsonData = JSON.parse(cleanJson);
      
      setGeneratedNotes(jsonData);

      if (user?.uid) {
         await addDoc(collection(db, 'users', user.uid, 'generated_notes'), {
            title: jsonData.topic,
            subject: jsonData.subject,
            content: jsonData,
            createdAt: serverTimestamp(),
            type: 'notes'
         });
      }

    } catch (error) {
      console.error("Notes Generation Error", error);
      alert("Failed to generate notes. Please ensure the content is clear or try simplifying the text.");
    } finally {
      setIsGenerating(false);
    }
  };

  const leftPanelContent = (
    <div className="w-full h-full flex flex-col p-6">
      <div className="mb-6 shrink-0">
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">Generate Smart Notes</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Upload your study material and Karma AI will extract visual concepts and generate PyQs.</p>
      </div>

      <div className="flex p-1 shrink-0 bg-slate-100 dark:bg-[#0D1117] rounded-lg mb-6 transition-colors duration-200">
        <button 
          onClick={() => setActiveTab('text')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-sm font-medium rounded-md transition-all ${activeTab === 'text' ? 'bg-white dark:bg-[#161B22] text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
        >
          <FileText className="w-4 h-4" /> Text
        </button>
        <button 
          onClick={() => setActiveTab('pdf')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-sm font-medium rounded-md transition-all ${activeTab === 'pdf' ? 'bg-white dark:bg-[#161B22] text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
        >
          <ImageIcon className="w-4 h-4" /> PDF/Image
        </button>
      </div>

      <div className="flex-1 min-h-0 flex flex-col mb-4">
        {activeTab === 'pdf' && (
          <div 
             onClick={() => fileInputRef.current?.click()}
             className="h-full border-2 border-dashed border-blue-200 dark:border-blue-500/30 bg-blue-50/50 dark:bg-blue-500/5 rounded-xl flex flex-col items-center justify-center p-8 text-center transition-colors hover:bg-blue-50 dark:hover:bg-blue-500/10 cursor-pointer relative group overflow-hidden"
          >
             <input type="file" ref={fileInputRef} onChange={(e) => setInputFile(e.target.files?.[0] || null)} className="hidden" accept="image/*,application/pdf" />
             <div className="absolute inset-0 bg-gradient-to-b from-transparent to-blue-500/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
             <UploadCloud className="text-blue-500 w-10 h-10 mb-4 z-10" />
             <p className="text-sm font-medium text-slate-900 dark:text-slate-200 mb-1 z-10">
               {inputFile ? inputFile.name : "Select a PDF or Image"}
             </p>
             <p className="text-xs text-slate-500 dark:text-slate-400 z-10">Optimized by Gemini Multimodal Engine</p>
          </div>
        )}

        {activeTab === 'text' && (
          <textarea 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="w-full h-full p-4 bg-slate-50 dark:bg-[#0D1117] border border-slate-200 dark:border-white/10 rounded-xl resize-none outline-none focus:ring-2 focus:ring-blue-500/50 text-sm dark:text-slate-200 transition-colors custom-scrollbar"
            placeholder="Paste your textbook paragraph or lecture transcript here..."
          />
        )}
      </div>

      <div className="shrink-0 pt-2">
        <button 
          onClick={handleGenerate}
          disabled={isGenerating || (activeTab === 'text' && !inputText) || (activeTab === 'pdf' && !inputFile)}
          className="w-full bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 rounded-lg py-3 px-4 font-semibold text-sm shadow-md transition-all active:scale-[0.98] flex items-center justify-center"
        >
          {isGenerating ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <FunctionSquare className="w-4 h-4 mr-2" />}
          {isGenerating ? 'Synthesizing...' : 'Generate Exam/Study Notes'}
        </button>
      </div>
    </div>
  );

  const rightPanelContent = (
    <div className="w-full h-full relative p-6 md:p-8 flex flex-col">
          {isGenerating && (
             <div className="absolute inset-0 bg-white/50 dark:bg-[#0D1117]/50 backdrop-blur-sm z-50 flex flex-col items-center justify-center rounded-xl">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                <p className="text-slate-800 dark:text-slate-200 font-bold tracking-wide">Compiling Mathematical Models & SVGs...</p>
             </div>
          )}

        {generatedNotes ? (
           <div className="max-w-3xl mx-auto w-full relative transition-colors duration-200">
             
             <div className="absolute top-0 right-0 z-10 hidden md:flex gap-3">
               <button className="bg-blue-50 dark:bg-blue-900/20 px-4 py-2 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50 rounded-lg text-sm font-medium transition-colors flex items-center shadow-sm cursor-default">
                 <Bookmark className="w-4 h-4 mr-2" />
                 Saved to Library
               </button>
             </div>

             <div className="mb-8 mt-4 pt-10 md:pt-0">
               <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400 tracking-wide mb-4 border border-teal-100 dark:border-teal-500/20">
                 {generatedNotes.subject?.toUpperCase() || 'TOPIC'}
               </span>
               <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">{generatedNotes.topic}</h1>
               <div className="h-1 w-16 bg-blue-600 rounded-full mb-6"></div>
               
               {/* Summary section */}
               <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed bg-blue-50/50 dark:bg-blue-900/10 p-5 rounded-2xl border border-blue-100 dark:border-blue-800/30">
                 {generatedNotes.summary}
               </p>
             </div>
             
             <div className="pb-12">
               
               {/* Auto-generated SVG illustration */}
               {generatedNotes.illustration_svg && (
                 <div className="w-full bg-slate-50 dark:bg-[#161B22] rounded-3xl p-6 mb-10 border border-slate-200 dark:border-white/10 shadow-sm flex flex-col items-center justify-center">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                       <PenTool className="w-4 h-4" /> Karma Visualizer
                    </div>
                    <div 
                      className="w-full max-w-md mx-auto aspect-video"
                      dangerouslySetInnerHTML={{ __html: generatedNotes.illustration_svg }} 
                    />
                 </div>
               )}

               {generatedNotes.key_concepts && generatedNotes.key_concepts.length > 0 && (
                 <div className="mb-10 relative">
                   <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-6 uppercase tracking-wider flex items-center">
                     <Lightbulb className="mr-2 w-5 h-5 text-amber-500" />
                     Core Concepts
                   </h3>
                   <div className="space-y-6">
                     {generatedNotes.key_concepts.map((concept: any, i: number) => (
                       <div key={i} className="bg-white dark:bg-[#161B22] p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-white/10 group hover:border-blue-300 dark:hover:border-blue-500/50 transition-colors">
                           <strong className="text-lg text-slate-900 dark:text-white block mb-3">{concept.title}</strong>
                           <div className="prose prose-sm md:prose-base dark:prose-invert text-slate-600 dark:text-slate-300">
                             <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                               {concept.explanation}
                             </ReactMarkdown>
                           </div>
                       </div>
                     ))}
                   </div>
                 </div>
               )}

               {generatedNotes.formulas && generatedNotes.formulas.length > 0 && (
                 <div className="bg-[#FFF8E7] dark:bg-yellow-900/10 border border-[#FDE047] dark:border-yellow-500/30 rounded-2xl p-6 mb-10 shadow-sm">
                   <h3 className="text-sm font-bold text-[#854D0E] dark:text-yellow-500 mb-6 uppercase tracking-wider flex items-center">
                     <FunctionSquare className="mr-2 w-5 h-5" />
                     Essential Formulas
                   </h3>
                   <div className="grid sm:grid-cols-2 gap-4">
                     {generatedNotes.formulas.map((form: any, i: number) => (
                       <div key={i} className="bg-white dark:bg-[#0D1117] p-4 rounded-xl border border-yellow-200 dark:border-yellow-600/30">
                         <div className="text-lg font-bold text-slate-900 dark:text-white mb-2 overflow-x-auto custom-scrollbar pb-2">
                            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{form.formula}</ReactMarkdown>
                         </div>
                         <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">{form.description}</p>
                       </div>
                     ))}
                   </div>
                 </div>
               )}

               {/* Exam Ready PYQ Block */}
               {generatedNotes.practice_questions && generatedNotes.practice_questions.length > 0 && (
                 <div className="bg-blue-600 dark:bg-blue-900/40 rounded-3xl p-1 shadow-lg mt-8">
                    <div className="bg-blue-50 dark:bg-[#0D1117] rounded-[22px] p-6 sm:p-8">
                      <div className="flex items-center gap-3 mb-6">
                         <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
                            <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                         </div>
                         <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Exam Practice</h3>
                            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium uppercase tracking-widest">{memoryContext?.goal || 'Target Assessment'}</p>
                         </div>
                      </div>
                      
                      <div className="space-y-6">
                        {generatedNotes.practice_questions.map((q: any, i: number) => (
                          <div key={i} className="border-l-4 border-blue-500 pl-4 py-1">
                             <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{q.type}</div>
                             <div className="prose prose-sm sm:prose-base dark:prose-invert text-slate-800 dark:text-slate-200 font-medium mb-3">
                               <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{q.question}</ReactMarkdown>
                             </div>
                             <div className="bg-blue-100/50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 p-3 rounded-xl inline-block text-xs font-medium">
                               <span className="font-bold mr-1">Hint:</span> {q.hint}
                             </div>
                          </div>
                        ))}
                      </div>
                    </div>
                 </div>
               )}

             </div>
           </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto oapcity-80">
            <div className="w-24 h-24 bg-slate-100 dark:bg-[#161B22] rounded-full flex items-center justify-center mb-6 shadow-sm">
              <FileText className="w-10 h-10 text-slate-300 dark:text-slate-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">No Notes Generated Yet</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Paste your text or upload a document in the left panel. Karma AI will create exam-ready notes complete with SVGs, LaTeX formulas, and previous year questions.
            </p>
          </div>
        )}
    </div>
  );

  return (
    <div className="w-full h-full">
      <ResizableWorkspace 
        storageKey="notes_generator"
        defaultLayout={[30, 70]}
        leftPanel={leftPanelContent}
        rightPanel={rightPanelContent}
      />
    </div>
  );
}
