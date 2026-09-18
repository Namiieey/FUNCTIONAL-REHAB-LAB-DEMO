import React, { useState, useEffect } from 'react';
import { User, Invoice, Prescription, AppNotification, Appointment } from './types.js';
import { api, getStoredToken, setupRealtimeSync, triggerBrowserNotification } from './services/api.js';
import { Header } from './components/Header.js';
import { AuthScreen } from './components/AuthScreen.js';
import { PatientDashboard } from './components/PatientDashboard.js';
import { DoctorDashboard } from './components/DoctorDashboard.js';
import { AdminDashboard } from './components/AdminDashboard.js';
import { InvoiceModal } from './components/InvoiceModal.js';
import { PrescriptionModal } from './components/PrescriptionModal.js';
import { NotificationsDrawer } from './components/NotificationsDrawer.js';
import { OfflineIndicator } from './components/OfflineIndicator.js';

export function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Notifications
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Modals
  const [activeInvoice, setActiveInvoice] = useState<{
    invoice: Invoice;
    appointment?: Appointment | null;
  } | null>(null);

  const [activePrescription, setActivePrescription] = useState<Prescription | null>(null);

  // Profile modal state
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Initial Auth Check
  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setLoadingAuth(false);
      return;
    }

    api.getCurrentUser()
      .then(user => {
        setCurrentUser(user);
        loadNotifications();
      })
      .catch(() => {
        api.logout();
        setCurrentUser(null);
      })
      .finally(() => {
        setLoadingAuth(false);
      });
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  // Real-time Event Listener & Sync Engine
  useEffect(() => {
    if (!currentUser) return;

    const cleanup = setupRealtimeSync(getStoredToken(), (event: any) => {
      console.log('Real-time event received in App.tsx:', event);

      if (event.type === 'NEW_NOTIFICATION') {
        setNotifications(prev => [event.payload, ...prev]);
        triggerBrowserNotification(event.payload.title, event.payload.message);
      } else if (event.type === 'APPOINTMENT_CREATED') {
        loadNotifications();
        if (currentUser.role === 'admin' || currentUser.role === 'doctor') {
          triggerBrowserNotification(
            'New Clinical Consultation',
            `${event.payload.patientName} booked ${event.payload.service} for ${event.payload.date} at ${event.payload.timeSlot}`
          );
        }
      } else if (event.type === 'INVOICE_GENERATED') {
        loadNotifications();
        if (currentUser.role === 'patient' && currentUser.id === event.payload.patientId) {
          triggerBrowserNotification(
            'Invoice Generated',
            `Tax invoice ${event.payload.invoiceNumber} for ₹${event.payload.total} is ready.`
          );
        }
      } else if (event.type === 'PRESCRIPTION_CREATED') {
        loadNotifications();
        if (currentUser.role === 'patient' && currentUser.id === event.payload.patientId) {
          triggerBrowserNotification(
            'Rehab Prescription Ready',
            `Your rehabilitation protocol by ${event.payload.doctorName} is available.`
          );
        }
      } else if (event.type === 'APPOINTMENT_DELETED') {
        loadNotifications();
      }
    });

    return () => {
      cleanup();
    };
  }, [currentUser?.id]);

  const handleLogout = async () => {
    await api.logout();
    setCurrentUser(null);
  };

  const handleSelectInvoice = (invoice: Invoice, appointment?: Appointment) => {
    setActiveInvoice({ invoice, appointment });
  };

  const handleSelectPrescription = (prescription: Prescription) => {
    setActivePrescription(prescription);
  };

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center text-gray-900">
        <div className="w-12 h-12 rounded-2xl bg-white border-2 border-[#FF5500] flex items-center justify-center animate-pulse shadow-[0_4px_20px_rgba(255,85,0,0.3)]">
          <span className="w-4 h-4 rounded-full bg-[#FF5500]" />
        </div>
        <p className="mt-4 text-xs font-black uppercase tracking-widest text-gray-700 font-display">
          FUNCTIONAL <span className="text-[#FF5500]">REHAB LAB</span>
        </p>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthScreen onSuccess={(user) => setCurrentUser(user)} />;
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-gray-900 flex flex-col antialiased selection:bg-[#FF5500] selection:text-white">
      {/* Offline status indicator banner */}
      <OfflineIndicator />

      {/* Top Header */}
      <Header
        user={currentUser}
        notifications={notifications}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenProfile={() => setShowProfileModal(true)}
      />

      {/* Main Body with Role Routing */}
      <main className="flex-1 pb-16">
        {currentUser.role === 'admin' ? (
          <AdminDashboard
            user={currentUser}
            onSelectInvoice={handleSelectInvoice}
            onSelectPrescription={handleSelectPrescription}
          />
        ) : currentUser.role === 'doctor' ? (
          <DoctorDashboard
            user={currentUser}
            onSelectInvoice={handleSelectInvoice}
            onSelectPrescription={handleSelectPrescription}
          />
        ) : (
          <PatientDashboard
            user={currentUser}
            onSelectInvoice={handleSelectInvoice}
            onSelectPrescription={handleSelectPrescription}
            onUpdateUser={(updated) => setCurrentUser(updated)}
          />
        )}
      </main>

      {/* Notifications Drawer */}
      <NotificationsDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        user={currentUser}
        notifications={notifications}
        onRefresh={loadNotifications}
        onSelectInvoice={(invId) => {
          setIsNotificationsOpen(false);
          api.getInvoiceById(invId).then(inv => handleSelectInvoice(inv));
        }}
      />

      {/* Invoice Viewer Modal */}
      {activeInvoice && (
        <InvoiceModal
          invoice={activeInvoice.invoice}
          appointment={activeInvoice.appointment}
          onClose={() => setActiveInvoice(null)}
        />
      )}

      {/* Prescription Viewer Modal */}
      {activePrescription && (
        <PrescriptionModal
          prescription={activePrescription}
          onClose={() => setActivePrescription(null)}
        />
      )}

      {/* Quick Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white border border-gray-200 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-sm font-black text-gray-900 font-display">User Account Profile</h3>
              <button
                onClick={() => setShowProfileModal(false)}
                className="text-gray-400 hover:text-gray-900 p-1 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2 text-xs">
              <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200">
                <p className="text-[10px] uppercase text-gray-500 font-bold">Full Name</p>
                <p className="text-gray-900 font-bold text-sm mt-0.5">{currentUser.fullName}</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200">
                <p className="text-[10px] uppercase text-gray-500 font-bold">System Role</p>
                <p className="text-[#FF5500] font-black uppercase mt-0.5">
                  {currentUser.role === 'admin' ? 'Cloudfare Admin {Not a Doctor}' : currentUser.role}
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200">
                <p className="text-[10px] uppercase text-gray-500 font-bold">Contact Phone</p>
                <p className="text-gray-900 font-mono font-bold mt-0.5">{currentUser.phone}</p>
              </div>
              {currentUser.email && (
                <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200">
                  <p className="text-[10px] uppercase text-gray-500 font-bold">Email</p>
                  <p className="text-gray-800 mt-0.5 font-medium">{currentUser.email}</p>
                </div>
              )}
            </div>
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowProfileModal(false)}
                className="px-5 py-2.5 rounded-xl bg-gray-900 hover:bg-black text-xs font-bold text-white transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default App;
