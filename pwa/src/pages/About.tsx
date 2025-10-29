import { Box, Shield, Zap, Cloud, Github, Mail, Heart, Users, Code, Smartphone } from 'lucide-react';

export function About() {
  const features = [
    {
      icon: Box,
      title: 'Smart Detection',
      description: 'Advanced AI-powered package detection with real-time image recognition',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Zap,
      title: 'Instant Notifications',
      description: 'Get notified immediately via WhatsApp when packages arrive',
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      icon: Cloud,
      title: 'Cloud Storage',
      description: 'Secure cloud storage for all package photos and delivery records',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      icon: Shield,
      title: 'Secure & Reliable',
      description: 'End-to-end encryption and reliable service uptime guarantee',
      gradient: 'from-orange-500 to-red-500'
    }
  ];

  const techStack = [
    { name: 'React', icon: '⚛️', description: 'Modern UI framework' },
    { name: 'TypeScript', icon: '📘', description: 'Type-safe code' },
    { name: 'Tailwind CSS', icon: '🎨', description: 'Beautiful styling' },
    { name: 'Vite', icon: '⚡', description: 'Lightning fast build' },
    { name: 'Express', icon: '🚂', description: 'Backend API' },
    { name: 'Prisma', icon: '💎', description: 'Database ORM' },
    { name: 'Baileys', icon: '💬', description: 'WhatsApp integration' },
    { name: 'MQTT', icon: '📡', description: 'IoT communication' }
  ];

  const team = [
    {
      role: 'Full Stack Developer',
      description: 'Architecture & Implementation',
      icon: Code,
      gradient: 'from-blue-600 to-purple-600'
    },
    {
      role: 'IoT Engineer',
      description: 'Hardware & Firmware',
      icon: Smartphone,
      gradient: 'from-green-600 to-cyan-600'
    },
    {
      role: 'Community',
      description: 'Open source contributors',
      icon: Users,
      gradient: 'from-pink-600 to-orange-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-pink-600/10" />
        <div className="relative max-w-7xl mx-auto px-6 py-20 text-center">
          <div className="inline-block p-4 bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl mb-6">
            <Box className="w-16 h-16 text-white" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            Smart Parcel System
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8">
            An intelligent IoT-based package delivery monitoring system with real-time detection, 
            automated photography, and instant WhatsApp notifications.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <div className="px-6 py-3 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
              <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                v1.0.0
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Current Version</p>
            </div>
            <div className="px-6 py-3 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
              <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                2025
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Release Year</p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">
            Powerful Features
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Everything you need for smart package management
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="card bg-white dark:bg-gray-800 p-6 hover:shadow-2xl transition-all duration-300 group"
            >
              <div className={`inline-block p-4 bg-gradient-to-br ${feature.gradient} rounded-2xl mb-4 group-hover:scale-110 transition-transform`}>
                <feature.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Tech Stack Section */}
      <div className="bg-white dark:bg-gray-800 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">
              Built With Modern Technology
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Powered by cutting-edge frameworks and tools
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {techStack.map((tech, index) => (
              <div
                key={index}
                className="p-6 bg-gray-50 dark:bg-gray-900 rounded-2xl hover:shadow-lg transition-all duration-300 text-center group"
              >
                <div className="text-5xl mb-3 group-hover:scale-125 transition-transform">
                  {tech.icon}
                </div>
                <h4 className="font-bold text-gray-800 dark:text-white mb-1">
                  {tech.name}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {tech.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">
            Created By
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Dedicated team building the future of smart delivery
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {team.map((member, index) => (
            <div
              key={index}
              className="card bg-white dark:bg-gray-800 p-8 text-center hover:shadow-2xl transition-all duration-300"
            >
              <div className={`inline-block p-6 bg-gradient-to-br ${member.gradient} rounded-3xl mb-6`}>
                <member.icon className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                {member.role}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {member.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* System Info Section */}
      <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 py-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 text-white">
            <h2 className="text-3xl font-bold mb-6 text-center">System Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Box className="w-5 h-5 mr-2" />
                  Backend Services
                </h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
                    Main API: Port 8080
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
                    WhatsApp Service: Port 3001
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
                    MQTT Broker: Port 1883
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Features
                </h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>
                    Real-time package detection
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>
                    Automated photography
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>
                    WhatsApp notifications
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>
                    Cloud photo storage
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-white/20">
              <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
                <a
                  href="https://github.com/yourusername/smart-parcel"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all"
                >
                  <Github className="w-4 h-4" />
                  <span>View on GitHub</span>
                </a>
                <a
                  href="mailto:support@smartparcel.com"
                  className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all"
                >
                  <Mail className="w-4 h-4" />
                  <span>Contact Support</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white dark:bg-gray-800 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-gray-600 dark:text-gray-400 flex items-center justify-center">
            Made with <Heart className="w-4 h-4 mx-2 text-red-500 fill-current" /> for smarter deliveries
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            © 2025 Smart Parcel System. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
