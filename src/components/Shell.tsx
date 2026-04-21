import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  Bell, User, LogOut, MessageSquare, FileText, BrainCircuit, 
  Calendar, Library, Brain, Settings, LayoutDashboard, Moon, Sun, 
  Menu, X, Loader2 
} from 'lucide-react';
import EducationOnboarding from '../pages/education/EducationOnboarding';

export default function Shell() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);

  const isEdu = user?.mode === 'education';

  useEffect(() => {
    let isMounted = true;
    const checkOnboarding = async () => {
      if (isEdu && user?.uid) {
         try {
           const docRef = doc(db, 'users', user.uid, 'memories', 'education');
           const snap = await getDoc(docRef);
           if (isMounted) {
               if (snap.exists() && snap.data().data?.onboardingComplete) {
                   setOnboardingComplete(true);
               } else {
                   setOnboardingComplete(false);
               }
           }
         } catch (e) {
           console.error("Memory check error", e);
           if (isMounted) setOnboardingComplete(false);
         }
      } else {
         if (isMounted) setOnboardingComplete(true);
      }
    };
    checkOnboarding();
    return () => { isMounted = false; };
  }, [isEdu, user?.uid]);

  const eduLinks = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/app/dashboard' },
    { name: 'Tutor Chat', icon: MessageSquare, path: '/app/tutor' },
    { name: 'Notes Generator', icon: FileText, path: '/app/notes' },
    { name: 'Quiz Master', icon: BrainCircuit, path: '/app/quiz' },
    { name: 'My Library', icon: Library, path: '/app/library' },
  ];

  const bizLinks = [
    { name: 'Bot Simulator', icon: MessageSquare, path: '/app/bot' },
    { name: 'FAQ Brain', icon: Brain, path: '/app/faq' },
    { name: 'Analytics', icon: FileText, path: '/app/analytics' },
    { name: 'Settings', icon: Settings, path: '/app/settings' },
  ];

  const links = isEdu ? eduLinks : bizLinks;

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  // Loading state while checking memory
  if (onboardingComplete === null) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-[#0D1117]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // Block entire shell if education onboarding is not complete
  if (isEdu && onboardingComplete === false) {
    return <EducationOnboarding onComplete={() => setOnboardingComplete(true)} />;
  }

  return (
    <div className="bg-slate-50 dark:bg-[#0D1117] text-slate-900 dark:text-slate-200 h-screen w-full flex overflow-hidden transition-colors duration-200">
      
      {/* Mobile Overlay Background */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* SideNavBar Component */}
      <nav className={`
        bg-white dark:bg-[#0D1117] border-r border-slate-200 dark:border-white/10 h-screen w-64 fixed left-0 top-0 flex flex-col z-50 transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full py-6 px-4">
          <div className="mb-8 flex items-center justify-between px-4">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center mr-3 text-white font-bold shadow-sm">
                K
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Karma AI</h1>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:block">
                  {isEdu ? 'EDUCATION ' : 'BUSINESS '}
                </span>
              </div>
            </div>
            {/* Close button for mobile inside sidebar */}
            <button onClick={closeMobileMenu} className="p-2 lg:hidden text-slate-500 rounded-md hover:bg-slate-100 dark:hover:bg-white/5">
               <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 space-y-2 overflow-y-auto pr-2">
            {links.map((link) => {
              const isActive = location.pathname.includes(link.path);
              const Icon = link.icon;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={closeMobileMenu}
                  className={`flex items-center px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                    isActive 
                      ? 'text-blue-700 bg-blue-50 dark:bg-blue-600/10 dark:text-blue-400' 
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-5 h-5 mr-3 flex-shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400' : ''}`} />
                  <span className="truncate">{link.name}</span>
                </Link>
              );
            })}
          </div>

          <div className="mt-auto pt-4">
            <div className="bg-slate-50 dark:bg-[#161B22] border border-slate-200 dark:border-white/5 p-4 rounded-xl mb-4">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">{isEdu ? 'JEE Mains Countdown' : 'System Status'}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{isEdu ? '42 Days Remaining' : 'All systems operational'}</p>
            </div>
          </div>
        </div>
      </nav>

      {/* TopNavBar Component */}
      <header className={`
        bg-white/80 dark:bg-[#0D1117]/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/10 
        fixed top-0 right-0 h-16 z-30 flex items-center justify-between transition-all duration-300
        w-full lg:w-[calc(100%-16rem)] px-4 sm:px-8
      `}>
        <div className="flex items-center">
          {/* Hamburger Menu for Mobile */}
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 mr-3 lg:hidden text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="flex items-center space-x-2 sm:space-x-4 text-sm font-medium">
            <span className="text-slate-400 dark:text-slate-500 cursor-pointer hidden sm:block">{isEdu ? 'Education' : 'Business'}</span>
            <span className="text-slate-300 dark:text-slate-600 hidden sm:block">/</span>
            <span className="text-slate-900 dark:text-white font-bold capitalize truncate max-w-[150px] sm:max-w-none">
              {location.pathname.split('/').pop() || 'Dashboard'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-1 sm:space-x-4">
          <button 
             onClick={toggleTheme}
             className="w-10 h-10 rounded-full flex flex-shrink-0 items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button className="w-10 h-10 rounded-full flex flex-shrink-0 items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors relative hidden sm:flex">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-[#0D1117]"></span>
          </button>
          
          <div className="relative group ml-1 sm:ml-2">
            <button className="w-8 h-8 rounded-full flex-shrink-0 bg-slate-900 dark:bg-slate-700 text-white flex items-center justify-center font-bold text-xs cursor-pointer hover:ring-2 hover:ring-slate-300 dark:hover:ring-slate-600 transition-all">
              {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#161B22] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pb-1 origin-top-right">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-white/5">
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user?.displayName || 'User'}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
              </div>
              <button onClick={logout} className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-2 mt-1 font-medium transition-colors">
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className={`
        mt-16 w-full h-[calc(100vh-4rem)] flex gap-4 sm:gap-8 overflow-hidden 
        bg-slate-50 dark:bg-[#0D1117] transition-all duration-300
        lg:ml-64 p-4 sm:p-6 md:p-8
      `}>
        <Outlet />
      </main>
    </div>
  );
}
