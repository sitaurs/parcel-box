import { useState, useEffect } from 'react';
import { Bell, CheckCircle, XCircle, Clock, AlertCircle, RefreshCw, Trash2, Filter } from 'lucide-react';

interface Notification {
  id: string;
  type: 'package' | 'status_update' | 'custom';
  recipient: string;
  packageId: string | null;
  message: string;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  attempts: number;
  error: string | null;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface NotificationStats {
  total: number;
  pending: number;
  sent: number;
  failed: number;
  cancelled: number;
  byType: {
    package: number;
    status_update: number;
    custom: number;
  };
}

export function NotificationHistory() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [retrying, setRetrying] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [filterStatus, filterType]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Build query params
      const params = new URLSearchParams({ limit: '100' });
      if (filterStatus !== 'all') {
        params.append('status', filterStatus);
      }
      if (filterType !== 'all') {
        params.append('type', filterType);
      }

      // Fetch notifications
      const apiUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1';
      const notifResponse = await fetch(`${apiUrl}/notifications?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const notifData = await notifResponse.json();
      setNotifications(notifData.notifications || []);

      // Fetch stats
      const statsResponse = await fetch(`${apiUrl}/notifications/stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const statsData = await statsResponse.json();
      setStats(statsData);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async (id: string) => {
    try {
      setRetrying(id);
      const apiUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1';
      const response = await fetch(`${apiUrl}/notifications/${id}/retry`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        await loadData(); // Reload
      } else {
        alert('Failed to retry notification');
      }
    } catch (error) {
      console.error('Error retrying notification:', error);
      alert('Error retrying notification');
    } finally {
      setRetrying(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this notification?')) return;

    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1';
      const response = await fetch(`${apiUrl}/notifications/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        await loadData(); // Reload
      } else {
        alert('Failed to delete notification');
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      alert('Error deleting notification');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500 animate-pulse" />;
      case 'cancelled':
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'failed':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'pending':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'cancelled':
        return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-700';
      default:
        return 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700';
    }
  };

  const formatTimestamp = (ts: string | null) => {
    if (!ts) return '-';
    const date = new Date(ts);
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading && notifications.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-indigo-900 dark:to-purple-900 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading notifications...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-indigo-900 dark:to-purple-900 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="backdrop-blur-md bg-white/80 dark:bg-gray-800/80 rounded-2xl p-6 border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                <Bell className="w-8 h-8 mr-3 text-indigo-600 dark:text-indigo-400" />
                Notification History
              </h1>
              <p className="mt-1 text-gray-600 dark:text-gray-400">
                WhatsApp notification logs and status
              </p>
            </div>
            <button
              onClick={loadData}
              disabled={loading}
              className="p-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition-all hover:scale-105 active:scale-95"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="backdrop-blur-md bg-white/80 dark:bg-gray-800/80 rounded-xl p-4 border border-white/20">
              <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
            </div>
            <div className="backdrop-blur-md bg-green-50/80 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
              <div className="text-sm text-green-700 dark:text-green-300">Sent</div>
              <div className="text-2xl font-bold text-green-800 dark:text-green-200">{stats.sent}</div>
            </div>
            <div className="backdrop-blur-md bg-yellow-50/80 dark:bg-yellow-900/20 rounded-xl p-4 border border-yellow-200 dark:border-yellow-800">
              <div className="text-sm text-yellow-700 dark:text-yellow-300">Pending</div>
              <div className="text-2xl font-bold text-yellow-800 dark:text-yellow-200">{stats.pending}</div>
            </div>
            <div className="backdrop-blur-md bg-red-50/80 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
              <div className="text-sm text-red-700 dark:text-red-300">Failed</div>
              <div className="text-2xl font-bold text-red-800 dark:text-red-200">{stats.failed}</div>
            </div>
            <div className="backdrop-blur-md bg-gray-50/80 dark:bg-gray-900/20 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400">Cancelled</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.cancelled}</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="backdrop-blur-md bg-white/80 dark:bg-gray-800/80 rounded-2xl p-4 border border-white/20">
          <div className="flex items-center space-x-4">
            <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="sent">Sent</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Types</option>
              <option value="package">Package</option>
              <option value="status_update">Status Update</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {notifications.length === 0 ? (
            <div className="backdrop-blur-md bg-white/80 dark:bg-gray-800/80 rounded-2xl p-12 border border-white/20 text-center">
              <Bell className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400 text-lg">No notifications found</p>
              <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
                Notifications will appear here when packages are detected
              </p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className={`backdrop-blur-md rounded-2xl p-6 border ${getStatusColor(notif.status)} transition-all hover:scale-[1.01]`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="mt-1">{getStatusIcon(notif.status)}</div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="px-2 py-1 rounded-lg text-xs font-bold bg-white/50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300">
                          {notif.type.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className="text-sm font-mono text-gray-600 dark:text-gray-400">
                          +{notif.recipient}
                        </span>
                      </div>
                      <p className="text-gray-900 dark:text-white font-medium mb-2">
                        {notif.message}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-gray-600 dark:text-gray-400">
                        <span>Created: {formatTimestamp(notif.createdAt)}</span>
                        {notif.sentAt && (
                          <span className="text-green-600 dark:text-green-400">
                            Sent: {formatTimestamp(notif.sentAt)}
                          </span>
                        )}
                        <span>Attempts: {notif.attempts}</span>
                      </div>
                      {notif.error && (
                        <div className="mt-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 p-2 rounded-lg">
                          {notif.error}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 ml-4">
                    {notif.status === 'failed' && (
                      <button
                        onClick={() => handleRetry(notif.id)}
                        disabled={retrying === notif.id}
                        className="p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-all hover:scale-105 active:scale-95"
                        title="Retry"
                      >
                        <RefreshCw className={`w-4 h-4 ${retrying === notif.id ? 'animate-spin' : ''}`} />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(notif.id)}
                      className="p-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-all hover:scale-105 active:scale-95"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
