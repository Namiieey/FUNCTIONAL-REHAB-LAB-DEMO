import React, { useState } from 'react';
import { User, AppNotification } from '../types.js';
import { PWAInstallButton } from './PWAInstallButton.js';
import { Bell, LogOut, User as UserIcon, Activity, CheckCircle, Shield, Calendar, FileText, Pill } from 'lucide-react';

interface HeaderProps {
  user: User | null;
  notifications: AppNotification[];
  onOpenNotifications: () => void;
  onLogout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenProfile: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  notifications,
  onOpenNotifications,
  onLogout,
  activeTab,
  setActiveTab,
  onOpenProfile
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);

  const unreadCount = user
    ? notifications.filter(n => !n.readBy.includes(user.id)).length
    : 0;

  const isStaff = user?.role === 'doctor' || user?.role === 'admin';

  return (
    <header className="sticky top-0 z-40 bg-white/95 border-b border-gray-200 backdrop-blur-md shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Brand & Logo */}
        <div
          className="flex items-center gap-3.5 cursor-pointer"
          onClick={() => setActiveTab(isStaff ? 'overview' : 'appointments')}
        >
          <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-[#FF5500]/40 bg-white flex items-center justify-center shrink-0 shadow-[0_2px_10px_rgba(255,85,0,0.15)]">
            <img
              src="https://plain-apac-prod-public.komododecks.com/202609/17/Kw2mXJAzBAz9GQSJUTXp/image.jpg"
              alt="Functional Rehab Lab"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <Activity className="w-5 h-5 text-[#FF5500] absolute" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-black tracking-wider text-base sm:text-lg text-gray-900">
                FUNCTIONAL <span className="text-[#FF5500]">REHAB LAB</span>
              </span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-extrabold tracking-widest uppercase bg-[#FF5500]/10 text-[#FF5500] border border-[#FF5500]/30">
                CLOUD
              </span>
            </div>
            <p className="text-[10px] text-gray-500 tracking-wide font-medium hidden sm:block">
              Advanced Sports & Orthopedic Physical Rehabilitation
            </p>
          </div>
        </div>

        {/* Action Controls & Navigation */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* PWA Install Button */}
          <PWAInstallButton />

          {user && (
            <>
              {/* Notification Trigger with Badge */}
              <button
                id="btn-notifications"
                onClick={onOpenNotifications}
                className="relative p-2.5 rounded-xl border border-gray-200 bg-gray-50 hover:border-[#FF5500] hover:bg-[#FF5500]/5 transition text-gray-700 hover:text-gray-900 cursor-pointer"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#FF5500] text-white font-black text-[10px] flex items-center justify-center shadow-sm">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* User Pill / Menu */}
              <div className="relative">
                <button
                  id="btn-user-menu"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:border-[#FF5500] shadow-xs transition text-left cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-[#FF5500] text-white flex items-center justify-center font-black text-xs shadow-xs">
                    {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="hidden md:block">
                    <p className="text-xs font-bold text-gray-900 leading-tight truncate max-w-[130px]">
                      {user.fullName}
                    </p>
                    <p className="text-[10px] font-bold text-[#FF5500]">
                      {user.role === 'admin' ? 'Admin {Not a Doctor}' : user.role === 'doctor' ? 'Medical Doctor' : 'Patient'}
                    </p>
                  </div>
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowUserMenu(false)}
                    />
                    <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-white border border-gray-200 shadow-xl z-50 p-2 text-sm text-gray-800">
                      <div className="px-3 py-2 border-b border-gray-100">
                        <p className="font-bold text-gray-900 truncate">{user.fullName}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email || user.username}</p>
                        <span className="inline-block mt-1.5 px-2 py-0.5 rounded text-[10px] font-black uppercase bg-[#FF5500]/10 text-[#FF5500] border border-[#FF5500]/25">
                          {user.role === 'admin' ? 'Admin {Not a Doctor}' : user.role === 'doctor' ? 'Medical Doctor' : 'Registered Patient'}
                        </span>
                      </div>

                      <div className="py-1">
                        <button
                          id="btn-menu-profile"
                          onClick={() => {
                            setShowUserMenu(false);
                            onOpenProfile();
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs hover:bg-gray-100 text-gray-700 hover:text-gray-900 transition text-left cursor-pointer font-medium"
                        >
                          <UserIcon className="w-3.5 h-3.5 text-gray-500" />
                          <span>My Account Profile</span>
                        </button>

                        <button
                          id="btn-menu-notifications"
                          onClick={() => {
                            setShowUserMenu(false);
                            onOpenNotifications();
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs hover:bg-gray-100 text-gray-700 hover:text-gray-900 transition text-left cursor-pointer font-medium"
                        >
                          <Bell className="w-3.5 h-3.5 text-gray-500" />
                          <span>Notifications</span>
                          {unreadCount > 0 && (
                            <span className="ml-auto px-1.5 py-0.5 rounded text-[10px] bg-[#FF5500] text-white font-bold">
                              {unreadCount}
                            </span>
                          )}
                        </button>
                      </div>

                      <div className="pt-1 border-t border-gray-100">
                        <button
                          id="btn-menu-logout"
                          onClick={() => {
                            setShowUserMenu(false);
                            onLogout();
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs hover:bg-rose-50 text-rose-600 hover:text-rose-700 transition text-left cursor-pointer font-bold"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
