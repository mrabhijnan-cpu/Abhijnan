import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 selection:bg-blue-100">
      <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-blue-50 to-transparent"></div>
      
      <div className="relative z-10 text-center max-w-3xl px-6">
         <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center text-white font-bold text-2xl mb-8 shadow-xl shadow-blue-600/20">
          K
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight mb-6">
          Karma <span className="text-blue-600">AI</span>
        </h1>
        <p className="text-xl md:text-2xl text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed">
          Your intelligent assistant for education and business.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link 
            to="/auth" 
            className="px-8 py-4 w-full sm:w-auto bg-slate-900 hover:bg-slate-800 transition-all rounded-xl text-white font-semibold text-lg shadow-lg active:scale-[0.98]"
          >
            Get Started
          </Link>
          <a  
            href="#features"
            className="px-8 py-4 w-full sm:w-auto bg-white hover:bg-slate-50 border border-slate-200 transition-all rounded-xl text-slate-700 font-medium text-lg active:scale-[0.98]"
          >
            Learn More
          </a>
        </div>
      </div>
    </div>
  );
}
