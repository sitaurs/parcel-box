import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Camera, Zap, Volume2, Lock, Play, Square, Settings as SettingsIcon,
  Activity, Wifi, WifiOff, Save, RotateCcw, AlertCircle
} from 'lucide-react';
import * as api from '../lib/api';
import { socket } from '../lib/socket';

interface DeviceSettings {
  ultra: {
    min: number;
    max: number;
  };
  lock: {
    ms: number;
  };
  buzzer: {
    ms: number;
  };
}

interface SensorData {
  cm: number;
  timestamp: string;
}

export function DeviceControl() {
  const { deviceId } = useParams<{ deviceId: string }>();
  
  const [device, setDevice] = useState<api.Device | null>(null);
  const [settings, setSettings] = useState<DeviceSettings>({
    ultra: { min: 12, max: 25 },
    lock: { ms: 5000 },
    buzzer: { ms: 60000 }
  });
  const [tempSettings, setTempSettings] = useState<DeviceSettings>(settings);
  const [sensorData, setSensorData] = useState<SensorData | null>(null);
  const [lastAck, setLastAck] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'control' | 'settings'>('control');
  const [error, setError] = useState<string | null>(null);

  // Load device data
  useEffect(() => {
    if (!deviceId) {
      setError('Device ID is missing');
      return;
    }
    
    const loadDevice = async () => {
      try {
        const devices = await api.getDevices();
        const dev = devices.find(d => d.id === deviceId);
        if (dev) {
          setDevice(dev);
        } else {
          setError(`Device "${deviceId}" not found`);
        }
      } catch (err) {
        console.error('Failed to load device:', err);
        setError('Failed to load device data');
      }
    };

    loadDevice();

    // Subscribe to MQTT topics
    socket.connect();
    
    const handleDistance = (data: any) => {
      try {
        if (!data || typeof data !== 'object') return;
        
        // Support multiple field names: deviceId, device_id, id
        const dataDeviceId = data.deviceId || data.device_id || data.id;
        
        // Support multiple distance field names: distance, cm
        const distanceValue = data.distance !== undefined ? data.distance : data.cm;
        
        if (dataDeviceId === deviceId && typeof distanceValue === 'number') {
          setSensorData({ cm: distanceValue, timestamp: new Date().toISOString() });
        }
      } catch (err) {
        console.error('Error handling distance update:', err);
      }
    };

    const handleSettings = (data: any) => {
      try {
        if (!data || typeof data !== 'object') return;
        const dataDeviceId = data.deviceId || data.device_id || data.id;
        if (dataDeviceId === deviceId && data.ultra) {
          setSettings(data);
          setTempSettings(data);
        }
      } catch (err) {
        console.error('Error handling settings update:', err);
      }
    };

    const handleControlAck = (data: any) => {
      try {
        if (!data || typeof data !== 'object') return;
        const dataDeviceId = data.deviceId || data.device_id || data.id;
        if (dataDeviceId === deviceId) {
          setLastAck(data);
          setTimeout(() => setLastAck(null), 3000);
        }
      } catch (err) {
        console.error('Error handling control ack:', err);
      }
    };

    socket.on('distance_update', handleDistance);
    socket.on('current_settings', handleSettings);
    socket.on('control_ack', handleControlAck);
    socket.on('settings_ack', handleControlAck); // Same handler for settings ack

    return () => {
      socket.off('distance_update', handleDistance);
      socket.off('current_settings', handleSettings);
      socket.off('control_ack', handleControlAck);
      socket.off('settings_ack', handleControlAck);
    };
  }, [deviceId]);

  // Send control command
  const sendControl = async (command: any) => {
    if (!deviceId) return;
    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1';
      const response = await fetch(`${apiUrl}/devices/${deviceId}/control`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(command)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      console.log('✅ Control sent:', command);
    } catch (error) {
      console.error('❌ Control error:', error);
      setLastAck({ ok: false, action: 'control', error: String(error) });
    } finally {
      setLoading(false);
    }
  };

  // Apply settings
  const applySettings = async () => {
    if (!deviceId) return;
    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1';
      const response = await fetch(`${apiUrl}/devices/${deviceId}/settings`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ ...tempSettings, apply: true })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      setSettings(tempSettings);
      console.log('✅ Settings applied:', tempSettings);
      setLastAck({ ok: true, action: 'settings', state: 'applied' });
    } catch (error) {
      console.error('❌ Settings error:', error);
      setLastAck({ ok: false, action: 'settings', error: String(error) });
    } finally {
      setLoading(false);
    }
  };

  const isOnline = device?.status === 'online';
  const inDetectionRange = sensorData && 
    typeof sensorData.cm === 'number' && 
    !isNaN(sensorData.cm) &&
    sensorData.cm >= settings.ultra.min && 
    sensorData.cm <= settings.ultra.max;

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg max-w-md w-full text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Error Loading Device</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-72 h-72 md:w-96 md:h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 md:w-96 md:h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 md:w-96 md:h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
        {/* Page Header with Enhanced Glassmorphism */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 md:p-8 shadow-2xl animate-fade-in-down">
          <div className="absolute inset-0 bg-white/10 backdrop-blur-xl"></div>
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center animate-bounce-in shadow-xl">
                  <SettingsIcon className="w-7 h-7 md:w-8 md:h-8 text-white animate-spin-slow" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-1 animate-slide-in-left">
                    Device Control
                  </h1>
                  <p className="text-white/80 text-xs md:text-sm flex items-center animate-fade-in-up stagger-1">
                    <span className={`w-2 h-2 rounded-full mr-2 ${isOnline ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></span>
                    {device?.name || deviceId} • ESP32-CAM Controller
                  </p>
                </div>
              </div>
              
              {/* Connection Badge */}
              <div className={`px-4 py-2 rounded-full backdrop-blur-sm border-2 flex items-center space-x-2 animate-scale-in-center shadow-lg ${
                isOnline 
                  ? 'bg-green-500/20 border-green-400/50' 
                  : 'bg-gray-500/20 border-gray-400/50'
              }`}>
                {isOnline ? (
                  <>
                    <Wifi className="w-5 h-5 text-green-300 animate-pulse" />
                    <span className="font-semibold text-white text-sm">Online</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-5 h-5 text-gray-300" />
                    <span className="font-semibold text-white text-sm">Offline</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

      {/* Status Bar with Glassmorphism */}
      <div className="backdrop-blur-md bg-white/10 dark:bg-gray-800/30 rounded-3xl p-6 shadow-2xl border border-white/20 dark:border-gray-700/30 animate-fade-in-up">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Distance Sensor Card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 p-6 border border-white/30">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <span className="text-white/80 text-sm font-semibold uppercase tracking-wider">Distance Sensor</span>
                <Activity className="w-5 h-5 text-indigo-300" />
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-5xl font-bold text-white">
                  {sensorData ? sensorData.cm.toFixed(1) : '--'}
                </span>
                <span className="text-2xl text-white/60 font-medium">cm</span>
              </div>
              {inDetectionRange && (
                <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full bg-green-500/30 border border-green-400/50 animate-pulse">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-ping"></span>
                  <span className="text-green-100 text-xs font-semibold">In Detection Range</span>
                </div>
              )}
              {sensorData && !inDetectionRange && (
                <div className="mt-3 text-white/60 text-xs">
                  Range: {settings.ultra.min}-{settings.ultra.max} cm
                </div>
              )}
            </div>
          </div>

          {/* Device Status Card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500/20 via-emerald-500/20 to-teal-500/20 p-6 border border-white/30">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <span className="text-white/80 text-sm font-semibold uppercase tracking-wider">Connection Status</span>
                {isOnline ? (
                  <Wifi className="w-5 h-5 text-green-300 animate-pulse" />
                ) : (
                  <WifiOff className="w-5 h-5 text-red-300" />
                )}
              </div>
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded-full ${isOnline ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
                <span className="text-3xl font-bold text-white">
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
              <div className="mt-3 text-white/60 text-xs">
                ESP32-CAM Device
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Tabs */}
      <div className="flex gap-3 p-2 backdrop-blur-md bg-white/10 dark:bg-gray-800/30 rounded-2xl border border-white/20">
        <button
          onClick={() => setActiveTab('control')}
          className={`flex-1 py-4 px-6 rounded-xl font-bold transition-all duration-300 relative overflow-hidden ${
            activeTab === 'control'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xl scale-105'
              : 'text-white/60 hover:text-white/80 hover:bg-white/5'
          }`}
        >
          {activeTab === 'control' && (
            <div className="absolute inset-0 bg-white/10 animate-pulse"></div>
          )}
          <span className="relative z-10 flex items-center justify-center space-x-2">
            <Zap className="w-5 h-5" />
            <span>Control</span>
          </span>
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex-1 py-4 px-6 rounded-xl font-bold transition-all duration-300 relative overflow-hidden ${
            activeTab === 'settings'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xl scale-105'
              : 'text-white/60 hover:text-white/80 hover:bg-white/5'
          }`}
        >
          {activeTab === 'settings' && (
            <div className="absolute inset-0 bg-white/10 animate-pulse"></div>
          )}
          <span className="relative z-10 flex items-center justify-center space-x-2">
            <SettingsIcon className="w-5 h-5" />
            <span>Settings</span>
          </span>
        </button>
      </div>

        {/* Last ACK */}
        {lastAck && (
          <div className={`mb-4 p-4 rounded-xl animate-fade-in ${
            lastAck.ok 
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
          }`}>
            <div className="flex items-center space-x-2">
              <AlertCircle className={`w-4 h-4 ${lastAck.ok ? 'text-green-600' : 'text-red-600'}`} />
              <span className={`text-sm font-medium ${lastAck.ok ? 'text-green-900 dark:text-green-100' : 'text-red-900 dark:text-red-100'}`}>
                {lastAck.action}: {lastAck.state || lastAck.detail || (lastAck.ok ? 'Success' : 'Failed')}
              </span>
            </div>
          </div>
        )}

        {/* Control Tab */}
        {activeTab === 'control' && (
          <div className="space-y-6 animate-fade-in-up">
            {/* Camera Control */}
            <div className="backdrop-blur-md bg-white/10 dark:bg-gray-800/30 rounded-3xl p-6 md:p-8 shadow-2xl border border-white/20 dark:border-gray-700/30">
              <h3 className="text-xl font-extrabold text-white mb-6 flex items-center">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/30 flex items-center justify-center mr-3">
                  <Camera className="w-6 h-6 text-indigo-200" />
                </div>
                Camera Control
              </h3>
              <button
                onClick={() => sendControl({ capture: true })}
                disabled={!isOnline || loading}
                className="w-full glass-button py-5 px-6 rounded-2xl font-bold text-white text-lg hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-indigo-600 to-purple-600 border-2 border-white/30"
              >
                <div className="flex items-center justify-center space-x-3">
                  <Camera className="w-6 h-6" />
                  <span>Capture Photo</span>
                </div>
              </button>
            </div>

            {/* Flash Control */}
            <div className="backdrop-blur-md bg-white/10 dark:bg-gray-800/30 rounded-3xl p-6 md:p-8 shadow-2xl border border-white/20 dark:border-gray-700/30">
              <h3 className="text-xl font-extrabold text-white mb-6 flex items-center">
                <div className="w-10 h-10 rounded-xl bg-yellow-500/30 flex items-center justify-center mr-3">
                  <Zap className="w-6 h-6 text-yellow-200" />
                </div>
                Flash LED Control
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => sendControl({ flash: 'on' })}
                  disabled={!isOnline || loading}
                  className="glass-button py-4 px-4 rounded-2xl font-bold text-white hover:shadow-2xl disabled:opacity-50 transition-all bg-gradient-to-br from-yellow-500 to-orange-500 border-2 border-white/30"
                >
                  ON
                </button>
                <button
                  onClick={() => sendControl({ flash: 'off' })}
                  disabled={!isOnline || loading}
                  className="glass-button py-4 px-4 rounded-2xl font-bold text-white hover:shadow-2xl disabled:opacity-50 transition-all bg-gradient-to-br from-gray-600 to-gray-700 border-2 border-white/30"
                >
                  OFF
                </button>
                <button
                  onClick={() => sendControl({ flash: { pulse: true, ms: 150 } })}
                  disabled={!isOnline || loading}
                  className="glass-button py-4 px-4 rounded-2xl font-bold text-white hover:shadow-2xl disabled:opacity-50 transition-all bg-gradient-to-br from-amber-500 to-orange-600 border-2 border-white/30"
                >
                  Pulse
                </button>
              </div>
            </div>

            {/* Buzzer Control */}
            <div className="backdrop-blur-md bg-white/10 dark:bg-gray-800/30 rounded-3xl p-6 md:p-8 shadow-2xl border border-white/20 dark:border-gray-700/30">
              <h3 className="text-xl font-extrabold text-white mb-6 flex items-center">
                <div className="w-10 h-10 rounded-xl bg-green-500/30 flex items-center justify-center mr-3">
                  <Volume2 className="w-6 h-6 text-green-200" />
                </div>
                Buzzer Control
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => sendControl({ buzzer: { start: true, ms: settings.buzzer.ms } })}
                  disabled={!isOnline || loading}
                  className="glass-button py-5 px-6 rounded-2xl font-bold text-white hover:shadow-2xl disabled:opacity-50 transition-all bg-gradient-to-br from-green-500 to-emerald-600 border-2 border-white/30"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Play className="w-5 h-5" />
                    <span>Start</span>
                  </div>
                </button>
                <button
                  onClick={() => sendControl({ buzzer: { stop: true } })}
                  disabled={!isOnline || loading}
                  className="glass-button py-5 px-6 rounded-2xl font-bold text-white hover:shadow-2xl disabled:opacity-50 transition-all bg-gradient-to-br from-red-500 to-pink-600 border-2 border-white/30"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Square className="w-5 h-5" />
                    <span>Stop</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Lock Control */}
            <div className="backdrop-blur-md bg-white/10 dark:bg-gray-800/30 rounded-3xl p-6 md:p-8 shadow-2xl border border-white/20 dark:border-gray-700/30">
              <h3 className="text-xl font-extrabold text-white mb-6 flex items-center">
                <div className="w-10 h-10 rounded-xl bg-blue-500/30 flex items-center justify-center mr-3">
                  <Lock className="w-6 h-6 text-blue-200" />
                </div>
                Door Lock (Solenoid) Control
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => sendControl({ lock: { pulse: true, ms: settings.lock.ms } })}
                  disabled={!isOnline || loading}
                  className="glass-button py-5 px-4 rounded-2xl font-bold text-white hover:shadow-2xl disabled:opacity-50 transition-all bg-gradient-to-br from-blue-500 to-cyan-600 border-2 border-white/30"
                >
                  Pulse
                </button>
                <button
                  onClick={() => sendControl({ lock: { open: true } })}
                  disabled={!isOnline || loading}
                  className="glass-button py-5 px-4 rounded-2xl font-bold text-white hover:shadow-2xl disabled:opacity-50 transition-all bg-gradient-to-br from-green-500 to-teal-600 border-2 border-white/30"
                >
                  Open
                </button>
                <button
                  onClick={() => sendControl({ lock: { closed: true } })}
                  disabled={!isOnline || loading}
                  className="glass-button py-5 px-4 rounded-2xl font-bold text-white hover:shadow-2xl disabled:opacity-50 transition-all bg-gradient-to-br from-red-500 to-rose-600 border-2 border-white/30"
                >
                  Lock
                </button>
              </div>
            </div>

            {/* Pipeline Control */}
            <div className="backdrop-blur-md bg-white/10 dark:bg-gray-800/30 rounded-3xl p-6 md:p-8 shadow-2xl border border-white/20 dark:border-gray-700/30">
              <h3 className="text-xl font-extrabold text-white mb-6 flex items-center">
                <div className="w-10 h-10 rounded-xl bg-red-500/30 flex items-center justify-center mr-3">
                  <Activity className="w-6 h-6 text-red-200" />
                </div>
                Pipeline Control
              </h3>
              <button
                onClick={() => sendControl({ pipeline: { stop: true } })}
                disabled={!isOnline || loading}
                className="w-full py-3 px-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-xl font-semibold hover:bg-red-200 dark:hover:bg-red-900/50 disabled:opacity-50 transition-all"
              >
                Emergency Stop Pipeline
              </button>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-4">
            {/* Distance Detection Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                <SettingsIcon className="w-5 h-5 mr-2" />
                Distance Detection Range
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Minimum Distance (cm)
                  </label>
                  <input
                    type="number"
                    value={tempSettings.ultra.min}
                    onChange={(e) => setTempSettings({
                      ...tempSettings,
                      ultra: { ...tempSettings.ultra, min: parseFloat(e.target.value) }
                    })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-0 rounded-xl focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                    min="2"
                    max="95"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Maximum Distance (cm)
                  </label>
                  <input
                    type="number"
                    value={tempSettings.ultra.max}
                    onChange={(e) => setTempSettings({
                      ...tempSettings,
                      ultra: { ...tempSettings.ultra, max: parseFloat(e.target.value) }
                    })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-0 rounded-xl focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                    min="2"
                    max="95"
                    step="0.1"
                  />
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Current: {tempSettings.ultra.min} - {tempSettings.ultra.max} cm
                  </p>
                </div>
              </div>
            </div>

            {/* Lock Duration Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                <Lock className="w-5 h-5 mr-2" />
                Door Lock Duration
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Lock Active Duration (milliseconds)
                </label>
                <input
                  type="number"
                  value={tempSettings.lock.ms}
                  onChange={(e) => setTempSettings({
                    ...tempSettings,
                    lock: { ms: parseInt(e.target.value) }
                  })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-0 rounded-xl focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                  min="100"
                  max="300000"
                  step="100"
                />
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  {(tempSettings.lock.ms / 1000).toFixed(1)} seconds
                </p>
              </div>
            </div>

            {/* Buzzer Duration Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                <Volume2 className="w-5 h-5 mr-2" />
                Buzzer Duration
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Buzzer Active Duration (milliseconds)
                </label>
                <input
                  type="number"
                  value={tempSettings.buzzer.ms}
                  onChange={(e) => setTempSettings({
                    ...tempSettings,
                    buzzer: { ms: parseInt(e.target.value) }
                  })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-0 rounded-xl focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                  min="100"
                  max="300000"
                  step="1000"
                />
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  {(tempSettings.buzzer.ms / 1000).toFixed(1)} seconds
                </p>
              </div>
            </div>

            {/* Apply Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={applySettings}
                disabled={!isOnline || loading}
                className="flex-1 flex items-center justify-center space-x-2 py-4 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
              >
                <Save className="w-5 h-5" />
                <span>Apply Settings</span>
              </button>
              <button
                onClick={() => setTempSettings(settings)}
                className="px-6 py-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
