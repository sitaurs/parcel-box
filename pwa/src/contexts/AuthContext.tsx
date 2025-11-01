import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { API_BASE_URL } from '../lib/api';

interface User {
  id: string;
  username: string;
  name?: string | null;
  role: string;
  hasPin?: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  loginWithPin: (pin: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  needsNameSetup: boolean;
  needsPinSetup: boolean;
  needsPinUnlock: boolean;
  setupName: (name: string) => Promise<void>;
  setupPin: (pin: string) => Promise<void>;
  updatePin: (oldPin: string, newPin: string) => Promise<boolean>;
  unlockWithPin: (pin: string) => boolean;
  clearPinRequirement: () => void;
  fetchUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to detect mobile devices
function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsNameSetup, setNeedsNameSetup] = useState(false);
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

      console.log('🔐 Auth Init - Mobile:', isMobile, 'Token:', !!token, 'User:', !!savedUser, 'PIN:', !!userPin);

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

      // CRITICAL: Mobile device reload behavior
      if (isMobile) {
        if (!userPin) {
          // No PIN set, require PIN setup
          console.log('📌 Mobile without PIN - require setup');
          setUser(userData);
          setNeedsPinSetup(true);
          setIsLoading(false);
          return;
        }

        // Has PIN - ALWAYS require PIN unlock on reload
        try {
          const pinData = JSON.parse(userPin);
          
          // Verify PIN belongs to this user
          if (pinData.userId !== userData.id) {
            console.log('⚠️ PIN mismatch with user, clearing PIN');
            localStorage.removeItem('userPin');
            setUser(userData);
            setNeedsPinSetup(true);
            setIsLoading(false);
            return;
          }

          // Check inactivity (30 minutes)
          const lastActivityTime = lastActivity ? parseInt(lastActivity) : 0;
          const timeSinceLastActivity = Date.now() - lastActivityTime;

          console.log('📱 Mobile + PIN - Time since activity:', Math.floor(timeSinceLastActivity / 1000 / 60), 'minutes');

          // ALWAYS require PIN on app reload (even if < 30 min)
          // This is THE KEY FIX for "reload harus masukkan PIN"
          console.log('🔒 Mobile reload detected - REQUIRING PIN unlock');
          setNeedsPinUnlock(true);
          setUser(userData); // Set user but keep locked
          setIsLoading(false);
          return;
        } catch (e) {
          console.error('Error parsing PIN data:', e);
          localStorage.removeItem('userPin');
          setUser(userData);
          setNeedsPinSetup(true);
          setIsLoading(false);
          return;
        }
      }

      // Desktop: Direct login without PIN
      console.log('�️ Desktop device - direct login without PIN');
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
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token);
        updateLastActivity();

        // Fetch complete user profile (name, hasPin, etc) from /auth/me
        const profileResponse = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${data.token}`
          }
        });

        let userData = {
          id: data.user.id,
          username: data.user.username,
          role: data.user.role,
          name: null,
          hasPin: false,
        };

        if (profileResponse.ok) {
          userData = await profileResponse.json();
        }

        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));

        // Check if mobile needs name setup
        const isMobile = isMobileDevice();
        if (isMobile && !userData.name) {
          console.log('📝 Name setup required for mobile device');
          setNeedsNameSetup(true);
          return true; // Login successful, but show name setup
        }

        // Check if mobile needs PIN setup (only after name is set)
        const savedPinData = localStorage.getItem('userPin');
        
        if (isMobile && !savedPinData) {
          // Trigger PIN setup flow for first-time mobile users
          console.log('📌 PIN setup required for mobile device');
          setNeedsPinSetup(true);
        } else if (isMobile && savedPinData) {
          // Validate existing PIN belongs to this user
          try {
            const pinData = JSON.parse(savedPinData);
            if (pinData.userId !== userData.id) {
              console.log('⚠️ PIN mismatch, require new PIN setup');
              setNeedsPinSetup(true);
            }
          } catch (e) {
            console.error('Error validating PIN:', e);
            setNeedsPinSetup(true);
          }
        }

        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const setupPin = async (pin: string) => {
    // Simpan PIN (4-6 digit) - PERMANENT, both localStorage AND backend
    if (user) {
      try {
        const token = localStorage.getItem('token');
        
        console.log('💾 Setup PIN - Sending to backend:', {
          pin: pin,
          userId: user.id,
          apiUrl: `${API_BASE_URL}/auth/pin`,
          hasToken: !!token
        });
        
        // Save to backend FIRST (hashed securely)
        const response = await fetch(`${API_BASE_URL}/auth/pin`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ pin })
        });

        const responseData = await response.json();
        console.log('📡 Backend response:', response.status, responseData);

        if (!response.ok) {
          console.error('❌ Failed to save PIN to backend:', responseData);
          throw new Error('Backend PIN save failed: ' + responseData.error);
        }

        console.log('✅ PIN saved to backend successfully!');

        // Then save to localStorage for quick access
        const pinData = {
          pin: pin,
          userId: user.id,
          createdAt: Date.now()
        };
        localStorage.setItem('userPin', JSON.stringify(pinData));
        setNeedsPinSetup(false);
        updateLastActivity();
        console.log('✅ PIN saved locally for user:', user.username, pinData);
      } catch (error: any) {
        console.error('❌ Error saving PIN:', error);
        alert('Failed to save PIN: ' + (error.message || 'Unknown error'));
      }
    } else {
      console.error('❌ Cannot setup PIN: No user logged in!');
    }
  };

  const updatePin = async (oldPin: string, newPin: string): Promise<boolean> => {
    const savedPinData = localStorage.getItem('userPin');
    if (!savedPinData || !user) return false;

    try {
      const pinData = JSON.parse(savedPinData);
      
      // Verify old PIN matches
      if (pinData.pin !== oldPin || pinData.userId !== user.id) {
        console.error('❌ Old PIN mismatch');
        return false;
      }

      const token = localStorage.getItem('token');
      
      // Update backend FIRST
      const response = await fetch(`${API_BASE_URL}/auth/pin`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ pin: newPin })
      });

      if (!response.ok) {
        console.error('❌ Failed to update PIN in backend');
        return false;
      }

      console.log('✅ PIN updated in backend');

      // Then update localStorage
      const newPinData = {
        pin: newPin,
        userId: user.id,
        createdAt: Date.now()
      };
      localStorage.setItem('userPin', JSON.stringify(newPinData));
      console.log('✅ PIN updated locally for user:', user.username);
      return true;
    } catch (e) {
      console.error('❌ Error updating PIN:', e);
      return false;
    }
  };

  const loginWithPin = async (pin: string): Promise<boolean> => {
    const savedPinData = localStorage.getItem('userPin');
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!savedPinData || !savedUser || !token) return false;

    try {
      const pinData = JSON.parse(savedPinData);
      const userData = JSON.parse(savedUser);

      if (pinData.pin === pin && pinData.userId === userData.id) {
        // Validate token still valid
        const tokenData = JSON.parse(atob(token.split('.')[1]));
        const isExpired = tokenData.exp * 1000 < Date.now();
        
        if (isExpired) {
          console.log('⏰ Token expired, cannot login with PIN');
          return false;
        }

        setUser(userData);
        updateLastActivity();
        console.log('✅ Logged in with PIN:', userData.username);
        return true;
      }
    } catch (e) {
      console.error('Error logging in with PIN:', e);
    }
    return false;
  };

  const unlockWithPin = (pin: string): boolean => {
    const savedPinData = localStorage.getItem('userPin');
    const savedUser = localStorage.getItem('user');
    
    console.log('🔓 Unlock attempt - Has PIN data:', !!savedPinData, 'Has user:', !!savedUser);
    
    if (!savedPinData || !savedUser) {
      console.error('❌ Missing PIN data or user data');
      return false;
    }

    try {
      const pinData = JSON.parse(savedPinData);
      const userData = JSON.parse(savedUser);
      
      console.log('🔑 Checking PIN:', { 
        inputPin: pin, 
        savedPin: pinData.pin, 
        match: pinData.pin === pin,
        userId: pinData.userId,
        userIdMatch: pinData.userId === userData.id
      });
      
      if (pinData.pin === pin && pinData.userId === userData.id) {
        console.log('✅ PIN correct! Unlocking...');
        setUser(userData); // Set user data
        setNeedsPinUnlock(false);
        updateLastActivity();
        return true;
      } else {
        console.error('❌ PIN mismatch or user ID mismatch');
      }
    } catch (e) {
      console.error('❌ Error unlocking with PIN:', e);
    }
    return false;
  };

  const clearPinRequirement = () => {
    setNeedsPinUnlock(false);
    logout();
  };

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Check if name setup needed (only on mobile)
        const isMobile = isMobileDevice();
        if (isMobile && !userData.name) {
          console.log('📝 Name setup required');
          setNeedsNameSetup(true);
        }
        
        console.log('✅ User profile fetched:', userData);
      }
    } catch (error) {
      console.error('❌ Fetch profile error:', error);
    }
  };

  const setupName = async (name: string) => {
    if (!user) {
      throw new Error('No user logged in');
    }

    try {
      const token = localStorage.getItem('token');
      
      console.log('💾 Setup Name - Sending to backend:', {
        name,
        userId: user.id,
        apiUrl: `${API_BASE_URL}/auth/profile`,
        hasToken: !!token
      });

      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name })
      });

      const responseData = await response.json();
      console.log('📡 Backend response:', response.status, responseData);

      if (!response.ok) {
        console.error('❌ Failed to save name to backend:', responseData);
        throw new Error(responseData.error || 'Gagal menyimpan nama ke server');
      }

      console.log('✅ Name saved to backend successfully!');

      // Update local user state
      const updatedUser = {
        ...user,
        name: name
      };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setNeedsNameSetup(false);
      
      console.log('✅ Name saved locally for user:', user.username);
    } catch (error: any) {
      console.error('❌ Error saving name:', error);
      // Provide user-friendly error message
      if (error.message === 'Failed to fetch') {
        throw new Error('Tidak dapat terhubung ke server. Periksa koneksi internet Anda.');
      }
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setNeedsNameSetup(false);
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
        loginWithPin,
        logout,
        isAuthenticated: !!user,
        isLoading,
        needsNameSetup,
        needsPinSetup,
        needsPinUnlock,
        setupName,
        setupPin,
        updatePin,
        unlockWithPin,
        clearPinRequirement,
        fetchUserProfile,
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
