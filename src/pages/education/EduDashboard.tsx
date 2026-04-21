import { Flame, Clock, Target, Award, BookOpen, AlertCircle, Sparkles, Trophy, Brain } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, orderBy, limit, getDocs, getDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { formatDistanceToNow } from 'date-fns';

export default function EduDashboard() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<any[]>([]);
  const [memoryContext, setMemoryContext] = useState<any>(null);
  const [loadingActivities, setLoadingActivities] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      if (!user?.uid) return;
      try {
        const memRef = doc(db, 'users', user.uid, 'memories', 'education');
        const memSnap = await getDoc(memRef);
        if (memSnap.exists() && isMounted) setMemoryContext(memSnap.data().data);

        const q = query(
          collection(db, 'users', user.uid, 'generated_notes'),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        const snapshot = await getDocs(q);
        if (isMounted) {
          const fetched = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              action: data.type === 'notes' ? 'Generated Notes' : (data.type === 'chat' ? 'Tutor Interaction' : 'Completed Activity'),
              detail: `${data.subject || 'Subject'} - ${data.title || 'Topic'}`,
              time: data.createdAt ? formatDistanceToNow(data.createdAt.toDate(), { addSuffix: true }) : 'Just now'
            };
          });
          setActivities(fetched);
          setLoadingActivities(false);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
        if (isMounted) setLoadingActivities(false);
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, [user?.uid]);

  const firstName = user?.displayName?.split(' ')[0] || 'Scholar';
  const weakAreas = memoryContext?.weakAreas || ['Thermodynamics', 'Organic Chemistry'];

  return (
    <div className="w-full h-full overflow-y-auto space-y-6 custom-scrollbar pb-12">
      
      {/* Dynamic Profile Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-8 sm:p-10 shadow-lg border border-blue-500/20">
        <div className="absolute top-0 right-0 opacity-10 pointer-events-none transform translate-x-1/3 -translate-y-1/3">
           <svg width="400" height="400" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
              <path fill="#FFFFFF" d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,81.3,-46.3C90.8,-33.5,96.8,-18.1,95.5,-3.3C94.2,11.5,85.6,25.6,75.1,36.9C64.6,48.2,52.2,56.7,38.9,64.2C25.6,71.7,11.4,78.2,-2.2,81.3C-15.8,84.4,-28.9,84.1,-40.8,78.2C-52.7,72.3,-63.3,60.8,-71.4,47.8C-79.5,34.8,-85.1,20.3,-84.9,5.9C-84.7,-8.5,-78.7,-22.8,-70.5,-35.3C-62.3,-47.8,-51.9,-58.5,-39.6,-66.6C-27.3,-74.7,-13.6,-80.2,0.8,-81.5C15.2,-82.8,30.6,-83.6,44.7,-76.4Z" transform="translate(100 100)" />
           </svg>
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-blue-200" />
              <span className="text-blue-100 font-medium tracking-wider text-xs uppercase">Karma AI Core</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">Welcome back, {firstName}!</h1>
            <p className="text-blue-100 max-w-lg">
              {memoryContext 
                ? `Tuned for ${memoryContext.goal || 'Exams'}. Your AI is tracking your progress in ${memoryContext.board || ''} ${memoryContext.standard || ''}.`
                : "Your AI Tutor is ready for your next study session."}
            </p>
          </div>
          
          {memoryContext && (
            <div className="flex flex-wrap gap-2 md:max-w-xs">
              {memoryContext.subjects?.map((sub: string) => (
                <div key={sub} className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold whitespace-nowrap">
                  {sub}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top Value Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#161B22] p-5 rounded-2xl border border-slate-200 dark:border-white/10 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.04)] flex items-center justify-between hover:border-orange-500/50 transition-colors duration-300 group cursor-default">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 group-hover:text-orange-500 dark:group-hover:text-orange-400 transition-colors">Daily Streak</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">3 Days</h3>
          </div>
          <div className="w-12 h-12 bg-orange-100 dark:bg-orange-500/20 rounded-full flex items-center justify-center transform group-hover:scale-110 transition-transform">
            <Flame className="w-6 h-6 text-orange-500" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-[#161B22] p-5 rounded-2xl border border-slate-200 dark:border-white/10 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.04)] flex items-center justify-between hover:border-blue-500/50 transition-colors duration-300 group cursor-default">
          <div>
             <p className="text-sm font-medium text-slate-500 dark:text-slate-400 group-hover:text-blue-500 transition-colors">Time Analyzed</p>
             <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">4h 15m</h3>
          </div>
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-500/20 rounded-full flex items-center justify-center transform group-hover:scale-110 transition-transform">
             <Clock className="w-6 h-6 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#161B22] p-5 rounded-2xl border border-slate-200 dark:border-white/10 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.04)] flex items-center justify-between hover:border-emerald-500/50 transition-colors duration-300 group cursor-default">
          <div>
             <p className="text-sm font-medium text-slate-500 dark:text-slate-400 group-hover:text-emerald-500 transition-colors">Goal Trajectory</p>
             <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">On Track</h3>
          </div>
          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center transform group-hover:scale-110 transition-transform">
             <Target className="w-6 h-6 text-emerald-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#161B22] p-5 rounded-2xl border border-slate-200 dark:border-white/10 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.04)] flex items-center justify-between hover:border-purple-500/50 transition-colors duration-300 group cursor-default">
          <div>
             <p className="text-sm font-medium text-slate-500 dark:text-slate-400 group-hover:text-purple-500 transition-colors">Memory Core</p>
             <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">Active</h3>
          </div>
          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-500/20 rounded-full flex items-center justify-center transform group-hover:scale-110 transition-transform">
             <Brain className="w-6 h-6 text-purple-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Area (Left) */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white dark:bg-[#161B22] p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.04)] transition-colors duration-200">
             <div className="flex items-center justify-between mb-4">
               <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-500" /> Targeted Focus Areas
               </h3>
             </div>
             <p className="text-sm text-slate-500 mb-4">Karma AI is prioritizing these concepts in your generation and chats based on your onboarding profile.</p>
             <div className="grid sm:grid-cols-2 gap-4">
               {weakAreas.map((topic: string, i: number) => (
                 <div key={i} className="flex flex-col p-5 bg-amber-50/50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-500/20 hover:bg-amber-50 hover:shadow-md dark:hover:bg-amber-900/20 transition-all duration-300">
                   <div className="flex items-start justify-between mb-2">
                     <span className="font-bold text-amber-900 dark:text-amber-200 text-sm leading-tight">{topic}</span>
                     <div className="w-2 h-2 rounded-full bg-amber-400 mt-1 flex-shrink-0 animate-pulse"></div>
                   </div>
                   <button className="self-start mt-auto text-xs font-bold text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 uppercase tracking-widest transition-colors py-1 flex items-center gap-1 group/btn">
                     Revise Now <span className="transform group-hover/btn:translate-x-1 transition-transform">→</span>
                   </button>
                 </div>
               ))}
             </div>
          </div>

        </div>

        {/* Sidebar Metrics (Right) */}
        <div className="space-y-6">
           <div className="bg-white dark:bg-[#161B22] p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.04)] transition-colors duration-200 min-h-[300px]">
             <h3 className="font-semibold text-slate-900 dark:text-white mb-6">Recent Network Activity</h3>
             <div className="relative border-l-2 border-slate-100 dark:border-slate-800 ml-3 space-y-6">
               {loadingActivities ? (
                 <div className="pl-6 text-sm text-slate-500 animate-pulse">Loading neural sync...</div>
               ) : activities.length === 0 ? (
                 <div className="pl-6 text-sm text-slate-500">No recent activity found. Generate notes or chat to begin.</div>
               ) : (
                 activities.map((activity, i) => (
                   <div key={i} className="pl-6 relative group transform transition-all duration-300 hover:-translate-y-0.5">
                     <div className="absolute w-4 h-4 bg-blue-100 dark:bg-blue-900/50 rounded-full -left-[9px] top-0 flex items-center justify-center group-hover:scale-125 transition-transform duration-300">
                        <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
                     </div>
                     <p className="text-sm font-bold text-slate-900 dark:text-white leading-none mb-1">{activity.action}</p>
                     <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1 mb-1.5">{activity.detail}</p>
                     <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-semibold">{activity.time}</p>
                   </div>
                 ))
               )}
             </div>
           </div>

        </div>
      </div>
      
    </div>
  );
}
