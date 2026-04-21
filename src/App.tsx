/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import ModeSelection from './pages/ModeSelection';
import Shell from './components/Shell';

// App Pages
import EduDashboard from './pages/education/EduDashboard';
import TutorChat from './pages/education/TutorChat';
import NotesGenerator from './pages/education/NotesGenerator';
import QuizMaster from './pages/education/QuizMaster';
import Library from './pages/education/Library';
import BotSimulator from './pages/business/BotSimulator';

function ProtectedRoute({ children, allowSetup = false }: { children: React.ReactNode, allowSetup?: boolean }) {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">Loading...</div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (user.mode === 'setup' && !allowSetup) return <Navigate to="/mode-selection" replace />;
  
  return <>{children}</>;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/mode-selection" element={
              <ProtectedRoute allowSetup={true}>
                <ModeSelection />
              </ProtectedRoute>
            } />
            
            <Route path="/app" element={
              <ProtectedRoute>
                <Shell />
              </ProtectedRoute>
            }>
              {/* Default redirect if hitting /app exactly */}
              <Route index element={<Navigate to="dashboard" replace />} />
              
              <Route path="dashboard" element={<EduDashboard />} />
              <Route path="tutor" element={<TutorChat />} />
              <Route path="notes" element={<NotesGenerator />} />
              <Route path="quiz" element={<QuizMaster />} />
              <Route path="library" element={<Library />} />
              
              <Route path="bot" element={<BotSimulator />} />
            </Route>
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}
