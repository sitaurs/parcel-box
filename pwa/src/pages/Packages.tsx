import { useState, useEffect } from 'react';
import { Search, X, Filter, Calendar, MapPin, Package as PackageIcon } from 'lucide-react';
import { getPackages, type Package } from '../lib/api';
import { getImageUrl, getPlaceholderImage } from '../lib/images';

export function Packages() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadPackages();
  }, [statusFilter]);

  async function loadPackages() {
    try {
      setLoading(true);
      const data = await getPackages({ 
        limit: 100,
        status: statusFilter === 'all' ? undefined : statusFilter
      });
      setPackages(data);
    } catch (error) {
      console.error('Error loading packages:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredPackages = packages.filter(pkg =>
    pkg.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pkg.deviceId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'captured': return 'bg-blue-500';
      case 'delivered': return 'bg-green-500';
      case 'dropped': return 'bg-purple-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Search Header - No sticky positioning needed, layout handles it */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 space-y-3 animate-fade-in-down">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search packages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-700 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-3 rounded-xl transition-all ${
              showFilters || statusFilter !== 'all'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}
          >
            <Filter className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Chips */}
        {showFilters && (
          <div className="flex space-x-2 overflow-x-auto pb-2 -mx-4 px-4">
            {['all', 'captured', 'delivered', 'dropped'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  statusFilter === status
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        )}

        {/* Results count */}
        <div className="flex items-center justify-between text-sm">
          <p className="text-gray-600 dark:text-gray-400">
            <span className="font-bold text-gray-900 dark:text-white">{filteredPackages.length}</span> packages found
          </p>
          {statusFilter !== 'all' && (
            <button
              onClick={() => setStatusFilter('all')}
              className="text-blue-600 dark:text-blue-400 font-medium"
            >
              Clear filter
            </button>
          )}
        </div>
      </div>

      {/* Packages List */}
      <div className="p-4 space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-28 bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredPackages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <PackageIcon className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No packages found</h3>
            <p className="text-gray-500 dark:text-gray-400 text-center">
              {searchQuery ? 'Try a different search' : 'No packages to display'}
            </p>
          </div>
        ) : (
          filteredPackages.map(pkg => (
            <div
              key={pkg.id}
              onClick={() => setSelectedPackage(pkg)}
              className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 active:scale-98 transition-transform"
            >
              <div className="flex">
                {/* Image */}
                <div className="w-24 h-24 flex-shrink-0 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
                  {(pkg.thumbUrl || pkg.photoUrl) ? (
                    <img
                      src={getImageUrl(pkg.thumbUrl || pkg.photoUrl)}
                      alt="Package"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = getPlaceholderImage();
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <PackageIcon className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 p-3 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0 mr-2">
                      <p className="text-xs font-mono text-gray-500 dark:text-gray-400 truncate mb-1">
                        {pkg.id}
                      </p>
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(pkg.status)}`} />
                        <span className="text-sm font-bold text-gray-900 dark:text-white capitalize">
                          {pkg.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                      <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                      <span className="truncate">{pkg.deviceId}</span>
                    </div>
                    <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                      <Calendar className="w-3 h-3 mr-1 flex-shrink-0" />
                      <span>{new Date(pkg.tsDetected).toLocaleString('id-ID', { 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Package Detail Modal */}
      {selectedPackage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end md:items-center md:justify-center"
          onClick={() => setSelectedPackage(null)}
        >
          <div
            className="bg-white dark:bg-gray-800 w-full md:max-w-lg md:rounded-2xl rounded-t-3xl max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between z-10">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Package Details</h3>
              <button
                onClick={() => setSelectedPackage(null)}
                className="w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-full"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {(selectedPackage.thumbUrl || selectedPackage.photoUrl) && (
                <img
                  src={getImageUrl(selectedPackage.photoUrl || selectedPackage.thumbUrl)}
                  alt="Package"
                  className="w-full rounded-2xl"
                  onError={(e) => {
                    const thumbUrl = getImageUrl(selectedPackage.thumbUrl);
                    if (thumbUrl && (e.target as HTMLImageElement).src !== thumbUrl) {
                      (e.target as HTMLImageElement).src = thumbUrl;
                    } else {
                      (e.target as HTMLImageElement).src = getPlaceholderImage();
                    }
                  }}
                />
              )}

              <div className="space-y-3">
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Package ID</p>
                  <p className="font-mono text-sm font-bold text-gray-900 dark:text-white break-all">
                    {selectedPackage.id}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Status</p>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(selectedPackage.status)}`} />
                      <p className="text-sm font-bold text-gray-900 dark:text-white capitalize">
                        {selectedPackage.status}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Distance</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      {selectedPackage.distanceCm ? `${selectedPackage.distanceCm} cm` : 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Device</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{selectedPackage.deviceId}</p>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Detected Time</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {new Date(selectedPackage.tsDetected).toLocaleString('id-ID', {
                      dateStyle: 'full',
                      timeStyle: 'long'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
