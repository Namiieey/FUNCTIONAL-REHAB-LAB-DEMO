import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus.js';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-2xl bg-white border-2 border-[#FF5500] px-4 py-2.5 text-xs font-bold text-gray-900 shadow-xl backdrop-blur-md">
      <WifiOff className="w-4 h-4 text-[#FF5500] animate-pulse" />
      <span>Offline Mode &bull; Cached clinical data active</span>
    </div>
  );
};
