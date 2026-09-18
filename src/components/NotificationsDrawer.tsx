import React, { useState, useEffect } from 'react';
import { AppNotification, User } from '../types.js';
import { api, requestPushPermission, triggerBrowserNotification } from '../services/api.js';
import { X, Bell, CheckCheck, ShieldAlert, Calendar, FileText, Pill, Send, Sparkles } from 'lucide-react';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  notifications: AppNotification[];
  onRefresh: () => void;
  onSelectInvoice?: (invoiceId: string) => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  isOpen,
  onClose,
  user,
  notifications,
  onRefresh,
  onSelectInvoice,
}) => {
  const [pushEnabled, setPushEnabled] = useState(false);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'granted') {
      setPushEnabled(true);
    }
  }, []);

  if (!isOpen) return null;

  const handleEnablePush = async () => {
    const granted = await requestPushPermission();
    setPushEnabled(granted);
    if (granted) {
      triggerBrowserNotification('FUNCTIONAL REHAB LAB', 'Web push notifications are now active on your device.');
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'appointment':
        return <Calendar className="w-4 h-4 text-[#FF5500]" />;
      case 'prescription':
        return <Pill className="w-4 h-4 text-[#FF5500]" />;
      case 'invoice':
        return <FileText className="w-4 h-4 text-[#FF5500]" />;
      default:
        return <ShieldAlert className="w-4 h-4 text-[#FF5500]" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white border-l border-gray-200 h-full shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FF5500]/10 border border-[#FF5500]/30 flex items-center justify-center">
              <Bell className="w-4 h-4 text-[#FF5500]" />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-900 font-display">Clinical Notifications</h3>
              <p className="text-[11px] text-gray-500">Real-time alerts & prescription updates</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl border border-gray-300 hover:bg-gray-200 text-gray-500 hover:text-gray-900 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Web Push Banner */}
        <div className="p-4 bg-orange-50 border-b border-orange-200">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#FF5500] shrink-0" />
              <p className="text-xs text-gray-800">
                {pushEnabled
                  ? 'Browser push notifications enabled'
                  : 'Enable browser notifications for appointment reminders'}
              </p>
            </div>
            {!pushEnabled && (
              <button
                onClick={handleEnablePush}
                className="px-3 py-1.5 rounded-xl bg-[#FF5500] hover:bg-[#E04B00] text-white text-[11px] font-bold uppercase transition cursor-pointer shrink-0"
              >
                Enable
              </button>
            )}
          </div>
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-gray-700">All caught up!</p>
              <p className="text-xs text-gray-400 mt-0.5">No notifications pending</p>
            </div>
          ) : (
            notifications.map((n) => {
              const isRead = n.readBy?.includes(user.id);
              return (
                <div
                  key={n.id}
                  className={`p-3.5 rounded-2xl border transition ${
                    isRead
                      ? 'bg-gray-50 border-gray-200 text-gray-500'
                      : 'bg-white border-[#FF5500]/40 shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <div className="p-1.5 rounded-lg bg-gray-100 mt-0.5">
                        {getIcon(n.type)}
                      </div>
                      <div>
                        <h4 className={`text-xs font-bold ${isRead ? 'text-gray-700' : 'text-gray-900'}`}>
                          {n.title}
                        </h4>
                        <p className="text-[11px] text-gray-600 mt-0.5 leading-relaxed">{n.message}</p>
                        <span className="text-[10px] text-gray-400 mt-1.5 block font-mono">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    {!isRead && (
                      <button
                        onClick={() => handleMarkRead(n.id)}
                        title="Mark as read"
                        className="p-1 text-gray-400 hover:text-gray-700 transition cursor-pointer shrink-0"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between text-xs text-gray-500">
          <span>Functional Rehab Lab • Indiranagar</span>
          <button
            onClick={onClose}
            className="text-xs font-bold text-gray-700 hover:text-gray-900 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
