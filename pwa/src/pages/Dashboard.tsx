import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Camera, Package as PackageIcon, CheckCircle, Wifi, WifiOff, Clock, MapPin, ChevronRight, Settings as SettingsIcon, Shield, Bell, Image as ImageIcon } from 'lucide-react';
import { socket } from '../lib/socket';
import * as api from '../lib/api';
import { MoodWidget } from '../components/MoodWidget';
import { getImageUrl, getPlaceholderImage } from '../lib/images';
import { notificationService } from '../services/notificationService';
import { useAuth } from '../contexts/AuthContext';

interface Stats {
  totalPackages: number;
  todayPackages: number;
  capturedPackages: number;
  deliveredPackages: number;
}

export function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [devices, setDevices] = useState<api.Device[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalPackages: 0,
    todayPackages: 0,
    capturedPackages: 0,
    deliveredPackages: 0,
  });
  const [lastPackage, setLastPackage] = useState<any>(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    
    socket.connect();
    setConnected(socket.isConnected());

    const handleConnect = () => setConnected(true);
    const handleDisconnect = () => setConnected(false);
    const handleDeviceStatus = (data: any) => {
      setDevices(prev => 
        prev.map(d => d.id === data.deviceId ? { ...d, status: data.status, lastSeen: new Date().toISOString() } : d)
      );
    };
    const handlePackageNew = async (pkg: any) => {
      setLastPackage(pkg);
      setStats(prev => ({
        ...prev,
        totalPackages: prev.totalPackages + 1,
        todayPackages: prev.todayPackages + 1,
        capturedPackages: prev.capturedPackages + 1,
      }));
      
      // Show notification for new package
      try {
        await notificationService.notifyNewPackage({
          trackingNumber: pkg.trackingNumber || 'N/A',
          recipient: pkg.recipient || 'Unknown',
          deviceName: pkg.deviceName,
        });
      } catch (error) {
        console.error('Error showing notification:', error);
      }
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('device:status', handleDeviceStatus);
    socket.on('package:new', handlePackageNew);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('device:status', handleDeviceStatus);
      socket.off('package:new', handlePackageNew);
    };
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      
      // Use Promise.allSettled for better error handling
      const results = await Promise.allSettled([
        api.getDevices(),
        api.getPackages({ limit: 10 }), // Latest 10 for display
        api.getPackages({}) // All packages for stats count
      ]);

      // Extract with fallbacks
      const devicesData = results[0].status === 'fulfilled' ? results[0].value : [];
      const packagesData = results[1].status === 'fulfilled' ? results[1].value : [];
      const allPackagesCount = results[2].status === 'fulfilled' ? results[2].value : [];

      setDevices(devicesData);
      
      const today = new Date().toDateString();
      const todayPkgs = allPackagesCount.filter(p => new Date(p.tsDetected).toDateString() === today);
      
      setStats({
        totalPackages: allPackagesCount.length, // Count ALL packages
        todayPackages: todayPkgs.length,
        capturedPackages: allPackagesCount.filter(p => p.status === 'captured').length,
        deliveredPackages: allPackagesCount.filter(p => p.status === 'delivered').length,
      });

      if (packagesData.length > 0) {
        setLastPackage(packagesData[0]);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Modern Premium Header with Gradient Background */}
      <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 dark:from-blue-900 dark:via-indigo-900 dark:to-purple-900 overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl transform translate-x-32 -translate-y-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-300 rounded-full blur-3xl transform -translate-x-24 translate-y-24"></div>
        </div>

        <div className="relative px-5 pt-8 pb-6">
          {/* Top Row - User Info & Actions */}
          <div className="flex items-center justify-between mb-6">
            {/* User Avatar & Greeting */}
            <div className="flex items-center space-x-3 animate-fade-in">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md border-2 border-white/30 flex items-center justify-center shadow-lg">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold text-xl shadow-inner">
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </div>
              </div>
              <div>
                <p className="text-white/80 text-xs font-medium">
                  Hello, {user?.username || 'User'}
                </p>
                <p className="text-white text-sm font-semibold">
                  Today {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                </p>
              </div>
            </div>

            {/* Notification & Settings Icons */}
            <div className="flex items-center space-x-2 animate-fade-in">
              <button 
                onClick={() => navigate('/settings')}
                className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all active:scale-95"
              >
                <SettingsIcon className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Greeting Text */}
          <div className="mb-5 animate-slide-in-left">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">
              {new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 18 ? 'Good Afternoon' : 'Good Evening'}
            </h1>
            <p className="text-white/70 text-sm">
              {connected ? '✨ Everything is running smoothly' : '⚠️ System offline'}
            </p>
          </div>

          {/* Stats Cards Row - Inline with Header */}
          <div className="grid grid-cols-3 gap-3 animate-fade-in">
            {/* Total Packages */}
            <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl p-3 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-xl bg-blue-400/30 flex items-center justify-center">
                  <PackageIcon className="w-4 h-4 text-white" />
                </div>
              </div>
              <p className="text-white/70 text-[10px] font-medium mb-0.5">Total</p>
              <p className="text-white text-xl font-bold">{stats.totalPackages}</p>
            </div>

            {/* Today's Packages */}
            <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl p-3 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-xl bg-green-400/30 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-white" />
                </div>
              </div>
              <p className="text-white/70 text-[10px] font-medium mb-0.5">Today</p>
              <p className="text-white text-xl font-bold">{stats.todayPackages}</p>
            </div>

            {/* Captured Photos */}
            <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl p-3 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-xl bg-purple-400/30 flex items-center justify-center">
                  <Camera className="w-4 h-4 text-white" />
                </div>
              </div>
              <p className="text-white/70 text-[10px] font-medium mb-0.5">Photos</p>
              <p className="text-white text-xl font-bold">{stats.capturedPackages}</p>
            </div>
          </div>

          {/* Connection Status Badge - Bottom Right */}
          <div className="absolute bottom-4 right-4 animate-fade-in">
            <div className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full backdrop-blur-md border shadow-lg transition-all ${
              connected 
                ? 'bg-green-500/20 border-green-400/30 text-white' 
                : 'bg-red-500/20 border-red-400/30 text-white'
            }`}>
              {connected ? (
                <>
                  <div className="w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse"></div>
                  <span className="text-xs font-semibold">Online</span>
                </>
              ) : (
                <>
                  <div className="w-1.5 h-1.5 bg-red-300 rounded-full"></div>
                  <span className="text-xs font-semibold">Offline</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pb-6 space-y-5">
        {/* Quick Actions - Prominent Cards */}
        <div className="grid grid-cols-2 gap-3 animate-fade-in">
          <button
            onClick={() => navigate('/packages')}
            className="p-4 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-3xl shadow-lg hover:shadow-2xl active:scale-95 transition-all text-white aspect-square flex flex-col items-center justify-center"
          >
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <PackageIcon className="w-7 h-7" />
              </div>
              <div>
                <p className="font-bold text-sm">Packages</p>
                <p className="text-xs text-white/80">{stats.totalPackages} total</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate('/gallery')}
            className="p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl shadow-lg hover:shadow-2xl active:scale-95 transition-all text-white aspect-square flex flex-col items-center justify-center"
          >
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <ImageIcon className="w-7 h-7" />
              </div>
              <div>
                <p className="font-bold text-sm">Gallery</p>
                <p className="text-xs text-white/80">{stats.capturedPackages} photos</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate('/notifications')}
            className="p-4 bg-gradient-to-br from-orange-500 to-red-500 rounded-3xl shadow-lg hover:shadow-2xl active:scale-95 transition-all text-white aspect-square flex flex-col items-center justify-center"
          >
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <Bell className="w-7 h-7" />
              </div>
              <div>
                <p className="font-bold text-sm">Alerts</p>
                <p className="text-xs text-white/80">Notifications</p>
              </div>
            </div>
          </button>

          {user?.role === 'admin' && (
            <button
              onClick={() => navigate('/admin/users')}
              className="p-4 bg-gradient-to-br from-red-500 to-orange-500 rounded-3xl shadow-lg hover:shadow-2xl active:scale-95 transition-all text-white aspect-square flex flex-col items-center justify-center"
            >
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <Shield className="w-7 h-7" />
                </div>
                <div>
                  <p className="font-bold text-sm">Admin</p>
                  <p className="text-xs text-white/80">Manage Users</p>
                </div>
              </div>
            </button>
          )}
        </div>

      <div className="px-4 pb-6 space-y-5">
        {/* Connection Status - Smooth Animated Card */}
        <div className={`p-4 rounded-3xl flex items-center space-x-3 transition-all duration-500 transform hover:scale-105 ${
          connected 
            ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20' 
            : 'bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20'
        }`}>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${
            connected 
              ? 'bg-green-100 dark:bg-green-900/30' 
              : 'bg-red-100 dark:bg-red-900/30'
          }`}>
            {connected ? (
              <Wifi className="w-6 h-6 text-green-600 dark:text-green-400 animate-pulse" />
            ) : (
              <WifiOff className="w-6 h-6 text-red-600 dark:text-red-400" />
            )}
          </div>
          <div className="flex-1">
            <p className={`font-bold text-sm ${connected ? 'text-green-900 dark:text-green-100' : 'text-red-900 dark:text-red-100'}`}>
              {connected ? 'System Online' : 'System Offline'}
            </p>
            <p className={`text-xs ${connected ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              Real-time monitoring {connected ? 'active' : 'inactive'}
            </p>
          </div>
        </div>

        {/* Mood Widget with Animation */}
        <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
          <MoodWidget />
        </div>

        {/* Stats Cards - Smooth Staggered Animation */}
        <div className="grid grid-cols-2 gap-3">
          <StatsCard
            icon={PackageIcon}
            value={stats.totalPackages}
            label="Total"
            iconBg="bg-blue-100 dark:bg-blue-900/30"
            iconColor="text-blue-600 dark:text-blue-400"
            delay="200ms"
          />
          <StatsCard
            icon={TrendingUp}
            value={stats.todayPackages}
            label="Today"
            iconBg="bg-purple-100 dark:bg-purple-900/30"
            iconColor="text-purple-600 dark:text-purple-400"
            delay="300ms"
          />
          <StatsCard
            icon={Camera}
            value={stats.capturedPackages}
            label="Captured"
            iconBg="bg-orange-100 dark:bg-orange-900/30"
            iconColor="text-orange-600 dark:text-orange-400"
            delay="400ms"
          />
          <StatsCard
            icon={CheckCircle}
            value={stats.deliveredPackages}
            label="Delivered"
            iconBg="bg-green-100 dark:bg-green-900/30"
            iconColor="text-green-600 dark:text-green-400"
            delay="500ms"
          />
        </div>
      </div>

      {/* Devices Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1 animate-fade-in-down">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Devices</h2>
          <button className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:scale-110 transition-transform ripple">See All</button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-2xl shimmer" />)}
          </div>
        ) : devices.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-gray-800 rounded-2xl animate-fade-in">
            <p className="text-gray-500 dark:text-gray-400">No devices found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {devices.map((device, index) => (
              <div 
                key={device.id} 
                onClick={() => navigate(`/device/${device.id}`)}
                className={`bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 animate-fade-in-up stagger-${(index % 8) + 1} hover:shadow-xl hover:scale-102 active:scale-98 transition-all cursor-pointer group relative overflow-hidden`}
              >
                {/* Hover hint */}
                <div className="absolute top-2 right-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-full text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1">
                  <SettingsIcon className="w-3 h-3" />
                  <span>Tap to Control</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 group-hover:rotate-6 ${
                      device.status === 'online' 
                        ? 'bg-gradient-to-br from-green-400 to-emerald-500 shadow-lg shadow-green-500/50 animate-pulse-glow' 
                        : 'bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-700 dark:to-gray-600'
                    }`}>
                      <PackageIcon className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 dark:text-white truncate text-lg">{device.name}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center space-x-1 ${
                          device.status === 'online'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                            : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${device.status === 'online' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></span>
                          <span>{device.status?.toUpperCase()}</span>
                        </span>
                        {device.lastSeen && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {new Date(device.lastSeen).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      {/* Description hint */}
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center">
                        <SettingsIcon className="w-3 h-3 mr-1" />
                        Control camera, flash, buzzer & solenoid
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-center space-y-2">
                    <ChevronRight className="w-6 h-6 text-indigo-500 group-hover:translate-x-2 transition-all" />
                    <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">View</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Latest Package */}
      {lastPackage && (
        <div className="space-y-3 animate-scale-in-center">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Latest Package</h2>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:scale-102 transition-all group">
            {(lastPackage.thumbUrl || lastPackage.photoUrl) && (
              <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 overflow-hidden">
                <img
                  src={getImageUrl(lastPackage.thumbUrl || lastPackage.photoUrl)}
                  alt="Package"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = getPlaceholderImage();
                  }}
                />
                <div className="absolute top-3 right-3 animate-bounce-in stagger-1">
                  <span className="px-3 py-1 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full text-xs font-bold text-gray-900 dark:text-white shadow-lg">
                    {lastPackage.status?.toUpperCase()}
                  </span>
                </div>
              </div>
            )}
            <div className="p-4 space-y-3">
              <div className="animate-fade-in-up stagger-1">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Package ID</p>
                <p className="text-sm font-mono font-bold text-gray-900 dark:text-white truncate">
                  {lastPackage.id}
                </p>
              </div>
              <div className="flex items-center space-x-4 animate-fade-in-up stagger-2">
                <div className="flex items-center space-x-2 flex-1">
                  <MapPin className="w-4 h-4 text-gray-400 animate-bounce-slow" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Device</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{lastPackage.deviceId}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 animate-fade-in-up stagger-3">
                  <Clock className="w-4 h-4 text-gray-400 animate-spin-slow" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Time</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {new Date(lastPackage.tsDetected).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}

// Stats Card Component
interface StatsCardProps {
  icon: any;
  value: number;
  label: string;
  iconBg: string;
  iconColor: string;
  delay?: string;
}

function StatsCard({ icon: Icon, value, label, iconBg, iconColor, delay = '' }: StatsCardProps) {
  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm hover:shadow-xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-1 animate-fade-in"
      style={{ animationDelay: delay }}
    >
      <div className={`w-14 h-14 rounded-2xl ${iconBg} flex items-center justify-center mb-4 transition-transform duration-500 hover:rotate-12`}>
        <Icon className={`w-7 h-7 ${iconColor}`} />
      </div>
      <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{value}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wide">{label}</p>
    </div>
  );
}
