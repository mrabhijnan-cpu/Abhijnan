import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Brain, Sparkles, Send, Loader2 } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

interface ChatMsg {
  role: 'bot' | 'user';
  text: string;
}

export default function EducationOnboarding({ onComplete }: { onComplete: () => void }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: 'bot', text: `Hi ${user?.displayName?.split(' ')[0] || 'there'}! I'm Karma AI. To be the best tutor for you, let's set up your profile. First, what grade or standard are you currently in? (e.g., Class 11, College 1st Year)` }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [memoryState, setMemoryState] = useState<Record<string, any>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const extractAndAskNext = async (userResponse: string) => {
    const aiSystemPrompt = `You are a friendly AI tutor named Karma onboarding a student. 
The student is responding to your questions. 
You are trying to extract these fields for their Education Memory Profile:
- standard (e.g., Class 11)
- board (e.g., CBSE, State, IB)
- subjects (e.g., Physics, Maths)
- goal (e.g., JEE Mains, NEET, Boards)
- weakAreas (e.g., Integration, Optics)

CURRENT MEMORY STATE: ${JSON.stringify(memoryState)}

USER MESSAGE: "${userResponse}"

INSTRUCTIONS:
1. Parse the user's message to find out which of the missing fields they answered.
2. Output EXACTLY a JSON string with 2 keys:
   - "extracted": a dictionary of the fields you successfully parsed from their message.
   - "next_question": a friendly follow-up question to ask about the NEXT missing field. If all fields (standard, board, subjects, goal, weakAreas) are filled, set this to "COMPLETE".
Do not wrap in markdown or backticks. JUST the JSON object.
Example: {"extracted": {"standard": "Class 11"}, "next_question": "Awesome! And which educational board are you studying under (like CBSE, ICSE, or State board)?"}`;

    try {
      const result = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        config: { systemInstruction: aiSystemPrompt },
        contents: [{ role: 'user', parts: [{ text: userResponse }] }]
      });

      const text = (result.text || '').replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(text);

      const newMemory = { ...memoryState, ...(parsed.extracted || {}) };
      setMemoryState(newMemory);

      if (parsed.next_question === 'COMPLETE') {
        setMessages(prev => [...prev, { role: 'bot', text: "Perfect! I have everything I need. Setting up your customized AI Workspace now..." }]);
        
        // Save to Firebase
        const memoryRef = doc(db, 'users', user!.uid, 'memories', 'education');
        await setDoc(memoryRef, {
          userId: user!.uid,
          mode: 'education',
          updatedAt: serverTimestamp(),
          data: {
            name: user?.displayName || '',
            country: 'India',
            preferredLanguage: 'English',
            board: newMemory.board || 'CBSE',
            standard: newMemory.standard || 'Class 12',
            stream: newMemory.stream || 'Science',
            subjects: Array.isArray(newMemory.subjects) ? newMemory.subjects : [newMemory.subjects || 'General'],
            goal: newMemory.goal || 'General Exams',
            weakAreas: Array.isArray(newMemory.weakAreas) ? newMemory.weakAreas : [newMemory.weakAreas || 'None'],
            explanationStyle: 'Balanced',
            onboardingComplete: true
          }
        });

        setTimeout(() => onComplete(), 2000);
      } else {
        setMessages(prev => [...prev, { role: 'bot', text: parsed.next_question }]);
        setIsTyping(false);
      }
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { role: 'bot', text: "I missed that. Could you tell me again?" }]);
      setIsTyping(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const msg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: msg }]);
    setIsTyping(true);
    await extractAndAskNext(msg);
  };

  return (
    <div className="w-full h-screen fixed inset-0 z-[100] bg-slate-50 dark:bg-[#0D1117] flex items-center justify-center p-4 sm:p-6 pb-[20vh] md:pb-6">
      <div className="w-full max-w-3xl bg-white dark:bg-[#161B22] border border-slate-200 dark:border-white/10 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col h-[70vh] md:h-[80vh] overflow-hidden animate-in fade-in zoom-in-95 duration-500">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5 flex items-center bg-slate-50/50 dark:bg-[#161B22]/50">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mr-4 shadow-sm relative">
             <Sparkles className="w-5 h-5" />
             <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-teal-400 border-2 border-white dark:border-[#161B22] rounded-full"></div>
          </div>
          <div>
            <h1 className="font-bold text-slate-900 dark:text-white">Karma AI Onboarding</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Memory Initialization Protocol</p>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white dark:bg-[#161B22] custom-scrollbar">
          {messages.map((m, i) => (
             <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} w-full`}>
               {m.role === 'bot' && (
                 <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center mr-3 mt-1 flex-shrink-0">
                   <Brain className="w-4 h-4 text-blue-600" />
                 </div>
               )}
               <div className={`max-w-[80%] rounded-2xl p-4 shadow-sm text-[15px] leading-relaxed ${
                 m.role === 'user' 
                   ? 'bg-blue-600 text-white rounded-tr-none' 
                   : 'bg-slate-50 dark:bg-[#0D1117] text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-200 dark:border-white/5'
               }`}>
                 {m.text}
               </div>
             </div>
          ))}
          
          {isTyping && (
             <div className="flex justify-start w-full">
               <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center mr-3 mt-1 flex-shrink-0">
                 <Brain className="w-4 h-4 text-blue-600" />
               </div>
               <div className="bg-slate-50 dark:bg-[#0D1117] rounded-2xl rounded-tl-none p-4 border border-slate-200 dark:border-white/5 flex items-center shadow-sm">
                 <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                 <span className="ml-2 text-sm text-slate-500 font-medium tracking-wide animate-pulse">Karma is thinking...</span>
               </div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-slate-50/50 dark:bg-[#161B22]/50 border-t border-slate-100 dark:border-white/5">
          <div className="relative flex items-center max-w-4xl mx-auto">
            <input 
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Type your response..."
              className="w-full bg-white dark:bg-[#0D1117] border border-slate-200 dark:border-white/10 rounded-full py-4 pl-6 pr-14 outline-none focus:ring-2 focus:ring-blue-500/50 text-sm shadow-sm transition-all"
              disabled={isTyping}
            />
            <button 
              onClick={handleSend}
              disabled={isTyping || !input.trim()}
              className="absolute right-2 w-10 h-10 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-full flex items-center justify-center transition-transform active:scale-95 shadow-md flex-shrink-0"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
