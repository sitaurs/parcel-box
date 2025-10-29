import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  username: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  needsPinSetup: boolean;
  needsPinUnlock: boolean;
  setupPin: (pin: string) => void;
  unlockWithPin: (pin: string) => boolean;
  clearPinRequirement: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to detect mobile devices
function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsPinSetup, setNeedsPinSetup] = useState(false);
  const [needsPinUnlock, setNeedsPinUnlock] = useState(false);

  useEffect(() => {
    // Initialize auth state on mount
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      const userPin = localStorage.getItem('userPin');
      const lastActivity = localStorage.getItem('lastActivity');
      const isMobile = isMobileDevice();

      console.log('🔐 Auth Init - Token exists:', !!token, 'User exists:', !!savedUser);

      if (!token || !savedUser) {
        console.log('❌ No token or user found, staying logged out');
        setIsLoading(false);
        return;
      }

      // Validate token is not expired
      try {
        const tokenData = JSON.parse(atob(token.split('.')[1]));
        const expiryDate = new Date(tokenData.exp * 1000);
        const isExpired = tokenData.exp * 1000 < Date.now();
        
        console.log('🔑 Token expiry:', expiryDate.toLocaleString(), 'Expired:', isExpired);
        
        if (isExpired) {
          // Token expired, clear auth
          console.log('⏰ Token expired, logging out');
          logout();
          setIsLoading(false);
          return;
        }
      } catch (e) {
        console.error('❌ Invalid token format:', e);
        logout();
        setIsLoading(false);
        return;
      }

      const userData = JSON.parse(savedUser);
      console.log('✅ Valid token found for user:', userData.username);

      // Check if user needs PIN unlock (mobile only)
      if (isMobile && userPin) {
        const lastActivityTime = lastActivity ? parseInt(lastActivity) : 0;
        const timeSinceLastActivity = Date.now() - lastActivityTime;
        const thirtyMinutes = 30 * 60 * 1000;

        console.log('📱 Mobile + PIN - Time since activity:', Math.floor(timeSinceLastActivity / 1000 / 60), 'minutes');

        // Require PIN if app was inactive for more than 30 minutes
        if (timeSinceLastActivity > thirtyMinutes) {
          console.log('🔒 Requiring PIN unlock (inactive > 30 min)');
          setNeedsPinUnlock(true);
          setUser(userData); // Set user but keep locked
          setIsLoading(false);
          return;
        }
      }

      // DON'T check for PIN setup during init - only after fresh login
      // This prevents PIN setup screen from showing on app reload
      console.log('🚀 User authenticated, restoring session');

      setUser(userData);
      updateLastActivity();
    } catch (error) {
      console.error('❌ Auth initialization error:', error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  const updateLastActivity = () => {
    localStorage.setItem('lastActivity', Date.now().toString());
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        const userData = {
          id: data.user.id,
          username: data.user.username,
          role: data.user.role,
        };
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', data.token);
        updateLastActivity();

        // Check if mobile needs PIN setup (only after first login)
        const isMobile = isMobileDevice();
        const userPin = localStorage.getItem('userPin');
        if (isMobile && !userPin) {
          // Trigger PIN setup flow for first-time mobile users
          console.log('📌 PIN setup required for mobile device');
          setNeedsPinSetup(true);
        }

        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const setupPin = (pin: string) => {
    // Simpan PIN (6 digit)
    localStorage.setItem('userPin', pin);
    setNeedsPinSetup(false);
    updateLastActivity();
  };

  const unlockWithPin = (pin: string): boolean => {
    const savedPin = localStorage.getItem('userPin');
    if (savedPin === pin) {
      setNeedsPinUnlock(false);
      updateLastActivity();
      return true;
    }
    return false;
  };

  const clearPinRequirement = () => {
    setNeedsPinUnlock(false);
    logout();
  };

  const logout = () => {
    setUser(null);
    setNeedsPinSetup(false);
    setNeedsPinUnlock(false);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('lastActivity');
    // Don't remove userPin - keep it for next login
  };

  // Update last activity on user interaction
  useEffect(() => {
    if (user && !needsPinUnlock) {
      const handleActivity = () => updateLastActivity();
      
      window.addEventListener('click', handleActivity);
      window.addEventListener('keydown', handleActivity);
      window.addEventListener('scroll', handleActivity);
      window.addEventListener('touchstart', handleActivity);

      return () => {
        window.removeEventListener('click', handleActivity);
        window.removeEventListener('keydown', handleActivity);
        window.removeEventListener('scroll', handleActivity);
        window.removeEventListener('touchstart', handleActivity);
      };
    }
  }, [user, needsPinUnlock]);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
        isLoading,
        needsPinSetup,
        needsPinUnlock,
        setupPin,
        unlockWithPin,
        clearPinRequirement,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
