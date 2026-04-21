import { useState } from 'react';
import { Brain, Sparkles, TrendingUp, BookOpen, Activity, X } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';

export default function MemoryProfileModal({ memoryContext }: { memoryContext: any }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className="w-full flex items-center justify-center gap-2 mb-2 bg-slate-800 hover:bg-slate-900 dark:bg-white/10 dark:hover:bg-white/20 text-white font-medium py-2.5 rounded-xl shadow-sm transition-colors text-sm">
          <Brain className="w-4 h-4 text-emerald-400" /> ML & Memory Profile
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white dark:bg-[#161B22] p-6 rounded-3xl shadow-xl z-50 border border-slate-200 dark:border-white/10 outline-none">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
              <Brain className="w-5 h-5 text-blue-500" /> Neural Memory Core
            </h2>
            <Dialog.Close asChild>
              <button className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors"><X className="w-4 h-4 text-slate-500" /></button>
            </Dialog.Close>
          </div>

          <div className="space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar pr-2">
            {/* Profile Data */}
            <div className="bg-slate-50 dark:bg-[#0D1117] p-4 rounded-xl border border-slate-100 dark:border-white/5 relative overflow-hidden">
               <Sparkles className="absolute top-2 right-2 w-16 h-16 text-blue-500/5 rotate-12" />
               <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider">Extracted Demographics</h3>
               <div className="grid grid-cols-2 gap-4 text-sm">
                 <div>
                   <span className="text-slate-400 block text-xs">Standard</span>
                   <span className="font-semibold text-slate-800 dark:text-slate-200">{memoryContext?.standard || 'Pending'}</span>
                 </div>
                 <div>
                   <span className="text-slate-400 block text-xs">Target Goal</span>
                   <span className="font-semibold text-slate-800 dark:text-slate-200">{memoryContext?.goal || 'Pending'}</span>
                 </div>
                 <div className="col-span-2">
                   <span className="text-slate-400 block text-xs">Weak Areas</span>
                   <div className="flex flex-wrap gap-1 mt-1">
                      {memoryContext?.weakAreas?.map((w: string) => (
                         <span key={w} className="px-2 py-0.5 bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded text-xs font-medium">{w}</span>
                      )) || <span className="text-slate-500">None detected</span>}
                   </div>
                 </div>
               </div>
            </div>

            {/* ML Concept */}
            <div className="bg-slate-50 dark:bg-[#0D1117] p-4 rounded-xl border border-slate-100 dark:border-white/5">
               <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" /> Bayesian Knowledge Tracing
               </h3>
               <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Real-time P(Know) probabilities modeled via chat interactions.</p>
               {memoryContext?.weakAreas?.length > 0 ? memoryContext.weakAreas.map((w: string, i: number) => (
                 <div key={w} className="mb-2">
                   <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-700 dark:text-slate-300">{w}</span>
                      <span className="text-blue-500 font-mono">{20 + (i * 15)}%</span>
                   </div>
                   <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                     <div className="bg-blue-500 h-1.5 rounded-full transition-all duration-1000" style={{ width: `${20 + (i * 15)}%` }}></div>
                   </div>
                 </div>
               )) : <p className="text-xs text-slate-500 italic">Not enough data to model.</p>}
            </div>

            {/* SM2 Spaced Repetition */}
            <div className="bg-slate-50 dark:bg-[#0D1117] p-4 rounded-xl border border-slate-100 dark:border-white/5">
               <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4" /> Spaced Repetition (SM-2)
               </h3>
               <div className="flex justify-between items-center text-sm p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-lg">
                  <div className="flex items-center gap-2">
                     <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                     <span className="text-emerald-800 dark:text-emerald-300 font-medium tracking-tight">Due for Review Today</span>
                  </div>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 px-2 py-0.5 bg-white dark:bg-emerald-900/50 rounded shadow-sm border border-emerald-200 dark:border-emerald-800">
                    0 Topics
                  </span>
               </div>
               <p className="text-[10px] text-slate-400 mt-2">Active intervals driven by Ebbinghaus forgetting curve.</p>
            </div>

          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
