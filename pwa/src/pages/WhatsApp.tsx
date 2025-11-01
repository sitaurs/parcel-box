import { useEffect, useState, useRef } from 'react';
import { Play, Square, Loader, Trash2, Clock, Bell, Plus, X, Send } from 'lucide-react';
import { waSocket } from '../lib/socket';
import * as waApi from '../lib/whatsapp-api';

interface LogEntry {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

interface WhatsAppSettings {
  enabled: boolean;
  recipients: string[];
}

export function WhatsApp() {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [status, setStatus] = useState<{
    connected: boolean;
    me?: string;
    error?: string;
    message?: string;
    blocked?: boolean;
    retryAt?: number;
    syncing?: boolean;
  }>({ connected: false });
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [socketConnected, setSocketConnected] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Notification settings state
  const [settings, setSettings] = useState<WhatsAppSettings>({
    enabled: false,
    recipients: []
  });
  const [newRecipient, setNewRecipient] = useState('');
  const [testMessage, setTestMessage] = useState('');
  const [sending, setSending] = useState(false);

  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    const timestamp = new Date().toLocaleTimeString('id-ID');
    setLogs((prev) => [...prev, { timestamp, message, type }].slice(-20));
  };

  // Load notification settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Try to load from backend API first
        const apiUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1';
        const response = await fetch(`${apiUrl}/wa/settings`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setSettings(data);
          addLog('✅ Settings loaded from backend', 'success');
          return;
        }
      } catch (error) {
        console.log('Failed to load from backend, trying localStorage', error);
      }

      // Fallback to localStorage
      const stored = localStorage.getItem('whatsapp-settings');
      if (stored) {
        try {
          const data = JSON.parse(stored);
          setSettings(data);
          addLog('✅ Settings loaded from localStorage', 'success');
        } catch (error) {
          console.error('Error loading WhatsApp settings:', error);
        }
      }
    };

    loadSettings();
  }, []);

  async function saveSettings(newSettings: WhatsAppSettings) {
    try {
      // Save to backend API
      const apiUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1';
      const response = await fetch(`${apiUrl}/wa/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newSettings)
      });

      if (!response.ok) {
        throw new Error('Failed to save to backend');
      }

      addLog('✅ Settings saved to backend', 'success');
    } catch (error) {
      console.error('Error saving to backend:', error);
      addLog('⚠️ Saved to localStorage only', 'warning');
    }

    // Always save to localStorage as backup
    localStorage.setItem('whatsapp-settings', JSON.stringify(newSettings));
    setSettings(newSettings);
  }

  function toggleEnabled() {
    const newSettings = { ...settings, enabled: !settings.enabled };
    saveSettings(newSettings);
  }

  function addRecipient() {
    const cleaned = newRecipient.trim();
    if (!cleaned) {
      addLog('❌ Please enter a phone number', 'error');
      return;
    }

    if (!/^\d{10,15}$/.test(cleaned)) {
      addLog('❌ Invalid format. Use: 628123456789', 'error');
      return;
    }

    if (settings.recipients.includes(cleaned)) {
      addLog('⚠️  Recipient already exists', 'warning');
      return;
    }

    const newSettings = {
      ...settings,
      recipients: [...settings.recipients, cleaned]
    };
    saveSettings(newSettings);
    setNewRecipient('');
    addLog(`✅ Added recipient: ${cleaned}`, 'success');
  }

  function removeRecipient(phone: string) {
    const newSettings = {
      ...settings,
      recipients: settings.recipients.filter(r => r !== phone)
    };
    saveSettings(newSettings);
    addLog(`🗑️ Removed recipient: ${phone}`, 'info');
  }

  async function sendTestMessage() {
    if (!testMessage.trim()) {
      addLog('❌ Please enter a test message', 'error');
      return;
    }

    if (settings.recipients.length === 0) {
      addLog('❌ Please add at least one recipient', 'error');
      return;
    }

    if (!status.connected) {
      addLog('❌ WhatsApp not connected', 'error');
      return;
    }

    setSending(true);
    try {
      const apiUrl = import.meta.env.VITE_WA_API_URL || 'http://13.213.57.228:3001';
      
      addLog(`📤 Sending test message to ${settings.recipients.length} recipient(s)...`, 'info');
      
      const promises = settings.recipients.map(async (phone) => {
        const response = await fetch(`${apiUrl}/api/send-message`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone,
            message: `🧪 *Test Message*\n\n${testMessage}\n\n_Sent from Smart Parcel PWA_`
          })
        });

        if (!response.ok) {
          throw new Error(`Failed to send to ${phone}`);
        }

        return response.json();
      });

      // Use Promise.allSettled for better error handling - some messages can fail without breaking all
      const results = await Promise.allSettled(promises);
      const succeeded = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      if (succeeded > 0) {
        addLog(`✅ Test message sent to ${succeeded} of ${settings.recipients.length} recipient(s)!`, 'success');
      }
      if (failed > 0) {
        addLog(`⚠️ Failed to send to ${failed} recipient(s)`, 'warning');
      }
      setTestMessage('');
    } catch (error) {
      console.error('Error sending test message:', error);
      addLog('❌ Failed to send test message', 'error');
    } finally {
      setSending(false);
    }
  }

  useEffect(() => {
    // Connect to WhatsApp backend socket
    addLog('🔌 Connecting to WhatsApp backend...', 'info');
    waSocket.connect();
    
    // Track last status to prevent duplicate logs
    let lastStatusString = '';
    
    // Define handlers with stable references
    const handleWAStatus = (data: { 
      connected: boolean; 
      me?: string; 
      error?: string;
      message?: string;
      blocked?: boolean;
      retryAt?: number;
      syncing?: boolean;
    }) => {
      console.log('📡 WhatsApp status update:', data);
      
      // Deduplicate status messages
      const statusString = JSON.stringify(data);
      if (statusString === lastStatusString) {
        return; // Skip duplicate
      }
      lastStatusString = statusString;
      
  setStatus(data);
      
      if (data.connected && data.me) {
        setQrCode(null);
        setPairingCode(null);
        addLog(`✅ WhatsApp connected! (${data.me})`, 'success');
      } else if (data.error) {
        addLog(`❌ Error: ${data.error}`, 'error');
      } else if (data.syncing) {
        addLog(`🔄 ${data.message || 'Syncing...'}`, 'info');
      } else if (data.message && data.message !== 'Session cleared') {
        // Only log meaningful messages
        addLog(`ℹ️ ${data.message}`, 'info');
      }
      // Don't log every disconnection - too spammy
      
      setLoading(false);
    };

    const handleConnectionStatus = (data: { connected: boolean }) => {
      console.log('🔌 Socket connection:', data.connected);
      setSocketConnected(data.connected);
      
      if (data.connected) {
        addLog('✅ WebSocket connected to WhatsApp backend', 'success');
      } else {
        addLog('⚠️ WebSocket disconnected', 'warning');
      }
    };

    const handlePairingCode = (data: { code: string }) => {
      console.log('🔐 Pairing code received:', data);
      setPairingCode(data.code);
      setQrCode(null); // Clear QR when pairing code arrives
      setLoading(false);
      addLog(`🔐 Pairing code generated: ${data.code}`, 'success');
    };

    // Add listeners (QR removed - pairing code only)
    waSocket.on('wa_status', handleWAStatus);
    waSocket.on('wa_connection_status', handleConnectionStatus);
    waSocket.on('pairing_code', handlePairingCode);

    // Initial socket status
    setSocketConnected(waSocket.isConnected());

    return () => {
      waSocket.off('wa_status', handleWAStatus);
      waSocket.off('wa_connection_status', handleConnectionStatus);
      waSocket.off('pairing_code', handlePairingCode);
    };
  }, []);

  // Auto-scroll logs only if user is near bottom
  useEffect(() => {
    const logsContainer = logsEndRef.current?.parentElement;
    if (!logsContainer) return;

    const isNearBottom = logsContainer.scrollHeight - logsContainer.scrollTop - logsContainer.clientHeight < 100;
    
    // Only auto-scroll if user is already near the bottom (within 100px)
    if (isNearBottom) {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  async function handleStart() {
    if (!socketConnected) {
      addLog('❌ WebSocket not connected! Please wait...', 'error');
      return;
    }
    
    // Prevent double-click
    if (loading) {
      addLog('⚠️ Request already in progress, please wait...', 'warning');
      return;
    }
    
    // Check if already connected
    if (status.connected) {
      addLog('✅ WhatsApp already connected!', 'success');
      return;
    }
    
    // No longer need to show popup - phone input is always visible on page
    addLog('💡 Enter your phone number above to get pairing code', 'info');
  }

  async function handleRequestPairingCode() {
    if (!phoneNumber.trim()) {
      addLog('❌ Please enter phone number', 'error');
      return;
    }

    // Validate phone format (remove spaces, dashes)
    const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
    if (!/^\d{10,15}$/.test(cleanPhone)) {
      addLog('❌ Invalid phone number format (10-15 digits)', 'error');
      return;
    }
    
    setLoading(true);
    setPairingCode(null);
    setQrCode(null);
    
    try {
      // Start with phone number - backend will auto-generate pairing code
      await waApi.startWhatsApp(cleanPhone);
      addLog(`✅ Requesting pairing code for ${cleanPhone}...`, 'success');
    } catch (error: any) {
      addLog(`❌ Error: ${error.message}`, 'error');
      setLoading(false);
    }
    
    // Fallback: Reset loading after 30s if no response
    setTimeout(() => {
      setLoading(false);
    }, 30000);
  }

  async function handleStop() {
    // Prevent double-click
    if (loading) {
      return;
    }
    
    if (confirm('Stop WhatsApp connection? (Session akan preserved untuk reconnect)')) {
      setLoading(true);
      addLog('⏹️ Stopping WhatsApp connection...', 'warning');
      
      try {
        await waApi.stopWhatsApp();
        addLog('✅ WhatsApp stopped successfully', 'success');
      } catch (error: any) {
        addLog(`❌ Error: ${error.message}`, 'error');
      } finally {
        setLoading(false);
      }
    }
  }

  async function handleClearSession() {
    // Prevent double-click
    if (loading) {
      return;
    }
    
    if (confirm('⚠️ Clear session? Ini akan logout dan hapus semua auth data!')) {
      try {
        setLoading(true);
        addLog('🗑️ Clearing WhatsApp session...', 'warning');
        
        await waApi.clearSession();
        
        setQrCode(null);
        setPairingCode(null);
        setStatus({ connected: false });
        addLog('✅ Session cleared successfully', 'success');
      } catch (error: any) {
        addLog(`❌ Error: ${error.message}`, 'error');
      } finally {
        setLoading(false);
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-3">
            WhatsApp Integration
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Connect your WhatsApp to receive real-time package notifications
          </p>
        </div>

        {/* Connection Status Banner */}
        <div className={`rounded-xl shadow-lg p-6 ${
          socketConnected 
            ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' 
            : 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {socketConnected ? (
                <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
              ) : (
                <div className="w-3 h-3 bg-white rounded-full opacity-50"></div>
              )}
              <span className="font-semibold text-lg">
                {socketConnected ? 'Backend Connected' : 'Backend Disconnected'}
              </span>
            </div>
            {status.connected && status.me && (
              <div className="text-right">
                <p className="text-sm opacity-90">Logged in as</p>
                <p className="font-bold">{status.me}</p>
              </div>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column - Controls & QR */}
          <div className="space-y-6">
            {/* Status Card */}
            <div className="card bg-white dark:bg-gray-800 shadow-xl rounded-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Connection Status</h2>
                <span
                  className={`px-4 py-2 rounded-full text-sm font-bold shadow-md ${
                    status.connected
                      ? 'bg-green-500 text-white animate-pulse'
                      : 'bg-gray-300 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  {status.connected ? '● Connected' : '○ Disconnected'}
                </span>
              </div>

              {/* Cooldown banner if blocked */}
              {status.blocked && (
                <BlockedNotice retryAt={status.retryAt} />
              )}

              {/* Syncing Progress Banner */}
              {status.syncing && !status.connected && (
                <div className="mb-6 p-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl text-white animate-pulse">
                  <div className="flex items-center space-x-3">
                    <Loader className="w-6 h-6 animate-spin" />
                    <div className="flex-1">
                      <p className="font-bold text-lg">Syncing...</p>
                      <p className="text-sm opacity-90">
                        {status.message || 'Syncing messages and contacts from your phone'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 bg-white bg-opacity-20 rounded-full h-2 overflow-hidden">
                    <div className="bg-white h-full rounded-full animate-progress" style={{width: '100%', animation: 'progress 2s ease-in-out infinite'}}></div>
                  </div>
                </div>
              )}

              {/* Phone Number Input - Untuk Pairing Code */}
              {!status.connected && (
                <div className="mb-6 p-5 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-800 rounded-2xl border-2 border-blue-200 dark:border-gray-600">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                      <span className="text-2xl">📱</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white">Link with Phone Number</h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Get pairing code for your WhatsApp</p>
                    </div>
                  </div>
                  
                  <input
                    type="tel"
                    placeholder="628123456789 (country code + number, no +)"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full px-4 py-3 mb-3 border-2 border-blue-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-center font-mono text-lg"
                    disabled={loading || status.connected}
                  />
                  
                  <button
                    onClick={handleRequestPairingCode}
                    disabled={loading || !phoneNumber.trim() || phoneNumber.length < 10 || status.connected}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        <span>Generating Code...</span>
                      </>
                    ) : (
                      <>
                        <span>🔐</span>
                        <span>Get Pairing Code</span>
                      </>
                    )}
                  </button>
                  
                  {pairingCode && (
                    <div className="mt-4 p-4 bg-green-100 dark:bg-green-900/30 border-2 border-green-500 rounded-xl text-center">
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">Your Pairing Code:</p>
                      <p className="text-3xl font-bold text-green-600 dark:text-green-400 tracking-widest font-mono">{pairingCode}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">Enter this code in WhatsApp → Linked Devices</p>
                    </div>
                  )}
                </div>
              )}

              {/* Pairing Input Modal - REMOVED, now inline above */}

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleStart}
                  disabled={loading || status.connected || !socketConnected || !!status.blocked}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center"
                >
                  {loading ? (
                    <Loader className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <Play className="w-5 h-5 mr-2" />
                  )}
                  Start Connection
                </button>
                <button
                  onClick={handleStop}
                  disabled={loading || !status.connected}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center"
                >
                  <Square className="w-5 h-5 mr-2" />
                  Stop
                </button>
                <button
                  onClick={handleClearSession}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center"
                >
                  <Trash2 className="w-5 h-5 mr-2" />
                  Clear Session
                </button>
              </div>
              
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20 rounded-xl">
                <p className="text-xs text-blue-800 dark:text-blue-300">
                  <strong>Start:</strong> Mulai koneksi WhatsApp<br/>
                  <strong>Stop:</strong> Tutup koneksi (session preserved)<br/>
                  <strong>Clear Session:</strong> Logout + hapus auth (scan QR lagi)
                </p>
              </div>
            </div>

            {/* Pairing Code Card */}
            {pairingCode && (
              <div className="card bg-white dark:bg-gray-800 shadow-xl rounded-2xl">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
                  🔐 Pairing Code
                </h2>
                <div className="flex flex-col items-center">
                  <div className="bg-gradient-to-br from-green-400 to-emerald-500 p-8 rounded-2xl shadow-2xl border-4 border-green-600">
                    <p className="text-7xl font-bold text-white tracking-widest font-mono">
                      {pairingCode}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(pairingCode);
                      addLog('📋 Pairing code copied to clipboard', 'success');
                    }}
                    className="mt-4 px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold shadow-md transition-all"
                  >
                    📋 Copy Code
                  </button>
                  <div className="mt-6 p-4 bg-green-50 dark:bg-green-900 dark:bg-opacity-20 rounded-xl text-center max-w-md">
                    <p className="text-sm text-green-800 dark:text-green-300 font-semibold mb-2">
                      Enter this code on your phone:
                    </p>
                    <ol className="text-xs text-green-700 dark:text-green-400 text-left space-y-1">
                      <li>1. Open WhatsApp on your phone</li>
                      <li>2. Go to <strong>Settings → Linked Devices</strong></li>
                      <li>3. Tap <strong>Link a Device</strong></li>
                      <li>4. Choose <strong>Link with phone number</strong></li>
                      <li>5. Enter the code above</li>
                    </ol>
                  </div>
                </div>
              </div>
            )}

            {/* Info Card */}
            {!status.connected && !qrCode && !pairingCode && !loading && (
              <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900 dark:to-indigo-900 dark:bg-opacity-20 border-2 border-blue-300 dark:border-blue-700 shadow-xl rounded-2xl">
                <h3 className="text-xl font-bold mb-4 text-blue-900 dark:text-blue-300">
                  📋 How to Connect
                </h3>
                <ol className="list-decimal list-inside space-y-3 text-sm text-blue-800 dark:text-blue-200">
                  <li className="font-semibold">Click the "Start Connection" button</li>
                  <li>Wait for the pairing code or QR code to appear (5-10 seconds)</li>
                  <li>Open WhatsApp on your phone</li>
                  <li>Go to <span className="font-mono bg-blue-200 dark:bg-blue-800 px-2 py-1 rounded">Settings → Linked Devices</span></li>
                  <li>Tap <span className="font-mono bg-blue-200 dark:bg-blue-800 px-2 py-1 rounded">Link a Device</span></li>
                  <li><strong>Pairing Code:</strong> Choose "Link with phone number" and enter the code</li>
                  <li><strong>QR Code:</strong> Scan the QR code displayed on this page</li>
                </ol>
                <div className="mt-4 p-3 bg-yellow-100 dark:bg-yellow-900 dark:bg-opacity-30 rounded-lg">
                  <p className="text-xs text-yellow-800 dark:text-yellow-300">
                    ⚠️ Pastikan backend-whatsapp service sudah running di port 3001
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Logs */}
          <div className="space-y-6">
            {/* Activity Logs */}
            <div className="card bg-white dark:bg-gray-800 shadow-xl rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">📜 Activity Log</h2>
                <button
                  onClick={() => setLogs([])}
                  className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Clear
                </button>
              </div>
              
              <div className="bg-gray-900 dark:bg-black rounded-xl p-4 max-h-[600px] overflow-y-auto font-mono text-xs shadow-inner">
                {logs.length === 0 ? (
                  <div className="text-gray-500 text-center py-8">
                    No activity yet. Start WhatsApp to see logs...
                  </div>
                ) : (
                  logs.map((log, idx) => (
                    <div
                      key={idx}
                      className={`mb-2 flex items-start space-x-2 ${
                        log.type === 'error'
                          ? 'text-red-400'
                          : log.type === 'success'
                          ? 'text-green-400'
                          : log.type === 'warning'
                          ? 'text-yellow-400'
                          : 'text-gray-400'
                      }`}
                    >
                      <span className="text-gray-600 min-w-[70px] select-none">
                        [{log.timestamp}]
                      </span>
                      <span className="flex-1">{log.message}</span>
                    </div>
                  ))
                )}
                <div ref={logsEndRef} />
              </div>
            </div>

            {/* Notification Settings */}
            <div className="card bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900 dark:to-emerald-900 dark:bg-opacity-20 border-2 border-green-300 dark:border-green-700 shadow-xl rounded-2xl">
              <h3 className="text-xl font-bold mb-4 text-green-900 dark:text-green-300 flex items-center">
                <Bell className="w-6 h-6 mr-2" />
                📢 Notification Settings
              </h3>
              
              {/* Enable Toggle */}
              <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl mb-4">
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">Enable Notifications</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Send package updates via WhatsApp</p>
                </div>
                <button
                  onClick={toggleEnabled}
                  className={`relative w-14 h-8 rounded-full transition-all ${
                    settings.enabled ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <div
                    className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${
                      settings.enabled ? 'transform translate-x-6' : ''
                    }`}
                  />
                </button>
              </div>

              {/* Recipients */}
              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Recipients ({settings.recipients.length})
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="tel"
                    value={newRecipient}
                    onChange={(e) => setNewRecipient(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addRecipient()}
                    placeholder="628123456789"
                    className="flex-1 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white"
                  />
                  <button
                    onClick={addRecipient}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all flex items-center space-x-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add</span>
                  </button>
                </div>

                {/* Recipients List */}
                {settings.recipients.length > 0 && (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {settings.recipients.map((phone, index) => (
                      <div
                        key={phone}
                        className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex items-center space-x-2">
                          <span className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 text-xs font-bold">
                            {index + 1}
                          </span>
                          <span className="text-gray-900 dark:text-white font-mono text-sm">+{phone}</span>
                        </div>
                        <button
                          onClick={() => removeRecipient(phone)}
                          className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Test Message */}
            <div className="card bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900 dark:to-cyan-900 dark:bg-opacity-20 border-2 border-blue-300 dark:border-blue-700 shadow-xl rounded-2xl">
              <h3 className="text-xl font-bold mb-4 text-blue-900 dark:text-blue-300 flex items-center">
                <Send className="w-6 h-6 mr-2" />
                🧪 Test Message
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Message Content
                  </label>
                  <textarea
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    placeholder="Type your test message here..."
                    rows={3}
                    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white resize-none"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Will be sent to all {settings.recipients.length} recipient(s)
                  </p>
                </div>

                <button
                  onClick={sendTestMessage}
                  disabled={sending || settings.recipients.length === 0 || !testMessage.trim() || !status.connected}
                  className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold rounded-lg hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
                >
                  {sending ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Send Test Message</span>
                    </>
                  )}
                </button>

                {!status.connected && (
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    ⚠️ WhatsApp must be connected to send messages
                  </p>
                )}
              </div>
            </div>

            {/* System Info */}
            <div className="card bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900 dark:to-pink-900 dark:bg-opacity-20 border-2 border-purple-300 dark:border-purple-700 shadow-xl rounded-2xl">
              <h3 className="text-xl font-bold mb-4 text-purple-900 dark:text-purple-300">
                🔧 System Info
              </h3>
              <div className="space-y-2 text-sm text-purple-800 dark:text-purple-200">
                <div className="flex justify-between">
                  <span className="font-semibold">Backend Status:</span>
                  <span className={socketConnected ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                    {socketConnected ? '● Online' : '○ Offline'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">WhatsApp Status:</span>
                  <span className={status.connected ? 'text-green-600 font-bold' : 'text-gray-600'}>
                    {status.connected ? '● Connected' : '○ Disconnected'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Backend URL:</span>
                  <span className="font-mono text-xs">localhost:3001</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Small component to show block cooldown
function BlockedNotice({ retryAt }: { retryAt?: number }) {
  const [remaining, setRemaining] = useState<string>('');

  useEffect(() => {
    function update() {
      if (!retryAt) { setRemaining(''); return; }
      const ms = retryAt - Date.now();
      if (ms <= 0) { setRemaining(''); return; }
      const m = Math.floor(ms / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      setRemaining(`${m}m ${s}s`);
    }
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [retryAt]);

  if (!retryAt || remaining === '') return null;

  return (
    <div className="w-full mb-4 p-3 rounded-xl bg-gradient-to-r from-amber-500 to-red-500 text-white shadow-md flex items-center">
      <Clock className="w-5 h-5 mr-2" />
      <span className="font-semibold">Blocked by WhatsApp.</span>
      <span className="ml-2">Try again in</span>
      <span className="ml-2 font-bold">{remaining}</span>
    </div>
  );
}

export default WhatsApp;
