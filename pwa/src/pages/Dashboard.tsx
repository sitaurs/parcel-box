import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Camera, Package as PackageIcon, CheckCircle, Wifi, WifiOff, Clock, MapPin, ChevronRight, Settings as SettingsIcon } from 'lucide-react';
import { socket } from '../lib/socket';
import * as api from '../lib/api';
import { MoodWidget } from '../components/MoodWidget';
import { getImageUrl, getPlaceholderImage } from '../lib/images';
import { notificationService } from '../services/notificationService';

interface Stats {
  totalPackages: number;
  todayPackages: number;
  capturedPackages: number;
  deliveredPackages: number;
}

export function Dashboard() {
  const navigate = useNavigate();
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
    <div className="min-h-screen">
      {/* Page Header - Better spacing for all devices */}
      <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-6 md:p-8 lg:p-10 animate-fade-in-down">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2 animate-slide-in-left">
            Dashboard
          </h1>
          <p className="text-white/90 text-sm md:text-base animate-fade-in-up stagger-1">
            Welcome back! Here's your overview
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 space-y-6">
        {/* Connection Status Banner */}
        <div className={`flex items-center justify-between p-4 md:p-6 rounded-2xl lg:rounded-3xl animate-fade-in-up ${
          connected 
            ? 'bg-gradient-to-r from-green-500 to-emerald-500 animate-pulse-glow' 
            : 'bg-gradient-to-r from-red-500 to-pink-500 animate-shake'
        } text-white shadow-lg hover:shadow-2xl transition-all`}>
        <div className="flex items-center space-x-3">
          {connected ? <Wifi className="w-5 h-5 animate-bounce-slow" /> : <WifiOff className="w-5 h-5" />}
          <div>
            <p className="font-bold text-sm">{connected ? 'System Online' : 'System Offline'}</p>
            <p className="text-xs opacity-90">Real-time monitoring {connected ? 'active' : 'inactive'}</p>
          </div>
        </div>
      </div>

      {/* Mood Widget */}
      <div className="animate-scale-in-center">
        <MoodWidget />
      </div>

      {/* Stats Cards - Horizontal Scroll on Mobile */}
      <div className="overflow-x-auto -mx-4 px-4 pb-2">
        <div className="flex space-x-3 min-w-max md:grid md:grid-cols-4 md:gap-4">
          <StatsCard
            icon={PackageIcon}
            value={stats.totalPackages}
            label="Total"
            iconBg="bg-blue-100 dark:bg-blue-900/30"
            iconColor="text-blue-600 dark:text-blue-400"
            delay="stagger-1"
          />
          <StatsCard
            icon={TrendingUp}
            value={stats.todayPackages}
            label="Today"
            iconBg="bg-purple-100 dark:bg-purple-900/30"
            iconColor="text-purple-600 dark:text-purple-400"
            delay="stagger-2"
          />
          <StatsCard
            icon={Camera}
            value={stats.capturedPackages}
            label="Captured"
            iconBg="bg-orange-100 dark:bg-orange-900/30"
            iconColor="text-orange-600 dark:text-orange-400"
            delay="stagger-3"
          />
          <StatsCard
            icon={CheckCircle}
            value={stats.deliveredPackages}
            label="Delivered"
            iconBg="bg-green-100 dark:bg-green-900/30"
            iconColor="text-green-600 dark:text-green-400"
            delay="stagger-4"
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
    <div className={`bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 min-w-[140px] md:min-w-0 animate-fade-in-up ${delay} hover:shadow-lg hover:scale-105 hover-glow transition-all cursor-pointer`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center animate-bounce-in ${delay}`}>
          <Icon className={`w-5 h-5 ${iconColor} group-hover:scale-110 transition-transform`} />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{value}</p>
      <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
    </div>
  );
}
