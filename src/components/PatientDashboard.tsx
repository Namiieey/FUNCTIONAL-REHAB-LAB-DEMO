import React, { useState, useEffect } from 'react';
import { User, Appointment, Invoice, Prescription, ServiceItem, PatientAnalysis } from '../types.js';
import { api, generateWhatsAppBookingUrl } from '../services/api.js';
import { exportToCsv, triggerPrint } from '../utils/exportUtils.js';
import { PatientAnalysisView } from './PatientAnalysisView.js';
import {
  Calendar,
  Clock,
  PlusCircle,
  FileText,
  Pill,
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
  Share2,
  XCircle,
  ArrowRight,
  Activity,
  Phone,
  ShieldAlert,
  ChevronRight,
  CalendarCheck,
  Send,
  TrendingUp,
  Zap,
  Sparkles,
  Printer,
  Download
} from 'lucide-react';

interface PatientDashboardProps {
  user: User;
  onSelectInvoice: (invoice: Invoice, appointment?: Appointment) => void;
  onSelectPrescription: (prescription: Prescription) => void;
  onUpdateUser: (updated: User) => void;
}

export const PatientDashboard: React.FC<PatientDashboardProps> = ({
  user,
  onSelectInvoice,
  onSelectPrescription,
  onUpdateUser,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'book' | 'appointments' | 'prescriptions' | 'invoices' | 'analysis' | 'profile'>('overview');

  // Data states
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [analyses, setAnalyses] = useState<PatientAnalysis[]>([]);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Booking Form State
  const [selectedService, setSelectedService] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('10:00 AM');
  const [selectedDoctorId, setSelectedDoctorId] = useState('doc-1');
  const [notes, setNotes] = useState('');
  const [rehabGoals, setRehabGoals] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Profile Form State
  const [editFullName, setEditFullName] = useState(user.fullName);
  const [editPhone, setEditPhone] = useState(user.phone);
  const [editEmail, setEditEmail] = useState(user.email || '');
  const [editGender, setEditGender] = useState(user.gender || 'Male');
  const [editAge, setEditAge] = useState(user.age?.toString() || '30');
  const [editHistory, setEditHistory] = useState(user.medicalHistory || '');
  const [editEmergency, setEditEmergency] = useState(user.emergencyContact || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSavedMsg, setProfileSavedMsg] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [apts, invs, rxs, srvs, anls] = await Promise.all([
        api.getAppointments(),
        api.getInvoices(),
        api.getPrescriptions(),
        api.getServices(),
        api.getAnalyses(),
      ]);
      setAppointments(apts);
      setInvoices(invs);
      setPrescriptions(rxs);
      setServices(srvs);
      setAnalyses(anls);
      if (anls.length > 0) {
        setSelectedAnalysisId(anls[0].id);
      }
      if (srvs.length > 0 && !selectedService) {
        setSelectedService(srvs[0].name);
      }
    } catch (err) {
      console.error('Failed to load patient data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user.id]);

  // Handle appointment booking
  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !bookingDate || !bookingTime) {
      setBookingError('Please fill in service, date, and time slot.');
      return;
    }

    try {
      setBookingLoading(true);
      setBookingError(null);
      const res = await api.createAppointment({
        service: selectedService,
        date: bookingDate,
        timeSlot: bookingTime,
        doctorId: selectedDoctorId,
        notes,
        rehabGoals,
      });

      // Reload appointments and invoices
      await loadData();

      // Automatically show the generated invoice to the patient!
      onSelectInvoice(res.invoice, res.appointment);

      // Reset booking inputs
      setNotes('');
      setRehabGoals('');
      setActiveTab('appointments');
    } catch (err: unknown) {
      setBookingError(err instanceof Error ? err.message : 'Booking failed.');
    } finally {
      setBookingLoading(false);
    }
  };

  // Cancel appointment
  const handleCancelAppointment = async (aptId: string) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      await api.updateAppointmentStatus(aptId, 'Cancelled');
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to cancel appointment');
    }
  };

  // Profile update
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setProfileSaving(true);
      const updated = await api.updateProfile({
        fullName: editFullName,
        phone: editPhone,
        email: editEmail,
        gender: editGender,
        age: editAge ? parseInt(editAge, 10) : undefined,
        medicalHistory: editHistory,
        emergencyContact: editEmergency,
      });
      onUpdateUser(updated);
      setProfileSavedMsg(true);
      setTimeout(() => setProfileSavedMsg(false), 3000);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setProfileSaving(false);
    }
  };

  // Export appointments CSV
  const handleExportAppointments = () => {
    const rows = appointments.map(a => ({
      'Appointment ID': a.id,
      'Service': a.service,
      'Doctor': a.doctorName,
      'Date': a.date,
      'Time Slot': a.timeSlot,
      'Fee': a.fee,
      'Status': a.status,
      'Notes': a.notes || '',
      'Rehab Goals': a.rehabGoals || ''
    }));
    exportToCsv(`FRL_MY_APPOINTMENTS_${user.fullName.replace(/\s+/g, '_')}`, rows);
  };

  const nextAppointment = appointments.find(
    a => a.status !== 'Cancelled' && a.status !== 'Completed'
  );

  const timeSlots = [
    '08:30 AM', '09:30 AM', '10:30 AM', '11:30 AM',
    '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM'
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Navigation Sub-Tabs (White and Fluorescent Orange) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 border-b border-gray-200 scrollbar-none mb-6">
        {[
          { id: 'overview', label: 'Clinical Overview', icon: Activity },
          { id: 'analysis', label: `Analysis & Recovery (${analyses.length})`, icon: TrendingUp },
          { id: 'book', label: 'Book Appointment', icon: PlusCircle },
          { id: 'appointments', label: `My Appointments (${appointments.length})`, icon: Calendar },
          { id: 'prescriptions', label: `Prescriptions (${prescriptions.length})`, icon: Pill },
          { id: 'invoices', label: `Invoices (${invoices.length})`, icon: FileText },
          { id: 'profile', label: 'Health Profile', icon: UserIcon },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab-patient-${tab.id}`}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer tracking-wider uppercase ${
                isActive
                  ? 'bg-[#FF5500] text-white shadow-[0_2px_12px_rgba(255,85,0,0.35)]'
                  : 'bg-white text-gray-700 hover:text-gray-900 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* VIEW: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Welcome Banner */}
          <div className="relative rounded-3xl bg-white border border-gray-200 p-6 sm:p-8 overflow-hidden shadow-sm">
            <div className="absolute top-0 right-0 w-80 h-full bg-[#FF5500]/5 blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <span className="inline-block px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-[#FF5500]/10 text-[#FF5500] border border-[#FF5500]/30 mb-2">
                  Patient Care Portal
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight font-display">
                  Welcome back, <span className="text-[#FF5500]">{user.fullName}</span>
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-gray-600 max-w-xl">
                  Track your personalized physical rehabilitation protocols, active doctor prescriptions, verified invoices, and clinic bookings.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => triggerPrint()}
                  className="flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-white border border-gray-300 hover:bg-gray-50 text-xs font-bold text-gray-800 transition cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-gray-700" />
                  <span>Print Summary</span>
                </button>
                <button
                  id="btn-quick-book"
                  onClick={() => setActiveTab('book')}
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#FF5500] hover:bg-[#E04B00] text-white font-extrabold text-xs tracking-wider uppercase transition shadow-md cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Book New Session</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-sm">
              <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Total Appointments</p>
              <p className="text-2xl font-black text-gray-900 mt-1 font-mono">{appointments.length}</p>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-sm">
              <p className="text-[10px] uppercase tracking-wider text-[#FF5500] font-bold">Active Prescriptions</p>
              <p className="text-2xl font-black text-[#FF5500] mt-1 font-mono">{prescriptions.length}</p>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-sm">
              <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Invoices Issued</p>
              <p className="text-2xl font-black text-gray-900 mt-1 font-mono">{invoices.length}</p>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-sm">
              <p className="text-[10px] uppercase tracking-wider text-emerald-600 font-bold">Direct Desk</p>
              <p className="text-sm font-bold text-gray-900 mt-1.5 font-mono">+91 80885 96486</p>
            </div>
          </div>

          {/* Active Next Appointment Card */}
          {nextAppointment ? (
            <div className="p-6 rounded-3xl bg-white border-2 border-[#FF5500]/30 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FF5500]/10 border border-[#FF5500]/30 flex items-center justify-center text-[#FF5500]">
                    <CalendarCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-[#FF5500]">
                      Upcoming Confirmed Session
                    </span>
                    <h3 className="text-base font-extrabold text-gray-900 mt-0.5">{nextAppointment.service}</h3>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FF5500]/10 text-[#FF5500] border border-[#FF5500]/30">
                  <span className="w-2 h-2 rounded-full bg-[#FF5500] animate-ping" />
                  {nextAppointment.status}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4 text-xs">
                <div>
                  <p className="text-gray-500 text-[10px] uppercase font-bold">Date & Time</p>
                  <p className="text-gray-900 font-semibold mt-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#FF5500]" />
                    {nextAppointment.date} at {nextAppointment.timeSlot}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-[10px] uppercase font-bold">Consulting Doctor</p>
                  <p className="text-gray-900 font-semibold mt-1">{nextAppointment.doctorName}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-[10px] uppercase font-bold">Clinic Location</p>
                  <p className="text-gray-700 mt-1">Indiranagar, Bengaluru (+91 80885 96486)</p>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex flex-wrap items-center gap-3">
                {/* View Invoice */}
                <button
                  id="btn-view-active-invoice"
                  onClick={() => {
                    const inv = invoices.find(i => i.appointmentId === nextAppointment.id || i.id === nextAppointment.invoiceId);
                    if (inv) onSelectInvoice(inv, nextAppointment);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 border border-gray-200 text-xs font-semibold text-gray-800 transition cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-[#FF5500]" />
                  <span>View Tax Invoice</span>
                </button>

                {/* WhatsApp Chat Button */}
                <a
                  href={generateWhatsAppBookingUrl(
                    nextAppointment,
                    invoices.find(i => i.appointmentId === nextAppointment.id) || {
                      id: nextAppointment.invoiceId,
                      invoiceNumber: 'FRL-INV',
                      appointmentId: nextAppointment.id,
                      patientId: nextAppointment.patientId,
                      patientName: nextAppointment.patientName,
                      patientPhone: nextAppointment.patientPhone,
                      doctorName: nextAppointment.doctorName,
                      date: nextAppointment.date,
                      items: [],
                      subtotal: nextAppointment.fee,
                      tax: 0,
                      discount: 0,
                      total: nextAppointment.fee,
                      paymentStatus: 'Paid',
                      paymentMethod: 'UPI / Card',
                      clinicInfo: {} as any,
                      createdAt: nextAppointment.createdAt
                    }
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-bold transition cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Send to WhatsApp (+91 80885 96486)</span>
                </a>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-3xl bg-white border border-gray-200 text-center shadow-sm">
              <Calendar className="w-10 h-10 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-gray-900">No Upcoming Appointments</p>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                Schedule your next physiotherapy or sports injury rehabilitation session with Dr. Anand G R.
              </p>
              <button
                onClick={() => setActiveTab('book')}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FF5500] text-white font-bold text-xs uppercase transition cursor-pointer"
              >
                <span>Book Appointment</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Recent Prescription Preview if available */}
          {prescriptions.length > 0 && (
            <div className="p-6 rounded-3xl bg-white border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <Pill className="w-4 h-4 text-[#FF5500]" />
                  <h3 className="text-sm font-extrabold text-gray-900 font-display">Active Exercise Prescription</h3>
                </div>
                <button
                  onClick={() => setActiveTab('prescriptions')}
                  className="text-xs text-[#FF5500] hover:underline font-bold"
                >
                  View All ({prescriptions.length})
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-extrabold text-gray-900">{prescriptions[0].diagnosis}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Issued by {prescriptions[0].doctorName} on {prescriptions[0].date}
                    </p>
                  </div>
                  <button
                    onClick={() => onSelectPrescription(prescriptions[0])}
                    className="self-start sm:self-center px-3.5 py-1.5 rounded-xl bg-[#FF5500]/10 hover:bg-[#FF5500]/20 text-[#FF5500] border border-[#FF5500]/30 text-xs font-bold transition cursor-pointer"
                  >
                    Open Exercises & Protocol
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Biomechanical Analysis Preview */}
          {analyses.length > 0 ? (
            <div className="p-6 rounded-3xl bg-white border border-gray-200 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FF5500]/10 border border-[#FF5500]/30 flex items-center justify-center text-[#FF5500]">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-[#FF5500]">
                      Biomechanical Recovery Assessment
                    </span>
                    <h3 className="text-base font-extrabold text-gray-900 mt-0.5">{analyses[0].primaryDiagnosis}</h3>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border border-[#FF5500]/30 text-[#FF5500] bg-[#FF5500]/10">
                    {analyses[0].rehabPhase}
                  </span>
                  <button
                    onClick={() => setActiveTab('analysis')}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#FF5500] hover:bg-[#E04B00] text-white text-xs font-bold transition cursor-pointer"
                  >
                    <span>View Complete Report</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-4">
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">VAS Pain Score</p>
                  <p className="text-xl font-black text-gray-900 font-mono mt-1">{analyses[0].vasPainScore} <span className="text-xs text-gray-400">/ 10</span></p>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <p className="text-[10px] uppercase tracking-wider text-[#FF5500] font-bold">Functional Recovery</p>
                  <p className="text-xl font-black text-[#FF5500] font-mono mt-1">{analyses[0].functionalIndex}%</p>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <p className="text-[10px] uppercase tracking-wider text-amber-600 font-bold">RTS Readiness</p>
                  <p className="text-xl font-black text-amber-600 font-mono mt-1">{analyses[0].readinessToReturnPercent}%</p>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <p className="text-[10px] uppercase tracking-wider text-emerald-600 font-bold">FMS Movement</p>
                  <p className="text-xl font-black text-emerald-600 font-mono mt-1">{analyses[0].fmsTotal} <span className="text-xs text-gray-400">/ 21</span></p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-3xl bg-white border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#FF5500]/10 border border-[#FF5500]/30 flex items-center justify-center text-[#FF5500]">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Biomechanical Analysis Pending</h4>
                  <p className="text-xs text-gray-500 mt-0.5">Your physician will record your kinematic range of motion and strength asymmetry during your assessment.</p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('book')}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-800 text-xs font-bold transition cursor-pointer whitespace-nowrap"
              >
                Schedule Evaluation
              </button>
            </div>
          )}
        </div>
      )}

      {/* VIEW: BOOK APPOINTMENT */}
      {activeTab === 'book' && (
        <div className="max-w-2xl mx-auto bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
            <div className="w-10 h-10 rounded-xl bg-[#FF5500]/10 border border-[#FF5500]/30 flex items-center justify-center text-[#FF5500]">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900 font-display">Book Rehabilitation Appointment</h2>
              <p className="text-xs text-gray-500">
                Instantly generates a tax invoice & WhatsApp confirmation (+91 80885 96486)
              </p>
            </div>
          </div>

          {bookingError && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
              {bookingError}
            </div>
          )}

          <form onSubmit={handleBookAppointment} className="space-y-4">
            {/* Service Selection */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                1. Select Rehabilitation Specialty *
              </label>
              <div className="space-y-2">
                {services.map((srv) => (
                  <div
                    key={srv.id}
                    onClick={() => setSelectedService(srv.name)}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                      selectedService === srv.name
                        ? 'border-[#FF5500] bg-[#FF5500]/5 shadow-sm'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold text-gray-900">{srv.name}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">{srv.description}</p>
                      <span className="text-[10px] text-gray-400 mt-1 inline-block">Duration: {srv.duration}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-sm font-mono font-bold text-[#FF5500]">₹{srv.fee}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Doctor Selection */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                2. Consulting Doctor
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div
                  onClick={() => setSelectedDoctorId('doc-1')}
                  className={`p-3 rounded-2xl border transition cursor-pointer ${
                    selectedDoctorId === 'doc-1'
                      ? 'border-[#FF5500] bg-[#FF5500]/5'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <p className="text-xs font-bold text-gray-900">Dr. Anand G R (PT)</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Lead Sports Physio</p>
                </div>
                <div
                  onClick={() => setSelectedDoctorId('admin-1')}
                  className={`p-3 rounded-2xl border transition cursor-pointer ${
                    selectedDoctorId === 'admin-1'
                      ? 'border-[#FF5500] bg-[#FF5500]/5'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <p className="text-xs font-bold text-gray-900">Dr. Ananya Sharma</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Senior Consultant</p>
                </div>
              </div>
            </div>

            {/* Date & Time Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  3. Preferred Date *
                </label>
                <input
                  id="input-booking-date"
                  type="date"
                  value={bookingDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setBookingDate(e.target.value)}
                  required
                  className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:border-[#FF5500] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  4. Time Slot *
                </label>
                <select
                  id="select-booking-time"
                  value={bookingTime}
                  onChange={(e) => setBookingTime(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:border-[#FF5500] outline-none"
                >
                  {timeSlots.map((ts) => (
                    <option key={ts} value={ts}>{ts}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Rehabilitation Goals & Notes */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Specific Injury Complaints / Goals
              </label>
              <textarea
                id="input-booking-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="e.g. Sharp hamstring pain while sprinting, need dry needling and biomechanical screening..."
                className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-xs text-gray-900 placeholder-gray-400 focus:border-[#FF5500] outline-none resize-none"
              />
            </div>

            {/* Submit Booking */}
            <div className="pt-4 border-t border-gray-100">
              <button
                id="btn-submit-booking"
                type="submit"
                disabled={bookingLoading}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#FF5500] hover:bg-[#E04B00] text-white font-extrabold text-xs uppercase tracking-wider transition shadow-md disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {bookingLoading ? 'Saving & Generating Invoice...' : 'Confirm Appointment & Generate Invoice'}
                <ArrowRight className="w-4 h-4" />
              </button>
              <p className="text-[11px] text-gray-500 text-center mt-2">
                A verified tax receipt and direct WhatsApp booking message (+91 80885 96486) are created instantly.
              </p>
            </div>
          </form>
        </div>
      )}

      {/* VIEW: MY APPOINTMENTS */}
      {activeTab === 'appointments' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
            <div>
              <h2 className="text-lg font-black text-gray-900 font-display">Appointment History & Status</h2>
              <p className="text-xs text-gray-500">View current status, invoices, and WhatsApp details</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportAppointments}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-gray-300 hover:bg-gray-50 text-xs font-bold text-gray-800 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[#FF5500]" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={() => triggerPrint()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-800 transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-gray-700" />
                <span>Print</span>
              </button>
              <button
                onClick={() => setActiveTab('book')}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FF5500] text-white font-bold text-xs uppercase cursor-pointer shadow-sm"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Book Appointment</span>
              </button>
            </div>
          </div>

          {appointments.length === 0 ? (
            <div className="p-12 rounded-3xl bg-white border border-gray-200 text-center shadow-sm">
              <Calendar className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-gray-800">No appointments scheduled</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {appointments.map((apt) => {
                const invoice = invoices.find(i => i.appointmentId === apt.id || i.id === apt.invoiceId);
                const isUpcoming = apt.status === 'Scheduled' || apt.status === 'Confirmed' || apt.status === 'In Progress';

                return (
                  <div
                    key={apt.id}
                    className="p-5 rounded-2xl bg-white border border-gray-200 hover:border-[#FF5500]/50 transition shadow-sm"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-extrabold text-gray-900">{apt.service}</span>
                          <span className="text-[10px] text-gray-500 font-mono">ID: {apt.id}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Doctor: <strong className="text-gray-800">{apt.doctorName}</strong>
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold border ${
                            apt.status === 'Completed'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : apt.status === 'Confirmed'
                              ? 'bg-[#FF5500]/10 text-[#FF5500] border-[#FF5500]/30'
                              : apt.status === 'Cancelled'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}
                        >
                          {apt.status}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 text-xs">
                      <div>
                        <p className="text-[10px] uppercase text-gray-500 font-bold">Appointment Date</p>
                        <p className="text-gray-900 font-semibold mt-0.5">{apt.date}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase text-gray-500 font-bold">Time Slot</p>
                        <p className="text-gray-900 font-semibold mt-0.5">{apt.timeSlot}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase text-gray-500 font-bold">Rehab Fee</p>
                        <p className="text-[#FF5500] font-mono font-bold mt-0.5">₹{apt.fee}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase text-gray-500 font-bold">Clinic Helpline</p>
                        <p className="text-gray-800 font-mono mt-0.5">+91 80885 96486</p>
                      </div>
                    </div>

                    {apt.notes && (
                      <p className="text-xs text-gray-600 bg-gray-50 p-2.5 rounded-xl border border-gray-200 mb-3">
                        Notes: {apt.notes}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
                      {invoice && (
                        <button
                          onClick={() => onSelectInvoice(invoice, apt)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-800 border border-gray-200 transition cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-[#FF5500]" />
                          <span>View Invoice #{invoice.invoiceNumber}</span>
                        </button>
                      )}

                      {/* WhatsApp Button */}
                      <a
                        href={generateWhatsAppBookingUrl(
                          apt,
                          invoice || {
                            id: apt.invoiceId,
                            invoiceNumber: 'FRL-INV',
                            appointmentId: apt.id,
                            patientId: apt.patientId,
                            patientName: apt.patientName,
                            patientPhone: apt.patientPhone,
                            doctorName: apt.doctorName,
                            date: apt.date,
                            items: [],
                            subtotal: apt.fee,
                            tax: 0,
                            discount: 0,
                            total: apt.fee,
                            paymentStatus: 'Paid',
                            paymentMethod: 'UPI / Card',
                            clinicInfo: {} as any,
                            createdAt: apt.createdAt
                          }
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition cursor-pointer"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>WhatsApp Desk (+91 80885 96486)</span>
                      </a>

                      {isUpcoming && (
                        <button
                          onClick={() => handleCancelAppointment(apt.id)}
                          className="ml-auto text-xs text-rose-600 hover:text-rose-700 font-bold px-2 py-1 rounded hover:bg-rose-50 transition cursor-pointer"
                        >
                          Cancel Appointment
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW: PRESCRIPTIONS */}
      {activeTab === 'prescriptions' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-black text-gray-900 font-display">Clinical Rehabilitation Prescriptions</h2>
            <p className="text-xs text-gray-500">Doctor-assigned kinetic protocols, repetitions, and precautions</p>
          </div>

          {prescriptions.length === 0 ? (
            <div className="p-12 rounded-3xl bg-white border border-gray-200 text-center shadow-sm">
              <Pill className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-gray-800">No prescriptions issued yet</p>
              <p className="text-xs text-gray-500 mt-1">Your doctor will prescribe protocols during your appointment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {prescriptions.map((rx) => (
                <div
                  key={rx.id}
                  className="p-5 rounded-2xl bg-white border border-gray-200 hover:border-[#FF5500]/50 transition shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-[#FF5500]">
                        Clinical Diagnosis
                      </span>
                      <h3 className="text-base font-extrabold text-gray-900">{rx.diagnosis}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Attending Doctor: <strong className="text-gray-800">{rx.doctorName}</strong> • Date: {rx.date}
                      </p>
                    </div>

                    <button
                      onClick={() => onSelectPrescription(rx)}
                      className="px-4 py-2 rounded-xl bg-[#FF5500] hover:bg-[#E04B00] text-white font-bold text-xs uppercase tracking-wider transition cursor-pointer shadow-xs shrink-0 self-start sm:self-center"
                    >
                      View Full Protocol
                    </button>
                  </div>

                  {/* Summary of exercises */}
                  <div className="py-3">
                    <p className="text-[11px] text-gray-500 uppercase font-bold tracking-wider mb-2">
                      Prescribed Exercises ({rx.exercises?.length || 0})
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {rx.exercises?.map((ex, i) => (
                        <div key={i} className="p-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs">
                          <p className="font-bold text-gray-900">{ex.name}</p>
                          <p className="text-gray-600 text-[11px] mt-0.5">
                            {ex.sets} Sets × {ex.repsOrDuration} • {ex.frequency}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {rx.nextFollowUp && (
                    <div className="pt-2 border-t border-gray-100 text-xs text-gray-600">
                      <span>Follow-up Review Date: </span>
                      <strong className="text-[#FF5500]">{rx.nextFollowUp}</strong>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW: INVOICES */}
      {activeTab === 'invoices' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-gray-900 font-display">Invoices & Payment Receipts</h2>
              <p className="text-xs text-gray-500">Official GST-compliant medical invoices</p>
            </div>
            <button
              onClick={() => {
                const rows = invoices.map(i => ({
                  'Invoice #': i.invoiceNumber,
                  'Date': i.date,
                  'Doctor': i.doctorName,
                  'Amount (INR)': i.total,
                  'Status': i.paymentStatus,
                  'Method': i.paymentMethod
                }));
                exportToCsv(`FRL_INVOICES_${user.fullName.replace(/\s+/g, '_')}`, rows);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-gray-300 hover:bg-gray-50 text-xs font-bold text-gray-800 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#FF5500]" />
              <span>Export Invoices CSV</span>
            </button>
          </div>

          {invoices.length === 0 ? (
            <div className="p-12 rounded-3xl bg-white border border-gray-200 text-center shadow-sm">
              <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-gray-800">No invoices found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {invoices.map((inv) => (
                <div
                  key={inv.id}
                  className="p-4 rounded-2xl bg-white border border-gray-200 hover:border-[#FF5500]/50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-gray-900 text-sm">{inv.invoiceNumber}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {inv.paymentStatus}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {inv.items[0]?.description || 'Physical Rehabilitation'}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Doctor: {inv.doctorName} • Date: {inv.date}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] uppercase text-gray-500 font-bold block">Total Amount</span>
                      <span className="text-base font-mono font-bold text-[#FF5500]">
                        ₹{inv.total.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <button
                      onClick={() => onSelectInvoice(inv)}
                      className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-800 border border-gray-200 transition cursor-pointer"
                    >
                      View Receipt
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW: BIOMECHANICAL ANALYSIS & RECOVERY */}
      {activeTab === 'analysis' && (
        <div className="space-y-6">
          {analyses.length > 0 ? (
            <div>
              {/* Session Selector if multiple */}
              {analyses.length > 1 && (
                <div className="flex items-center gap-2 mb-4 p-2 bg-white border border-gray-200 rounded-2xl overflow-x-auto shadow-sm">
                  <span className="text-xs font-bold text-gray-600 px-3 uppercase tracking-wider whitespace-nowrap">
                    Evaluation Sessions:
                  </span>
                  {analyses.map((anl, index) => (
                    <button
                      key={anl.id}
                      onClick={() => setSelectedAnalysisId(anl.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                        (selectedAnalysisId === anl.id || (!selectedAnalysisId && index === 0))
                          ? 'bg-[#FF5500] text-white font-extrabold shadow-sm'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                      }`}
                    >
                      {anl.date} &bull; {anl.rehabPhase.split(':')[0]}
                    </button>
                  ))}
                </div>
              )}

              {/* Render Selected Analysis */}
              {(() => {
                const currentAnalysis = analyses.find(a => a.id === selectedAnalysisId) || analyses[0];
                return (
                  <PatientAnalysisView
                    analysis={currentAnalysis}
                    currentUser={user}
                  />
                );
              })()}
            </div>
          ) : (
            <div className="p-12 rounded-3xl bg-white border border-gray-200 text-center max-w-2xl mx-auto shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-[#FF5500]/10 border border-[#FF5500]/30 flex items-center justify-center text-[#FF5500] mx-auto mb-4">
                <TrendingUp className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-black text-gray-900 font-display">Biomechanical Assessment Pending</h3>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                Your quantitative kinematic data—including goniometric joint Range of Motion (ROM), dynamometric muscle torque symmetry (LSI), and Functional Movement Screen (FMS)—will appear here once conducted by Dr. Anand G R or your attending specialist.
              </p>
              <div className="mt-6 flex items-center justify-center gap-3">
                <button
                  onClick={() => setActiveTab('book')}
                  className="px-5 py-2.5 rounded-xl bg-[#FF5500] hover:bg-[#E04B00] text-white font-bold text-xs uppercase tracking-wider transition cursor-pointer"
                >
                  Schedule Assessment Session
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW: HEALTH PROFILE */}
      {activeTab === 'profile' && (
        <div className="max-w-2xl mx-auto bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
            <div className="w-10 h-10 rounded-xl bg-[#FF5500]/10 border border-[#FF5500]/30 flex items-center justify-center text-[#FF5500]">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900 font-display">Patient Health & Clinical Profile</h2>
              <p className="text-xs text-gray-500">Keep medical history and emergency contacts updated</p>
            </div>
          </div>

          {profileSavedMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
              Profile updated successfully in the cloud database!
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-xs text-gray-900 focus:border-[#FF5500] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Phone Number</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-xs text-gray-900 focus:border-[#FF5500] outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-xs text-gray-900 focus:border-[#FF5500] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Age</label>
                <input
                  type="number"
                  value={editAge}
                  onChange={(e) => setEditAge(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">
                Medical & Injury History
              </label>
              <textarea
                value={editHistory}
                onChange={(e) => setEditHistory(e.target.value)}
                rows={3}
                placeholder="Prior surgeries, ligament injuries, chronic musculoskeletal stiffness..."
                className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-xs text-gray-900 focus:border-[#FF5500] outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">
                Emergency Contact (Name & Mobile)
              </label>
              <input
                type="text"
                value={editEmergency}
                onChange={(e) => setEditEmergency(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-xs text-gray-900 focus:border-[#FF5500] outline-none"
              />
            </div>

            <div className="pt-3 border-t border-gray-100">
              <button
                type="submit"
                disabled={profileSaving}
                className="w-full py-3 rounded-xl bg-[#FF5500] hover:bg-[#E04B00] text-white font-extrabold text-xs uppercase tracking-wider transition shadow-md disabled:opacity-50 cursor-pointer"
              >
                {profileSaving ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
