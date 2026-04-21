import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Send, GraduationCap, Image as ImageIcon, Brain, ThumbsUp, ThumbsDown, Zap, Minimize2, Bookmark, Loader2, Plus, MessageSquare, Edit2, Check } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { evaluate } from 'mathjs';
import MemoryProfileModal from '../../components/MemoryProfileModal';
import { db } from '../../lib/firebase';
import { doc, getDoc, collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, updateDoc, Timestamp } from 'firebase/firestore';
import ResizableWorkspace from '../../components/ResizableWorkspace';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  image?: string;
  createdAt?: Timestamp | Date;
}

interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  updatedAt: Timestamp | Date | any;
}

const RESPONSE_CONTROLS = [
  { label: 'Simpler', icon: Zap, prompt: 'Re-explain that but much simpler, as if to a beginner using everyday analogies. Avoid technical jargon.' },
  { label: 'Example', icon: GraduationCap, prompt: 'Give me 2 real-world examples that illustrate this concept.' },
  { label: 'Shorter', icon: Minimize2, prompt: 'Summarize this in 3-4 bullet points maximum.' },
];

export default function TutorChat() {
  const { user } = useAuth();
  
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [memoryContext, setMemoryContext] = useState<any>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  // 1. Fetch Memory
  useEffect(() => {
    let isMounted = true;
    if (!user?.uid) return;
    const loadMemory = async () => {
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

  // 2. Listen to Chat History
  useEffect(() => {
    if (!user?.uid) return;
    const q = query(
      collection(db, 'users', user.uid, 'tutor_chats'),
      orderBy('updatedAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedChats: ChatSession[] = [];
      snapshot.forEach((doc) => {
        loadedChats.push({ id: doc.id, ...doc.data() } as ChatSession);
      });
      setChats(loadedChats);
      
      // Auto-select first chat if none selected
      if (!activeChatId && loadedChats.length > 0) {
        setActiveChatId(loadedChats[0].id);
      }
    }, (error) => {
      console.error("Firestore Error in Chat list:", error);
    });

    return () => unsubscribe();
  }, [user?.uid, activeChatId]);

  // 3. Listen to Active Chat Messages
  useEffect(() => {
    if (!user?.uid) return;
    if (!activeChatId) {
      // If no active chat, start with greeting
      startNewChatUI();
      return;
    }

    const q = query(
      collection(db, 'users', user.uid, 'tutor_chats', activeChatId, 'messages'),
      orderBy('createdAt', 'asc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedMessages: ChatMessage[] = [];
      snapshot.forEach((doc) => {
        loadedMessages.push({ id: doc.id, ...doc.data() } as ChatMessage);
      });
      setMessages(loadedMessages);
    }, (error) => {
      console.error("Firestore Error in Message list:", error);
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, activeChatId]);

  const startNewChatUI = () => {
    setActiveChatId(null);
    const contextContent = memoryContext 
      ? `Hi ${memoryContext.name || user?.displayName?.split(' ')[0] || 'there'}! I'm your Karma AI Tutor. I see you're preparing for **${memoryContext.goal || 'your exams'}** and focusing on **${memoryContext.subjects?.join(', ') || 'your subjects'}**. Ask me anything, or upload a photo of a problem!`
      : `Hi ${user?.displayName?.split(' ')[0] || 'there'}! I'm your Karma AI Tutor. Ask me anything, or upload a photo of a problem you are stuck on.`;

    setMessages([{
      id: 'greeting',
      role: 'model',
      content: contextContent
    }]);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const fileToGenerativePart = async (file: File) => {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      reader.readAsDataURL(file);
    });
    return {
      inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
  };

  const buildSystemInstruction = () => {
    if (!memoryContext) return "You are an expert, encouraging AI Tutor.";
    return `You are Karma AI, an expert educational tutor.
Student Context:
- Name: ${memoryContext.name}
- Board: ${memoryContext.board}
- Standard: ${memoryContext.standard}
- Stream: ${memoryContext.stream}
- Goals: ${memoryContext.goal}
- Weak Areas: ${memoryContext.weakAreas?.join(', ')}
- Explanation Style: ${memoryContext.explanationStyle}

Instructions:
Tailor all explanations specifically to their board and standard. 
If they upload an image, isolate the problem.
Use Markdown heavily for readability (bolding, lists, and proper math formatting).
IMPORTANT MATH FORMATTING: Always use LaTeX wrapped in $$...$$ for block equations, and $...$ for inline equations. Do not use plain text for math symbols.
At the very end of explaining a new concept, you can casually ask if they'd like a practice question.`;
  };

  const handleSend = async (messageOverride?: string) => {
    const textToSend = messageOverride || input;
    if (!textToSend.trim() && !imageFile) return;

    if (!user?.uid) return;

    const currentImage = imagePreview;
    const fileToProcess = imageFile;

    setInput('');
    removeImage();
    setIsLoading(true);

    let currentChatId = activeChatId;

    try {
      // 1. If it's a new chat, create doc first
      let autoNamedTitle = textToSend.length > 30 ? textToSend.substring(0, 30) + '...' : textToSend || 'Image Analysis';

      if (!currentChatId) {
        // Try to generate a smart title using Gemini
        try {
           const titleResponse = await ai.models.generateContent({
             model: 'gemini-3.1-pro-preview',
             contents: [{ role: 'user', parts: [{ text: `Generate a short 3-5 word title for a chat that starts with this message: "${textToSend}". ONLY return the title, no quotes or intro.` }] }]
           });
           if (titleResponse.text) {
             autoNamedTitle = titleResponse.text.trim().replace(/^"|"$/g, '');
           }
        } catch (titleErr) {
           console.error("Title generation failed", titleErr);
           autoNamedTitle = "Untitled Chat";
        }

        const newChatRef = await addDoc(collection(db, 'users', user.uid, 'tutor_chats'), {
          title: autoNamedTitle,
          lastMessage: textToSend.substring(0, 40) + '...',
          updatedAt: serverTimestamp()
        });
        currentChatId = newChatRef.id;
        setActiveChatId(currentChatId);
      } else {
        // Update last message
        const chatRef = doc(db, 'users', user.uid, 'tutor_chats', currentChatId);
        await updateDoc(chatRef, {
          lastMessage: textToSend.substring(0, 40) + '...',
          updatedAt: serverTimestamp()
        });
      }

      // 2. Add user message to subcollection
      const messagesRef = collection(db, 'users', user.uid, 'tutor_chats', currentChatId, 'messages');
      await addDoc(messagesRef, {
        role: 'user',
        content: textToSend,
        image: currentImage || null,
        createdAt: serverTimestamp()
      });

      // 3. Prepare Prompt & Call Gemini
      const recentMessages = messages.slice(-15);
      const historyMsgFormats = recentMessages
        .filter(msg => msg.id !== 'greeting')
        .map(msg => ({
          role: msg.role,
          parts: [{ text: msg.content }]
        }));

      const systemInstruction = buildSystemInstruction();
      
      const mathTool = {
         name: "calculate_math",
         description: "Evaluate any mathematical expression and return the exact numerical result. Use this whenever the user asks for a calculation.",
         parameters: {
             type: "OBJECT",
             properties: {
                 expression: {
                     type: "STRING",
                     description: "The mathematical expression string to evaluate (e.g., '45345 * 342', 'sin(45 deg)', '2^10')."
                 }
             },
             required: ["expression"]
         }
      };

      const baseConfig: any = { 
        systemInstruction,
        tools: [{ functionDeclarations: [mathTool] }],
        toolConfig: { includeServerSideToolInvocations: true }
      };

      let baseContents = [];

      if (fileToProcess) {
         const imagePart = await fileToGenerativePart(fileToProcess);
         baseContents = [{ 
             role: 'user', 
             parts: [
               imagePart, 
               { text: `The student has uploaded an image of a problem. User's message: "${textToSend || 'Please solve this'}" \n\n Instructions: 1. Identify subject 2. Solve step-by-step if math/physics 3. Use LaTeX. You can use calculate_math tool to verify calculations.` }
             ] 
         }];
      } else {
         baseContents = [
             ...historyMsgFormats,
             { role: 'user', parts: [{ text: textToSend }] }
         ];
      }

      let response = await ai.models.generateContent({
         model: 'gemini-3.1-pro-preview',
         config: baseConfig,
         contents: baseContents as any
      });

      // Agentic Tool Loop
      if (response.functionCalls && response.functionCalls.length > 0) {
         try {
             // Dynamically import mathjs to keep bundle small if unused initially
             const { evaluate } = await import('mathjs');
             
             // Extract function call
             const fCall = response.functionCalls[0];
             let calcResult = "";
             
             if (fCall.name === 'calculate_math' && typeof fCall.args?.expression === 'string') {
                 try {
                     calcResult = String(evaluate(fCall.args.expression));
                 } catch (mathErr) {
                     calcResult = `Error evaluating expression: ${mathErr}`;
                 }
             } else {
                 calcResult = "Unknown function or missing expression.";
             }

             // Append model's tool call request to history
             const modelContent = response.candidates?.[0]?.content;
             if (modelContent) baseContents.push(modelContent);
             
             // Append the tool execution result
             baseContents.push({
                 role: 'user',
                 parts: [{ text: `System Tool Response for ${fCall.name}: ${calcResult}\n\nPlease proceed to give your final answer based on this result.` }]
             });

             // Call again with tool results
             response = await ai.models.generateContent({
                 model: 'gemini-3.1-pro-preview',
                 config: { systemInstruction }, // Standard text config now
                 contents: baseContents as any
             });
             
         } catch (toolExecErr) {
             console.error("Tool execution failed", toolExecErr);
         }
      }

      // 4. Save Bot Response
      await addDoc(messagesRef, {
        role: 'model',
        content: response.text || "I couldn't process that.",
        createdAt: serverTimestamp()
      });

    } catch (error) {
      console.error("Gemini Error:", error);
      if (currentChatId) {
         await addDoc(collection(db, 'users', user.uid, 'tutor_chats', currentChatId, 'messages'), {
            role: 'model',
            content: "Oops! Something went wrong communicating with my neural engine. Please try again.",
            createdAt: serverTimestamp()
         });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const saveEditingTitle = async (chatId: string) => {
    if (!user?.uid || !editingTitle.trim()) return;
    try {
      const chatRef = doc(db, 'users', user.uid, 'tutor_chats', chatId);
      await updateDoc(chatRef, {
        title: editingTitle.trim()
      });
      setEditingChatId(null);
      setEditingTitle('');
    } catch (e) {
      console.error("Failed to rename chat", e);
    }
  };

  const leftPanelContent = (
    <div className="w-full h-full flex flex-col bg-white dark:bg-[#161B22] rounded-xl shadow-[0_4px_20px_-2px_rgba(15,23,42,0.04)] border border-slate-200 dark:border-white/10 p-4 overflow-hidden">
       <button 
         onClick={startNewChatUI}
         className="w-full flex items-center justify-center gap-2 mb-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-xl shadow-sm transition-colors text-sm"
       >
         <Plus className="w-4 h-4" /> New Chat
       </button>
       
       {/* Memory & ML Panel Portal Trigger */}
       <MemoryProfileModal memoryContext={memoryContext} />
       
       <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-2 mb-3 px-2">Recent Sessions</h3>
       
       <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar pr-1">
         {chats.length === 0 ? (
           <p className="text-xs text-slate-500 text-center mt-4">No previous chats.</p>
         ) : chats.map((chat) => (
           <div 
             key={chat.id}
             onClick={() => { if (editingChatId !== chat.id) setActiveChatId(chat.id); }}
             className={`p-3 rounded-lg border group transition-all ${
               activeChatId === chat.id 
                 ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800/50' 
                 : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer'
             }`}
           >
             <div className="flex items-center justify-between mb-1">
               {editingChatId === chat.id ? (
                 <div className="flex items-center gap-2 w-full" onClick={(e) => e.stopPropagation()}>
                    <input 
                       type="text" 
                       value={editingTitle} 
                       onChange={e => setEditingTitle(e.target.value)}
                       onKeyDown={e => e.key === 'Enter' && saveEditingTitle(chat.id)}
                       className="flex-1 bg-white dark:bg-[#0D1117] text-sm text-slate-900 dark:text-white px-2 py-1 rounded border border-blue-400 outline-none"
                       autoFocus
                    />
                    <button onClick={() => saveEditingTitle(chat.id)} className="text-emerald-500 hover:text-emerald-600"><Check className="w-4 h-4" /></button>
                 </div>
               ) : (
                 <>
                   <div className="flex items-center gap-2 text-slate-900 dark:text-white overflow-hidden">
                     <MessageSquare className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                     <p className="text-sm font-semibold truncate">{chat.title || 'Untitled Chat'}</p>
                   </div>
                   <button 
                     onClick={(e) => { e.stopPropagation(); setEditingChatId(chat.id); setEditingTitle(chat.title || 'Untitled Chat'); }} 
                     className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-opacity"
                   >
                     <Edit2 className="w-3.5 h-3.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200" />
                   </button>
                 </>
               )}
             </div>
             {editingChatId !== chat.id && (
               <p className={`text-xs truncate ${activeChatId === chat.id ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}>
                 {chat.lastMessage}
               </p>
             )}
           </div>
         ))}
       </div>

       {/* Active Memory Panel View */}
       {memoryContext && (
         <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/10 shrink-0">
           <div className="flex justify-between items-center mb-2 px-1">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest flex items-center gap-2">
                 <Brain className="w-3.5 h-3.5 text-blue-500" /> Active Memory
              </h3>
           </div>
           <div className="bg-slate-50 dark:bg-[#0D1117] border border-slate-200 dark:border-white/5 rounded-xl p-3 space-y-2">
              <div className="flex flex-col gap-0.5">
                 <span className="text-[10px] text-slate-500 uppercase font-semibold">Standard & Board</span>
                 <span className="text-xs text-slate-800 dark:text-slate-200 font-medium">{memoryContext.standard} • {memoryContext.board}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                 <span className="text-[10px] text-slate-500 uppercase font-semibold">Goal</span>
                 <span className="text-xs text-slate-800 dark:text-slate-200 font-medium">{memoryContext.goal}</span>
              </div>
              <div className="flex flex-col gap-1 mt-1">
                 <span className="text-[10px] text-slate-500 uppercase font-semibold">Weak Areas</span>
                 <div className="flex flex-wrap gap-1">
                    {Array.isArray(memoryContext.weakAreas) ? memoryContext.weakAreas.map((area: string) => (
                       <span key={area} className="px-1.5 py-0.5 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 text-[10px] rounded-md font-medium border border-red-200 dark:border-red-500/20">{area}</span>
                    )) : null}
                 </div>
              </div>
           </div>
         </div>
       )}
    </div>
  );

  const rightPanelContent = (
    <div className="w-full h-full flex flex-col bg-white dark:bg-[#161B22] rounded-xl shadow-[0_4px_20px_-2px_rgba(15,23,42,0.04)] border border-slate-200 dark:border-white/10 overflow-hidden transition-colors duration-200">
      <div className="p-4 border-b border-slate-200 dark:border-white/5 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-white">Karma Tutor</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">AI-powered personalized guidance</p>
          </div>
        </div>
        {memoryContext && (
          <div className="hidden sm:flex text-xs px-3 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 rounded-full font-medium items-center shadow-sm">
            Mode: {memoryContext.explanationStyle}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} w-full`}>
            {msg.role === 'model' && (
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center mr-3 flex-shrink-0 mt-1">
                <GraduationCap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
            )}

            <div className={`max-w-[85%] sm:max-w-[80%] rounded-2xl p-4 shadow-sm ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-br-none' 
                : 'bg-slate-50 dark:bg-[#0D1117] text-slate-800 dark:text-slate-200 rounded-bl-none border border-slate-200 dark:border-white/10'
            }`}>
              
              {msg.image && (
                <div className="mb-3 rounded-lg overflow-hidden border border-white/20">
                  <img src={msg.image} alt="User upload" className="max-h-60 w-auto object-contain" />
                </div>
              )}

              <div className={`prose prose-sm dark:prose-invert max-w-none ${msg.role === 'user' ? 'text-white' : 'text-slate-800 dark:text-slate-200'}`}>
                 <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{msg.content}</ReactMarkdown>
              </div>

              {msg.role === 'model' && msg.id !== 'greeting' && (
                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-2">
                   <div className="flex flex-wrap gap-2">
                     {RESPONSE_CONTROLS.map((ctrl) => (
                       <button 
                         key={ctrl.label}
                         onClick={() => handleSend(`[Action: Context Control] ${ctrl.prompt} Original text reference: "${msg.content.slice(0, 50)}..."`)}
                         disabled={isLoading}
                         className="flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-[#161B22] border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 text-[11px] font-medium rounded-md hover:bg-slate-50 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
                       >
                         <ctrl.icon className="w-3 h-3" />
                         {ctrl.label}
                       </button>
                     ))}
                   </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start items-center">
             <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center mr-3 flex-shrink-0 mt-1">
                <GraduationCap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
             </div>
             <div className="bg-slate-50 dark:bg-[#0D1117] border border-slate-200 dark:border-white/10 rounded-2xl rounded-bl-none p-4 flex items-center gap-3">
               <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
               <span className="text-sm font-medium text-slate-500">Synthesizing...</span>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-slate-50 dark:bg-[#0D1117] border-t border-slate-200 dark:border-white/10 transition-colors duration-200">
        {imagePreview && (
          <div className="mb-3 relative inline-block">
            <div className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-white/20 bg-white dark:bg-black/20 w-24 h-24 flex items-center justify-center">
               <img src={imagePreview} alt="Preview" className="max-w-full max-h-full object-contain" />
            </div>
            <button 
              onClick={removeImage}
              className="absolute -top-2 -right-2 bg-slate-900 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold hover:bg-red-600 transform transition-transform shadow-sm z-10"
            >
              ×
            </button>
          </div>
        )}

        <div className="relative flex items-end gap-2 bg-white dark:bg-[#161B22] border border-slate-200 dark:border-white/10 rounded-xl p-2 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-400">
          <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageChange} />
          <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-all" title="Upload Image">
            <ImageIcon className="w-5 h-5" />
          </button>

          <textarea 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Ask a question or upload a problem..."
            className="flex-1 max-h-32 min-h-[44px] bg-transparent border-none focus:ring-0 resize-none py-3 text-slate-900 dark:text-slate-100 placeholder-slate-400 text-sm focus:outline-none"
            rows={1}
          />
          
          <button onClick={() => handleSend()} disabled={(!input.trim() && !imageFile) || isLoading} className="p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white rounded-lg transition-all shadow-sm flex-shrink-0">
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full h-full">
      <ResizableWorkspace 
        storageKey="tutor_chat"
        defaultLayout={[25, 75]}
        leftPanel={leftPanelContent}
        rightPanel={rightPanelContent}
      />
    </div>
  );
}
