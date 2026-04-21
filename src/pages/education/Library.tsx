import { useState } from 'react';
import { BookOpen, FileText, Target, Brain, MoreVertical, Search, Filter } from 'lucide-react';

const MOCK_ITEMS = [
  { id: 1, title: 'Thermodynamics Core', type: 'notes', date: '2 days ago', subject: 'Physics' },
  { id: 2, title: 'Organic Chemistry Reactions', type: 'flashcards', date: '3 days ago', subject: 'Chemistry', count: 28 },
  { id: 3, title: 'Integration Practice', type: 'quiz', date: 'Last week', subject: 'Maths', count: 15 },
  { id: 4, title: 'Photoelectric Effect Explanations', type: 'notes', date: 'Last week', subject: 'Physics' },
];

export default function Library() {
  const [filter, setFilter] = useState<'all' | 'notes' | 'flashcards' | 'quiz'>('all');

  const filteredItems = filter === 'all' ? MOCK_ITEMS : MOCK_ITEMS.filter(i => i.type === filter);

  return (
    <div className="w-full h-full flex flex-col items-center">
      <div className="w-full max-w-6xl space-y-8 animate-in fade-in duration-500">
        
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Library</h1>
            <p className="text-slate-500 dark:text-slate-400">All your generated notes, quizzes, and flashcards in one place.</p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <input 
                type="text" 
                placeholder="Search library..." 
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#161B22] border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm transition-all"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
            <button className="p-2.5 bg-white dark:bg-[#161B22] border border-slate-200 dark:border-white/10 rounded-xl shadow-sm text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 p-1 bg-slate-100 dark:bg-[#0D1117] rounded-xl w-fit">
           <button onClick={() => setFilter('all')} className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${filter === 'all' ? 'bg-white dark:bg-[#161B22] text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>All Items</button>
           <button onClick={() => setFilter('notes')} className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${filter === 'notes' ? 'bg-white dark:bg-[#161B22] text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Notes</button>
           <button onClick={() => setFilter('flashcards')} className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${filter === 'flashcards' ? 'bg-white dark:bg-[#161B22] text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Flashcards</button>
           <button onClick={() => setFilter('quiz')} className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${filter === 'quiz' ? 'bg-white dark:bg-[#161B22] text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Quizzes</button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {filteredItems.map(item => (
             <div key={item.id} className="bg-white dark:bg-[#161B22] border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm group hover:border-blue-300 dark:hover:border-blue-500/50 transition-colors cursor-pointer">
               <div className="flex justify-between items-start mb-4">
                 <div className={`p-2.5 rounded-xl ${
                   item.type === 'notes' ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' :
                   item.type === 'flashcards' ? 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400' :
                   'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                 }`}>
                   {item.type === 'notes' && <FileText className="w-5 h-5" />}
                   {item.type === 'flashcards' && <Brain className="w-5 h-5" />}
                   {item.type === 'quiz' && <Target className="w-5 h-5" />}
                 </div>
                 <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity">
                   <MoreVertical className="w-4 h-4" />
                 </button>
               </div>
               
               <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{item.title}</h3>
               
               <div className="flex items-center text-xs font-medium text-slate-500 dark:text-slate-400 gap-3">
                 <span className="px-2.5 py-1 bg-slate-100 dark:bg-white/5 rounded-md text-slate-600 dark:text-slate-300">
                   {item.subject}
                 </span>
                 <span>{item.date}</span>
                 {item.count && <span>• {item.count} items</span>}
               </div>
             </div>
           ))}
        </div>

      </div>
    </div>
  );
}
