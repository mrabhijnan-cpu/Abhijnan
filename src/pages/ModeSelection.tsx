import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Briefcase } from 'lucide-react';

export default function ModeSelection() {
  const { updateUserMode } = useAuth();
  const navigate = useNavigate();

  const handleSelect = async (mode: 'education' | 'business') => {
    await updateUserMode(mode);
    navigate(mode === 'education' ? '/app/tutor' : '/app/bot');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 mb-3">Choose Your Path</h2>
          <p className="text-slate-500 text-lg">Select how you want to use Karma AI today.</p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          <button 
            onClick={() => handleSelect('education')}
            className="group relative p-8 bg-white border border-slate-200 rounded-2xl hover:border-blue-300 hover:shadow-[0_8px_30px_rgb(59,130,246,0.12)] transition-all text-left overflow-hidden active:scale-[0.99]"
          >
            <div className="w-14 h-14 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <GraduationCap className="w-7 h-7 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Education Mode</h3>
            <p className="text-slate-500 leading-relaxed text-sm">
              For students and lifelong learners. Features a personalized tutor, notes generator, smart quizzes, and spaced repetition flashcards.
            </p>
          </button>

          <button 
            onClick={() => handleSelect('business')}
            className="group relative p-8 bg-white border border-slate-200 rounded-2xl hover:border-emerald-300 hover:shadow-[0_8px_30px_rgb(16,185,129,0.12)] transition-all text-left overflow-hidden active:scale-[0.99]"
          >
            <div className="w-14 h-14 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <Briefcase className="w-7 h-7 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Business Mode</h3>
            <p className="text-slate-500 leading-relaxed text-sm">
              For professionals. Train your own FAQ brain, simulate a customer service web bot, and manage your custom knowledge base.
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}
