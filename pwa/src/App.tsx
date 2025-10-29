import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { SocketProvider } from './contexts/SocketContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { MobileLayout } from './components/MobileLayout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Onboarding, OnboardingData } from './components/Onboarding';
import PINSetup from './components/PINSetup';
import PINUnlock from './components/PINUnlock';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Packages } from './pages/Packages';
import { Gallery } from './pages/Gallery';
import { WhatsApp } from './pages/WhatsApp';
import { Settings } from './pages/Settings';
import { About } from './pages/About';
import { DeviceControl } from './pages/DeviceControl';

// Animated route wrapper
function AnimatedRoutes() {
  const location = useLocation();
  
  // Force animation re-trigger on route change
  useEffect(() => {
    // Scroll to top on route change
    window.scrollTo(0, 0);
    
    // Re-trigger animations by forcing reflow
    document.body.offsetHeight;
  }, [location.pathname]);

  return (
    <Routes location={location} key={location.pathname}>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/packages"
        element={
          <ProtectedRoute>
            <Packages />
          </ProtectedRoute>
        }
      />
      <Route
        path="/gallery"
        element={
          <ProtectedRoute>
            <Gallery />
          </ProtectedRoute>
        }
      />
      <Route
        path="/whatsapp"
        element={
          <ProtectedRoute>
            <WhatsApp />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/about"
        element={
          <ProtectedRoute>
            <About />
          </ProtectedRoute>
        }
      />
      <Route
        path="/device/:deviceId"
        element={
          <ProtectedRoute>
            <DeviceControl />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function AppContent() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { user, isLoading, needsPinSetup, needsPinUnlock, setupPin } = useAuth();

  useEffect(() => {
    // Check onboarding ONLY on first mount when user exists
    if (user && !isLoading) {
      const onboardingCompleted = localStorage.getItem('onboarding_completed');
      console.log('🎯 Onboarding check:', { completed: onboardingCompleted, user: user.username });
      
      if (onboardingCompleted !== 'true') {
        // Small delay untuk smooth transition
        setTimeout(() => setShowOnboarding(true), 300);
      } else {
        setShowOnboarding(false); // Explicitly set false if completed
      }
    }
  }, [user?.id, isLoading]); // Only re-run if user ID changes or loading state changes

  const handleOnboardingComplete = (data: OnboardingData) => {
    console.log('Onboarding completed:', data);
    setShowOnboarding(false);
    
    // Apply theme preference
    if (data.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (data.theme === 'light') {
      document.documentElement.classList.remove('dark');
    }
  };

  const handlePinSetup = (pin: string) => {
    setupPin(pin);
  };

  const handlePinUnlock = () => {
    // PIN unlock is now handled directly in PINUnlock component
    // This callback just signals successful unlock
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<Login />} />
        
        {/* Protected Routes */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <>
                {/* Show loading state inside protected route */}
                {isLoading && (
                  <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-950 dark:to-blue-950 flex items-center justify-center z-[9999] animate-fade-in">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
                      <p className="text-gray-600 dark:text-gray-400 animate-pulse">Loading...</p>
                    </div>
                  </div>
                )}

                {/* Show PIN unlock screen if needed (only when logged in) */}
                {!isLoading && needsPinUnlock && user && (
                  <PINUnlock onSuccess={handlePinUnlock} />
                )}

                {/* Show PIN setup screen if needed (after login, before onboarding) */}
                {!isLoading && needsPinSetup && user && !needsPinUnlock && (
                  <PINSetup onComplete={handlePinSetup} onSkip={() => setupPin('')} />
                )}

                {/* Show onboarding after PIN setup */}
                {!isLoading && !needsPinSetup && !needsPinUnlock && showOnboarding && (
                  <Onboarding onComplete={handleOnboardingComplete} />
                )}

                {/* Show main app when everything is done */}
                {!isLoading && !needsPinSetup && !needsPinUnlock && !showOnboarding && (
                  <MobileLayout>
                    <ErrorBoundary>
                      <AnimatedRoutes />
                    </ErrorBoundary>
                  </MobileLayout>
                )}
              </>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <AppContent />
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
