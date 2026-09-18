import React, { useState, useEffect } from 'react';
import {
  User,
  Appointment,
  Invoice,
  Prescription,
  AppointmentStatus,
  ExercisePrescriptionItem,
  MedicationPrescriptionItem,
  PatientAnalysis
} from '../types.js';
import { api, generateWhatsAppBookingUrl } from '../services/api.js';
import { exportToCsv, exportToJson, triggerPrint } from '../utils/exportUtils.js';
import { PatientAnalysisView } from './PatientAnalysisView.js';
import { PatientAnalysisEditorModal } from './PatientAnalysisEditorModal.js';
import {
  Activity,
  Calendar,
  Clock,
  Users,
  Pill,
  Send,
  FileText,
  Search,
  CheckCircle,
  XCircle,
  AlertCircle,
  Share2,
  Plus,
  Trash2,
  ChevronRight,
  Sparkles,
  Phone,
  UserCheck,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  Edit3,
  Sliders,
  Dumbbell,
  BarChart3,
  Eye,
  Printer,
  Download,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';

interface DoctorDashboardProps {
  user: User;
  onSelectInvoice: (invoice: Invoice, appointment?: Appointment) => void;
  onSelectPrescription: (prescription: Prescription) => void;
}

export const DoctorDashboard: React.FC<DoctorDashboardProps> = ({
  user,
  onSelectInvoice,
  onSelectPrescription,
}) => {
  const [activeTab, setActiveTab] = useState<'today' | 'bookings' | 'patients' | 'analysis' | 'create-rx' | 'notifications'>('today');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [analyses, setAnalyses] = useState<PatientAnalysis[]>([]);
  const [patients, setPatients] = useState<(User & {
    appointmentCount: number;
    prescriptionCount: number;
    invoiceCount: number;
    lastVisitDate: string | null;
    lastService: string | null;
  })[]>([]);
  const [loading, setLoading] = useState(true);

  // Analysis state & modals
  const [selectedAnalysisForView, setSelectedAnalysisForView] = useState<PatientAnalysis | null>(null);
  const [selectedAnalysisForEdit, setSelectedAnalysisForEdit] = useState<PatientAnalysis | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorPresetPatientId, setEditorPresetPatientId] = useState<string | undefined>(undefined);
  const [analysisSearchTerm, setAnalysisSearchTerm] = useState('');
  const [analysisPhaseFilter, setAnalysisPhaseFilter] = useState('ALL');

  // Search & Filter for Appointments
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Delete Appointment Modal State
  const [appointmentToDelete, setAppointmentToDelete] = useState<Appointment | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Patient History Drawer
  const [selectedPatientHistory, setSelectedPatientHistory] = useState<{
    patient: User;
    appointments: Appointment[];
    prescriptions: Prescription[];
    invoices: Invoice[];
    analyses?: PatientAnalysis[];
  } | null>(null);

  // Prescription Form State
  const [rxPatientId, setRxPatientId] = useState('');
  const [rxDiagnosis, setRxDiagnosis] = useState('');
  const [rxSymptoms, setRxSymptoms] = useState('');
  const [rxExercises, setRxExercises] = useState<ExercisePrescriptionItem[]>([
    { id: '1', name: 'Isometric Quad Sets & Terminal Knee Extensions', sets: 3, repsOrDuration: '15 reps / 5s hold', frequency: '2x Daily', notes: 'Maintain neutral spine, emphasize VMO activation' },
    { id: '2', name: 'Eccentric Hamstring Slider Curls', sets: 3, repsOrDuration: '10 reps', frequency: 'Once Daily', notes: 'Slow 4-second tempo during the eccentric lengthening' },
  ]);
  const [rxMedications, setRxMedications] = useState<MedicationPrescriptionItem[]>([
    { id: '1', name: 'Cryotherapy & Contrast Thermal Protocol', dosage: '15 mins', frequency: 'Post-exercise', duration: '10 Days', instructions: 'Ice pack wrapped in moist towel' },
  ]);
  const [rxPrecautions, setRxPrecautions] = useState<string>('Avoid high-impact sprinting until next clinical assessment.\nDo not push into sharp pain (>3/10 VAS scale).');
  const [rxLifestyle, setRxLifestyle] = useState('Maintain adequate hydration and dynamic mobility warm-ups.');
  const [rxFollowUp, setRxFollowUp] = useState('In 7 Days');
  const [rxSubmitting, setRxSubmitting] = useState(false);
  const [rxSuccessMsg, setRxSuccessMsg] = useState(false);

  // Notification Form State
  const [notifRecipientId, setNotifRecipientId] = useState('ALL');
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifType, setNotifType] = useState('clinical_alert');
  const [notifSending, setNotifSending] = useState(false);
  const [notifSuccess, setNotifSuccess] = useState(false);

  const notifySuccess = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(null), 3500);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [apts, invs, rxs, pts, anls] = await Promise.all([
        api.getAppointments(),
        api.getInvoices(),
        api.getPrescriptions(),
        api.getPatients(),
        api.getAnalyses(),
      ]);
      setAppointments(apts);
      setInvoices(invs);
      setPrescriptions(rxs);
      setPatients(pts);
      setAnalyses(anls);
      if (pts.length > 0 && !rxPatientId) {
        setRxPatientId(pts[0].id);
      }
    } catch (err) {
      console.error('Failed to load doctor dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Status Updater
  const handleUpdateStatus = async (id: string, newStatus: AppointmentStatus) => {
    try {
      const updated = await api.updateAppointmentStatus(id, newStatus);
      setAppointments(prev => prev.map(a => a.id === id ? updated : a));
      notifySuccess(`Status updated to ${newStatus}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  // Delete Appointment Handler
  const handleConfirmDeleteAppointment = async () => {
    if (!appointmentToDelete) return;
    try {
      setDeleteLoading(true);
      await api.deleteAppointment(appointmentToDelete.id);
      setAppointments(prev => prev.filter(a => a.id !== appointmentToDelete.id));
      notifySuccess(`Appointment for ${appointmentToDelete.patientName} deleted successfully.`);
      setAppointmentToDelete(null);
    } catch (err) {
      console.error('Failed to delete appointment:', err);
      alert('Failed to delete appointment: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setDeleteLoading(false);
    }
  };

  // Export Appointments to CSV
  const handleExportAppointmentsCsv = () => {
    const rows = filteredAppointments.map(a => ({
      'Appointment ID': a.id,
      'Patient Name': a.patientName,
      'Phone': a.patientPhone,
      'Service': a.service,
      'Doctor': a.doctorName,
      'Date': a.date,
      'Time Slot': a.timeSlot,
      'Fee (INR)': a.fee,
      'Status': a.status,
      'Notes': a.notes || '',
      'Rehab Goals': a.rehabGoals || '',
      'Created At': a.createdAt
    }));
    exportToCsv(`FRL_APPOINTMENTS_${new Date().toISOString().slice(0, 10)}`, rows);
    notifySuccess('Appointments exported to CSV!');
  };

  const handleDeleteAnalysis = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm('Are you sure you want to delete this clinical biomechanical assessment?')) return;
    try {
      await api.deleteAnalysis(id);
      if (selectedAnalysisForView?.id === id) {
        setSelectedAnalysisForView(null);
      }
      await loadData();
      notifySuccess('Analysis deleted successfully.');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete analysis');
    }
  };

  // Prescription Dynamic Handlers
  const addExerciseRow = () => {
    setRxExercises([
      ...rxExercises,
      {
        id: Date.now().toString(),
        name: '',
        sets: 3,
        repsOrDuration: '10 reps',
        frequency: 'Daily',
        notes: ''
      }
    ]);
  };

  const removeExerciseRow = (id: string) => {
    setRxExercises(rxExercises.filter(ex => ex.id !== id));
  };

  const updateExercise = (id: string, field: keyof ExercisePrescriptionItem, val: any) => {
    setRxExercises(rxExercises.map(ex => ex.id === id ? { ...ex, [field]: val } : ex));
  };

  const addMedicationRow = () => {
    setRxMedications([
      ...rxMedications,
      {
        id: Date.now().toString(),
        name: '',
        dosage: '',
        frequency: '',
        duration: '',
        instructions: ''
      }
    ]);
  };

  const removeMedicationRow = (id: string) => {
    setRxMedications(rxMedications.filter(m => m.id !== id));
  };

  const updateMedication = (id: string, field: keyof MedicationPrescriptionItem, val: any) => {
    setRxMedications(rxMedications.map(m => m.id === id ? { ...m, [field]: val } : m));
  };

  // Submit Prescription
  const handleSubmitPrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rxPatientId || !rxDiagnosis) {
      alert('Please select patient and input clinical diagnosis.');
      return;
    }

    try {
      setRxSubmitting(true);
      const precautionsList = rxPrecautions
        .split('\n')
        .map(p => p.trim())
        .filter(Boolean);

      const createdRx = await api.createPrescription({
        patientId: rxPatientId,
        diagnosis: rxDiagnosis,
        symptoms: rxSymptoms,
        exercises: rxExercises.filter(e => e.name.trim()),
        medications: rxMedications.filter(m => m.name.trim()),
        precautions: precautionsList,
        lifestyleAdvice: rxLifestyle,
        nextFollowUp: rxFollowUp
      });

      setPrescriptions([createdRx, ...prescriptions]);
      setRxSuccessMsg(true);
      notifySuccess('Prescription issued successfully!');
      setTimeout(() => setRxSuccessMsg(false), 3500);

      // Reset
      setRxDiagnosis('');
      setRxSymptoms('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to submit prescription');
    } finally {
      setRxSubmitting(false);
    }
  };

  // Send Notification
  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle || !notifMessage) {
      alert('Please fill out title and message');
      return;
    }

    try {
      setNotifSending(true);
      await api.sendNotification({
        recipientId: notifRecipientId,
        title: notifTitle,
        message: notifMessage,
        type: notifType
      });
      setNotifSuccess(true);
      notifySuccess('Notification broadcast sent!');
      setNotifTitle('');
      setNotifMessage('');
      setTimeout(() => setNotifSuccess(false), 3000);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to send notification');
    } finally {
      setNotifSending(false);
    }
  };

  // Open Patient History
  const handleOpenPatientHistory = async (patientId: string) => {
    try {
      const history = await api.getPatientHistory(patientId);
      setSelectedPatientHistory(history);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to fetch patient history');
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments.filter(a => a.date === todayStr);

  const filteredAppointments = appointments.filter(a => {
    const matchesSearch =
      a.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.patientPhone.includes(searchTerm) ||
      a.service.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Toast Alert */}
      {actionSuccessMsg && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 bg-white border-2 border-[#FF5500] text-gray-900 px-5 py-3 rounded-2xl shadow-[0_8px_30px_rgba(255,85,0,0.25)] animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-[#FF5500] shrink-0" />
          <span className="text-xs sm:text-sm font-bold">{actionSuccessMsg}</span>
        </div>
      )}

      {/* Navigation Sub-Tabs (White and Fluorescent Orange) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 border-b border-gray-200 scrollbar-none mb-6">
        {[
          { id: 'today', label: `Today's Queue (${todayAppointments.length})`, icon: Clock },
          { id: 'bookings', label: `All Patient Bookings (${appointments.length})`, icon: Calendar },
          { id: 'patients', label: `Patient Directory (${patients.length})`, icon: Users },
          { id: 'analysis', label: `Biomechanical Analysis (${analyses.length})`, icon: TrendingUp },
          { id: 'create-rx', label: 'Create Prescription', icon: Pill },
          { id: 'notifications', label: 'Send Notifications', icon: Send },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab-doctor-${tab.id}`}
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

      {/* METRIC STRIP (White & Fluorescent Orange) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-sm">
          <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Total Consultations</p>
          <p className="text-2xl font-black text-gray-900 mt-1 font-mono">{appointments.length}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">All Bookings</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-sm">
          <p className="text-[10px] uppercase tracking-wider text-[#FF5500] font-bold">Today's Scheduled</p>
          <p className="text-2xl font-black text-[#FF5500] mt-1 font-mono">{todayAppointments.length}</p>
          <p className="text-[11px] text-[#FF5500] font-semibold mt-0.5 font-mono">{todayStr}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-sm">
          <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Biomechanical Tests</p>
          <p className="text-2xl font-black text-gray-900 mt-1 font-mono">{analyses.length}</p>
          <p className="text-[11px] text-blue-600 font-semibold mt-0.5">Kinematic ROM & FMS</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-sm">
          <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Active Prescriptions</p>
          <p className="text-2xl font-black text-emerald-600 mt-1 font-mono">{prescriptions.length}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">Clinical Protocols</p>
        </div>
      </div>

      {/* ============================================================== */}
      {/* TAB: TODAY'S QUEUE                                             */}
      {/* ============================================================== */}
      {activeTab === 'today' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-black text-gray-900 font-display">Today's Clinical Appointment Queue</h2>
              <p className="text-xs text-gray-500">
                Scheduled consultations for today ({todayStr}). Manage live session status or remove mistaken slots.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => triggerPrint()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-gray-300 hover:bg-gray-50 text-xs font-bold text-gray-800 transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-gray-700" />
                <span>Print Queue</span>
              </button>
              <span className="self-start sm:self-center px-3 py-1.5 rounded-xl text-xs font-black bg-[#FF5500]/10 text-[#FF5500] border border-[#FF5500]/30 font-mono">
                Date: {todayStr}
              </span>
            </div>
          </div>

          {todayAppointments.length === 0 ? (
            <div className="p-12 rounded-3xl bg-white border border-gray-200 text-center shadow-sm">
              <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-gray-800">No Sessions Scheduled Today</p>
              <p className="text-xs text-gray-500 mt-1">
                Check the "All Patient Bookings" tab to review upcoming dates.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {todayAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="p-4 sm:p-5 rounded-2xl bg-white border border-gray-200 hover:border-[#FF5500]/50 transition shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#FF5500]/10 border border-[#FF5500]/30 flex items-center justify-center text-[#FF5500] font-bold">
                        <UserCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-extrabold text-gray-900">{apt.patientName}</h3>
                        <p className="text-xs text-gray-500">
                          {apt.service} • <span className="text-[#FF5500] font-bold font-mono">{apt.timeSlot}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={apt.status}
                        onChange={(e) => handleUpdateStatus(apt.id, e.target.value as AppointmentStatus)}
                        className="bg-white border border-gray-300 text-xs font-semibold text-gray-800 rounded-xl px-3 py-1.5 outline-none cursor-pointer focus:border-[#FF5500]"
                      >
                        <option value="Scheduled">Scheduled</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>

                      {/* Delete Appointment Button */}
                      <button
                        onClick={() => setAppointmentToDelete(apt)}
                        className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition cursor-pointer"
                        title="Delete Appointment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 text-xs">
                    <div className="text-gray-500">
                      <span>Phone: </span>
                      <strong className="text-gray-900 font-mono">{apt.patientPhone}</strong>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenPatientHistory(apt.patientId)}
                        className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition cursor-pointer"
                      >
                        History
                      </button>

                      <button
                        onClick={() => {
                          setRxPatientId(apt.patientId);
                          setActiveTab('create-rx');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-[#FF5500]/10 hover:bg-[#FF5500]/20 text-[#FF5500] text-xs font-bold transition cursor-pointer"
                      >
                        Prescribe
                      </button>

                      <a
                        href={generateWhatsAppBookingUrl(
                          apt,
                          invoices.find(i => i.appointmentId === apt.id) || {
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
                            paymentMethod: 'UPI / Cash',
                            clinicInfo: {} as any,
                            createdAt: apt.createdAt
                          }
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition flex items-center gap-1.5"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>WhatsApp Desk</span>
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB: ALL PATIENT BOOKINGS (With DELETE and PRINT/EXPORT)       */}
      {/* ============================================================== */}
      {activeTab === 'bookings' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-gray-900 font-display">All Patient Appointments</h2>
              <p className="text-xs text-gray-500">
                Audit list of past, today's, and future clinical sessions. Delete cancelled or duplicate entries.
              </p>
            </div>

            {/* Print, Export & Search Bar */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search patient, phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white border border-gray-300 rounded-xl pl-8 pr-3 py-1.5 text-xs text-gray-900 placeholder-gray-400 outline-none w-44 sm:w-56 focus:border-[#FF5500]"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white border border-gray-300 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-800 outline-none cursor-pointer focus:border-[#FF5500]"
              >
                <option value="ALL">All Statuses</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Confirmed">Confirmed</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>

              {/* EXPORT APPOINTMENTS CSV */}
              <button
                id="btn-doctor-export-appointments-csv"
                onClick={handleExportAppointmentsCsv}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-gray-300 hover:bg-gray-50 text-xs font-bold text-gray-800 transition cursor-pointer"
                title="Export Appointments CSV"
              >
                <Download className="w-3.5 h-3.5 text-[#FF5500]" />
                <span className="hidden sm:inline">Export CSV</span>
              </button>

              {/* PRINT SCHEDULE */}
              <button
                id="btn-doctor-print-appointments"
                onClick={() => triggerPrint()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-800 transition cursor-pointer"
                title="Print Appointment Schedule"
              >
                <Printer className="w-3.5 h-3.5 text-gray-700" />
                <span className="hidden sm:inline">Print</span>
              </button>
            </div>
          </div>

          <div className="border border-gray-200 rounded-3xl overflow-hidden bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4 font-bold">Patient</th>
                    <th className="py-3 px-3 font-bold">Service & Fee</th>
                    <th className="py-3 px-3 font-bold">Date & Slot</th>
                    <th className="py-3 px-3 font-bold">Status</th>
                    <th className="py-3 px-4 font-bold text-right">Actions (Delete / Invoice / Share)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredAppointments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-gray-500">
                        No appointments found matching your search.
                      </td>
                    </tr>
                  ) : (
                    filteredAppointments.map((apt) => {
                      const invoice = invoices.find(i => i.appointmentId === apt.id || i.id === apt.invoiceId);
                      return (
                        <tr key={apt.id} className="hover:bg-gray-50/70 transition">
                          <td className="py-3.5 px-4">
                            <p className="font-extrabold text-gray-900">{apt.patientName}</p>
                            <p className="text-[11px] text-gray-500 font-mono">{apt.patientPhone}</p>
                          </td>

                          <td className="py-3.5 px-3">
                            <p className="text-gray-800 font-semibold">{apt.service}</p>
                            <p className="text-[11px] text-[#FF5500] font-mono font-bold">₹{apt.fee}</p>
                          </td>

                          <td className="py-3.5 px-3">
                            <p className="text-gray-900 font-mono font-medium">{apt.date}</p>
                            <p className="text-[11px] text-gray-500">{apt.timeSlot}</p>
                          </td>

                          <td className="py-3.5 px-3">
                            <select
                              value={apt.status}
                              onChange={(e) => handleUpdateStatus(apt.id, e.target.value as AppointmentStatus)}
                              className="bg-white border border-gray-300 text-[11px] font-bold text-gray-800 rounded-lg px-2 py-1 outline-none cursor-pointer focus:border-[#FF5500]"
                            >
                              <option value="Scheduled">Scheduled</option>
                              <option value="Confirmed">Confirmed</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Completed">Completed</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {invoice && (
                                <button
                                  onClick={() => onSelectInvoice(invoice, apt)}
                                  className="p-1.5 rounded-lg bg-gray-100 hover:bg-[#FF5500]/10 text-gray-700 hover:text-[#FF5500] transition cursor-pointer"
                                  title="View Tax Invoice"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                </button>
                              )}

                              <button
                                onClick={() => handleOpenPatientHistory(apt.patientId)}
                                className="px-2 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-bold transition cursor-pointer"
                                title="Patient Medical History"
                              >
                                History
                              </button>

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
                                className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition cursor-pointer"
                                title="Share to WhatsApp"
                              >
                                <Share2 className="w-3.5 h-3.5" />
                              </a>

                              {/* DELETE BUTTON for Doctor */}
                              <button
                                id={`btn-delete-apt-${apt.id}`}
                                onClick={() => setAppointmentToDelete(apt)}
                                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition cursor-pointer"
                                title="Delete Appointment"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB: PATIENT DIRECTORY                                         */}
      {/* ============================================================== */}
      {activeTab === 'patients' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-black text-gray-900 font-display">Registered Patients Directory</h2>
              <p className="text-xs text-gray-500">View complete patient clinical files, visit audit, and history</p>
            </div>
            <button
              onClick={() => {
                const rows = patients.map(p => ({
                  'Patient Name': p.fullName,
                  'Phone': p.phone,
                  'Age': p.age,
                  'Gender': p.gender,
                  'Total Consultations': p.appointmentCount,
                  'Total Prescriptions': p.prescriptionCount,
                  'Medical History': p.medicalHistory || ''
                }));
                exportToCsv(`FRL_PATIENTS_${new Date().toISOString().slice(0, 10)}`, rows);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-gray-300 hover:bg-gray-50 text-xs font-bold text-gray-800 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#FF5500]" />
              <span>Export Roster CSV</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {patients.map((pat) => (
              <div
                key={pat.id}
                className="p-5 rounded-3xl bg-white border border-gray-200 hover:border-[#FF5500]/50 transition flex flex-col justify-between shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 pb-3 border-b border-gray-100">
                    <div>
                      <h3 className="text-sm font-extrabold text-gray-900">{pat.fullName}</h3>
                      <p className="text-xs text-gray-500 font-mono mt-0.5">{pat.phone}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FF5500]/10 text-[#FF5500] font-mono">
                      {pat.gender}, {pat.age || 30}y
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-3 text-center text-xs">
                    <div className="p-2 rounded-xl bg-gray-50 border border-gray-100">
                      <p className="text-[10px] uppercase text-gray-500 font-bold">Sessions</p>
                      <p className="font-mono font-bold text-gray-900 mt-0.5">{pat.appointmentCount}</p>
                    </div>
                    <div className="p-2 rounded-xl bg-gray-50 border border-gray-100">
                      <p className="text-[10px] uppercase text-[#FF5500] font-bold">Prescriptions</p>
                      <p className="font-mono font-bold text-[#FF5500] mt-0.5">{pat.prescriptionCount}</p>
                    </div>
                    <div className="p-2 rounded-xl bg-gray-50 border border-gray-100">
                      <p className="text-[10px] uppercase text-gray-500 font-bold">Invoices</p>
                      <p className="font-mono font-bold text-gray-900 mt-0.5">{pat.invoiceCount}</p>
                    </div>
                  </div>

                  {pat.medicalHistory && (
                    <div className="text-[11px] text-gray-600 bg-amber-50/70 p-2.5 rounded-xl border border-amber-200/80 line-clamp-2">
                      <strong className="text-amber-900">History:</strong> {pat.medicalHistory}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-gray-100 grid grid-cols-3 gap-2 mt-4">
                  <button
                    onClick={() => handleOpenPatientHistory(pat.id)}
                    className="py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-[11px] font-bold text-gray-800 transition cursor-pointer text-center"
                  >
                    History
                  </button>
                  <button
                    onClick={() => {
                      setEditorPresetPatientId(pat.id);
                      setSelectedAnalysisForEdit(null);
                      setIsEditorOpen(true);
                    }}
                    className="py-2 rounded-xl bg-[#FF5500]/10 hover:bg-[#FF5500]/20 text-[#FF5500] text-[11px] font-bold transition cursor-pointer text-center"
                  >
                    Assess
                  </button>
                  <button
                    onClick={() => {
                      setRxPatientId(pat.id);
                      setActiveTab('create-rx');
                    }}
                    className="py-2 rounded-xl bg-[#FF5500] hover:bg-[#E04B00] text-white text-[11px] font-extrabold transition cursor-pointer text-center"
                  >
                    Prescribe
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB: BIOMECHANICAL & MOVEMENT ANALYSIS                         */}
      {/* ============================================================== */}
      {activeTab === 'analysis' && (
        <div className="space-y-6">
          {/* Header & New Assessment CTA */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-full bg-[#FF5500]/5 blur-2xl pointer-events-none" />

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-[#FF5500]/10 text-[#FF5500] border border-[#FF5500]/30">
                  Biomechanical Diagnostic Lab
                </span>
                <span className="text-xs text-gray-500 font-mono">
                  {analyses.length} Clinical Reports
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 font-display">
                Patient Movement & Goniometric Analysis
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-1 max-w-xl">
                Quantitative tracking of joint Range of Motion (ROM), dynamometric peak torque limb symmetry (LSI), and Functional Movement Screen (FMS) recovery scoring.
              </p>
            </div>

            <button
              id="btn-create-biomechanical-assessment"
              onClick={() => {
                setSelectedAnalysisForEdit(null);
                setEditorPresetPatientId(patients.length > 0 ? patients[0].id : undefined);
                setIsEditorOpen(true);
              }}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#FF5500] hover:bg-[#E04B00] text-white font-black text-xs uppercase tracking-wider transition shadow-md cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Record New Assessment</span>
            </button>
          </div>

          {/* Search & Phase Filters */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={analysisSearchTerm}
                onChange={(e) => setAnalysisSearchTerm(e.target.value)}
                placeholder="Search patient, diagnosis, doctor..."
                className="w-full bg-white border border-gray-300 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-gray-900 placeholder-gray-400 focus:border-[#FF5500] outline-none shadow-xs"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {['ALL', 'Phase 1', 'Phase 2', 'Phase 3', 'Phase 4'].map((phaseKey) => {
                const isSelected =
                  phaseKey === 'ALL'
                    ? analysisPhaseFilter === 'ALL'
                    : analysisPhaseFilter.includes(phaseKey);
                return (
                  <button
                    key={phaseKey}
                    onClick={() => {
                      if (phaseKey === 'ALL') setAnalysisPhaseFilter('ALL');
                      else setAnalysisPhaseFilter(phaseKey);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                      isSelected
                        ? 'bg-[#FF5500] text-white shadow-xs'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    {phaseKey}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Analysis Cards Grid */}
          {(() => {
            const filtered = analyses.filter(anl => {
              const matchesSearch =
                anl.patientName.toLowerCase().includes(analysisSearchTerm.toLowerCase()) ||
                anl.primaryDiagnosis.toLowerCase().includes(analysisSearchTerm.toLowerCase()) ||
                anl.doctorName.toLowerCase().includes(analysisSearchTerm.toLowerCase());
              const matchesPhase =
                analysisPhaseFilter === 'ALL' ||
                anl.rehabPhase.toLowerCase().includes(analysisPhaseFilter.toLowerCase());
              return matchesSearch && matchesPhase;
            });

            if (filtered.length === 0) {
              return (
                <div className="p-12 text-center bg-white rounded-3xl border border-gray-200 shadow-sm">
                  <TrendingUp className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-gray-900">No Biomechanical Analyses Found</h3>
                  <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                    {analyses.length === 0
                      ? 'Record the first clinical assessment to analyze kinematic ROM, torque symmetry, and FMS scoring.'
                      : 'No assessments match your current search query or filter.'}
                  </p>
                  <button
                    onClick={() => {
                      setSelectedAnalysisForEdit(null);
                      setEditorPresetPatientId(patients.length > 0 ? patients[0].id : undefined);
                      setIsEditorOpen(true);
                    }}
                    className="mt-4 px-4 py-2 rounded-xl bg-[#FF5500] text-white font-bold text-xs uppercase tracking-wider cursor-pointer"
                  >
                    + Record Assessment
                  </button>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filtered.map(anl => {
                  const targetPatient = patients.find(p => p.id === anl.patientId);
                  const phone = targetPatient?.phone?.replace(/\D/g, '') || '8088596486';
                  const cleanPhone = phone.length === 10 ? `91${phone}` : phone;
                  const text = `*FUNCTIONAL REHAB LAB — BIOMECHANICAL REPORT*\n` +
                    `Patient: ${anl.patientName}\n` +
                    `Date: ${anl.date}\n` +
                    `Diagnosis: ${anl.primaryDiagnosis}\n` +
                    `Phase: ${anl.rehabPhase}\n` +
                    `VAS Pain: ${anl.vasPainScore}/10 | Recovery: ${anl.functionalIndex}% | RTS Readiness: ${anl.readinessToReturnPercent}%\n` +
                    `FMS Score: ${anl.fmsTotal}/21\n` +
                    `Assessing Doctor: ${anl.doctorName}\n` +
                    `Clinic: Indiranagar, Bengaluru (+91 80885 96486)`;
                  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
                  const primaryJoint = anl.romMetrics?.[0]?.joint || 'Kinetic Assessment';

                  return (
                    <div
                      key={anl.id}
                      className="p-5 rounded-3xl bg-white border border-gray-200 hover:border-[#FF5500]/50 transition space-y-4 shadow-sm flex flex-col justify-between"
                    >
                      <div>
                        {/* Header */}
                        <div className="flex items-start justify-between gap-3 pb-3 border-b border-gray-100">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-base font-extrabold text-gray-900 font-display">
                                {anl.patientName}
                              </h3>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-bold">
                                {anl.patientGender}, {anl.patientAge}y
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {primaryJoint} &bull; Evaluated {anl.date} by {anl.doctorName}
                            </p>
                          </div>

                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-[#FF5500]/10 text-[#FF5500] border border-[#FF5500]/30 whitespace-nowrap">
                            {anl.rehabPhase.split(':')[0]}
                          </span>
                        </div>

                        {/* Diagnosis */}
                        <div className="mt-3">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Primary Diagnosis</p>
                          <p className="text-xs font-semibold text-gray-800 mt-0.5">{anl.primaryDiagnosis}</p>
                        </div>

                        {/* Metric Strip */}
                        <div className="grid grid-cols-4 gap-2 py-3 text-center">
                          <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                            <p className="text-[9px] uppercase tracking-wider text-gray-500 font-bold">VAS Pain</p>
                            <p className="text-base font-black text-gray-900 font-mono mt-0.5">{anl.vasPainScore} <span className="text-[10px] text-gray-400">/10</span></p>
                          </div>
                          <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                            <p className="text-[9px] uppercase tracking-wider text-[#FF5500] font-bold">Recovery</p>
                            <p className="text-base font-black text-[#FF5500] font-mono mt-0.5">{anl.functionalIndex}%</p>
                          </div>
                          <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                            <p className="text-[9px] uppercase tracking-wider text-amber-600 font-bold">RTS Ready</p>
                            <p className="text-base font-black text-amber-600 font-mono mt-0.5">{anl.readinessToReturnPercent}%</p>
                          </div>
                          <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                            <p className="text-[9px] uppercase tracking-wider text-emerald-600 font-bold">FMS Total</p>
                            <p className="text-base font-black text-emerald-600 font-mono mt-0.5">{anl.fmsTotal} <span className="text-[10px] text-gray-400">/21</span></p>
                          </div>
                        </div>

                        {/* Quick Highlights: ROM & Strength */}
                        <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                          {anl.romMetrics && anl.romMetrics.length > 0 && (
                            <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                              <p className="text-[10px] font-bold text-gray-500 uppercase">ROM Goniometry</p>
                              <p className="text-gray-800 mt-1 font-semibold truncate">{anl.romMetrics[0].movement}</p>
                              <p className="text-[#FF5500] font-mono text-[10px] mt-0.5 font-bold">
                                Current: {anl.romMetrics[0].currentDeg}° vs Target {anl.romMetrics[0].targetDeg}°
                              </p>
                            </div>
                          )}
                          {anl.strengthMetrics && anl.strengthMetrics.length > 0 && (
                            <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                              <p className="text-[10px] font-bold text-gray-500 uppercase">Torque Symmetry</p>
                              <p className="text-gray-800 mt-1 font-semibold truncate">{anl.strengthMetrics[0].muscleGroup}</p>
                              <p className="text-emerald-600 font-mono text-[10px] mt-0.5 font-bold">
                                Asymmetry: {anl.strengthMetrics[0].asymmetryPercent}% (L:{anl.strengthMetrics[0].leftSide}/R:{anl.strengthMetrics[0].rightSide}{anl.strengthMetrics[0].unit})
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                        <button
                          onClick={() => setSelectedAnalysisForView(anl)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#FF5500] hover:bg-[#E04B00] text-white text-xs font-bold transition cursor-pointer shadow-xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Full Report</span>
                        </button>

                        <button
                          onClick={() => {
                            setSelectedAnalysisForEdit(anl);
                            setEditorPresetPatientId(anl.patientId);
                            setIsEditorOpen(true);
                          }}
                          className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition cursor-pointer"
                          title="Edit Assessment"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition cursor-pointer"
                          title="WhatsApp Summary to Patient"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </a>

                        <button
                          onClick={(e) => handleDeleteAnalysis(anl.id, e)}
                          className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition cursor-pointer"
                          title="Delete Assessment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB: CREATE PRESCRIPTION                                       */}
      {/* ============================================================== */}
      {activeTab === 'create-rx' && (
        <div className="max-w-3xl mx-auto bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
            <div className="w-10 h-10 rounded-xl bg-[#FF5500]/10 border border-[#FF5500]/30 flex items-center justify-center text-[#FF5500]">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900 font-display">Create Clinical Prescription</h2>
              <p className="text-xs text-gray-500">
                Prescribe targeted physical exercises, modalities, precautions, and follow-ups
              </p>
            </div>
          </div>

          {rxSuccessMsg && (
            <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Prescription saved to cloud database and synced to patient dashboard!</span>
            </div>
          )}

          <form onSubmit={handleSubmitPrescription} className="space-y-5">
            {/* Patient selection */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Select Target Patient *
              </label>
              <select
                value={rxPatientId}
                onChange={(e) => setRxPatientId(e.target.value)}
                required
                className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:border-[#FF5500] outline-none cursor-pointer"
              >
                {patients.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.fullName} ({p.phone}) - {p.gender}, {p.age || 30}y
                  </option>
                ))}
              </select>
            </div>

            {/* Diagnosis & Symptoms */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Clinical Diagnosis *
                </label>
                <input
                  type="text"
                  value={rxDiagnosis}
                  onChange={(e) => setRxDiagnosis(e.target.value)}
                  required
                  placeholder="e.g. Grade II Anterior Cruciate Ligament Sprain"
                  className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-xs text-gray-900 focus:border-[#FF5500] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Reported Symptoms & Limitations
                </label>
                <input
                  type="text"
                  value={rxSymptoms}
                  onChange={(e) => setRxSymptoms(e.target.value)}
                  placeholder="e.g. Knee instability during deceleration, mild effusion"
                  className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-xs text-gray-900 focus:border-[#FF5500] outline-none"
                />
              </div>
            </div>

            {/* Exercises List Builder */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Targeted Rehabilitation Exercises ({rxExercises.length})
                </label>
                <button
                  type="button"
                  onClick={addExerciseRow}
                  className="flex items-center gap-1 text-xs font-bold text-[#FF5500] hover:underline cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Exercise</span>
                </button>
              </div>

              <div className="space-y-3">
                {rxExercises.map((ex, idx) => (
                  <div key={ex.id} className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-gray-700 uppercase">Exercise #{idx + 1}</span>
                      {rxExercises.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeExerciseRow(ex.id)}
                          className="text-rose-600 hover:text-rose-700 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={ex.name}
                      onChange={(e) => updateExercise(ex.id, 'name', e.target.value)}
                      placeholder="Exercise Name (e.g. Spanish Squats with Rig Resistance Band)"
                      className="w-full bg-white border border-gray-300 rounded-xl px-3 py-1.5 text-xs text-gray-900 outline-none focus:border-[#FF5500]"
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="number"
                        value={ex.sets}
                        onChange={(e) => updateExercise(ex.id, 'sets', parseInt(e.target.value) || 1)}
                        placeholder="Sets"
                        className="bg-white border border-gray-300 rounded-xl px-3 py-1.5 text-xs text-gray-900 outline-none focus:border-[#FF5500]"
                      />
                      <input
                        type="text"
                        value={ex.repsOrDuration}
                        onChange={(e) => updateExercise(ex.id, 'repsOrDuration', e.target.value)}
                        placeholder="Reps / Hold (e.g. 12 reps)"
                        className="bg-white border border-gray-300 rounded-xl px-3 py-1.5 text-xs text-gray-900 outline-none focus:border-[#FF5500]"
                      />
                      <input
                        type="text"
                        value={ex.frequency}
                        onChange={(e) => updateExercise(ex.id, 'frequency', e.target.value)}
                        placeholder="Frequency (e.g. 2x Daily)"
                        className="bg-white border border-gray-300 rounded-xl px-3 py-1.5 text-xs text-gray-900 outline-none focus:border-[#FF5500]"
                      />
                    </div>
                    <input
                      type="text"
                      value={ex.notes || ''}
                      onChange={(e) => updateExercise(ex.id, 'notes', e.target.value)}
                      placeholder="Biomechanics notes (e.g. 3-sec eccentric lowering)"
                      className="w-full bg-white border border-gray-300 rounded-xl px-3 py-1.5 text-xs text-gray-900 outline-none focus:border-[#FF5500]"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Precautions & Follow Up */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Precautions & Contraindications
                </label>
                <textarea
                  value={rxPrecautions}
                  onChange={(e) => setRxPrecautions(e.target.value)}
                  rows={3}
                  className="w-full bg-white border border-gray-300 rounded-xl p-3 text-xs text-gray-900 outline-none focus:border-[#FF5500]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Next Clinical Follow-up Date
                </label>
                <input
                  type="text"
                  value={rxFollowUp}
                  onChange={(e) => setRxFollowUp(e.target.value)}
                  placeholder="e.g. In 7 Days or 2026-09-25"
                  className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-xs text-gray-900 outline-none focus:border-[#FF5500]"
                />
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mt-3 mb-1">
                  Lifestyle & Recovery Advice
                </label>
                <input
                  type="text"
                  value={rxLifestyle}
                  onChange={(e) => setRxLifestyle(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-xs text-gray-900 outline-none focus:border-[#FF5500]"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                type="submit"
                disabled={rxSubmitting}
                className="px-6 py-3 rounded-2xl bg-[#FF5500] hover:bg-[#E04B00] text-white font-extrabold text-xs uppercase tracking-wider transition shadow-md cursor-pointer"
              >
                {rxSubmitting ? 'Saving...' : 'Issue Prescription to Patient'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB: SEND NOTIFICATIONS                                        */}
      {/* ============================================================== */}
      {activeTab === 'notifications' && (
        <div className="max-w-2xl mx-auto bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
            <div className="w-10 h-10 rounded-xl bg-[#FF5500]/10 border border-[#FF5500]/30 flex items-center justify-center text-[#FF5500]">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900 font-display">Broadcast Clinical Notification</h2>
              <p className="text-xs text-gray-500">Send real-time alerts and follow-up notices to patient portals</p>
            </div>
          </div>

          {notifSuccess && (
            <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Notification broadcast transmitted successfully!</span>
            </div>
          )}

          <form onSubmit={handleSendNotification} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Target Recipient
              </label>
              <select
                value={notifRecipientId}
                onChange={(e) => setNotifRecipientId(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:border-[#FF5500] cursor-pointer"
              >
                <option value="ALL">All Active Patients (Global Announcement)</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.fullName} ({p.phone})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Notice Title *
              </label>
              <input
                type="text"
                value={notifTitle}
                onChange={(e) => setNotifTitle(e.target.value)}
                required
                placeholder="e.g. Biomechanical Screening Ready / Clinic Schedule Update"
                className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-xs text-gray-900 outline-none focus:border-[#FF5500]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Message Body *
              </label>
              <textarea
                value={notifMessage}
                onChange={(e) => setNotifMessage(e.target.value)}
                required
                rows={4}
                placeholder="Compose clinical update or appointment reminder..."
                className="w-full bg-white border border-gray-300 rounded-xl p-3 text-xs text-gray-900 outline-none focus:border-[#FF5500]"
              />
            </div>

            <div className="pt-3 border-t border-gray-100 flex justify-end">
              <button
                type="submit"
                disabled={notifSending}
                className="px-6 py-2.5 rounded-xl bg-[#FF5500] hover:bg-[#E04B00] text-white font-extrabold text-xs uppercase tracking-wider transition shadow-md cursor-pointer"
              >
                {notifSending ? 'Sending...' : 'Transmit Notification'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: CONFIRM APPOINTMENT DELETION                            */}
      {/* ============================================================== */}
      {appointmentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border-2 border-rose-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-black text-gray-900 font-display">Delete Appointment?</h3>
              <p className="text-xs text-gray-600 mt-1">
                Are you sure you want to delete this appointment for <strong>{appointmentToDelete.patientName}</strong>?
              </p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 text-xs space-y-1.5 font-mono">
              <p><strong className="text-gray-900">Service:</strong> {appointmentToDelete.service}</p>
              <p><strong className="text-gray-900">Date & Slot:</strong> {appointmentToDelete.date} @ {appointmentToDelete.timeSlot}</p>
              <p><strong className="text-gray-900">Consultation Fee:</strong> ₹{appointmentToDelete.fee}</p>
              <p><strong className="text-gray-900">Status:</strong> {appointmentToDelete.status}</p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setAppointmentToDelete(null)}
                disabled={deleteLoading}
                className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-delete-apt-doctor"
                onClick={handleConfirmDeleteAppointment}
                disabled={deleteLoading}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-wider transition shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{deleteLoading ? 'Deleting...' : 'Delete Appointment'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PATIENT CLINICAL HISTORY DRAWER */}
      {selectedPatientHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xl h-full bg-white border-l border-gray-200 shadow-2xl p-6 overflow-y-auto space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
              <div>
                <h3 className="text-base font-black text-gray-900 font-display">
                  {selectedPatientHistory.patient.fullName}
                </h3>
                <p className="text-xs text-gray-500 font-mono">
                  {selectedPatientHistory.patient.phone} • {selectedPatientHistory.patient.gender}, {selectedPatientHistory.patient.age || 30}y
                </p>
              </div>
              <button
                onClick={() => setSelectedPatientHistory(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-900 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Medical History */}
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs">
              <p className="font-bold text-amber-900 uppercase text-[10px] tracking-wider mb-1">Reported Medical History</p>
              <p className="text-amber-950 font-medium">
                {selectedPatientHistory.patient.medicalHistory || 'No pre-existing conditions reported.'}
              </p>
            </div>

            {/* Consultations */}
            <div className="space-y-2">
              <h4 className="text-xs font-black text-gray-700 uppercase tracking-wider">
                Consultation History ({selectedPatientHistory.appointments.length})
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedPatientHistory.appointments.map(a => (
                  <div key={a.id} className="p-3 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-gray-900">{a.service}</p>
                      <p className="text-[11px] text-gray-500">{a.date} @ {a.timeSlot}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">
                      {a.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Biomechanical Analyses */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-gray-700 uppercase tracking-wider">
                  Biomechanical Analyses ({selectedPatientHistory.analyses?.length || 0})
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    setEditorPresetPatientId(selectedPatientHistory.patient.id);
                    setSelectedAnalysisForEdit(null);
                    setIsEditorOpen(true);
                  }}
                  className="flex items-center gap-1 text-[11px] font-bold text-[#FF5500] hover:underline cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Record Assessment</span>
                </button>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedPatientHistory.analyses && selectedPatientHistory.analyses.length > 0 ? (
                  selectedPatientHistory.analyses.map(anl => (
                    <div key={anl.id} className="p-3 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-gray-900">{anl.primaryDiagnosis}</p>
                        <p className="text-[11px] text-gray-500">
                          {anl.date} &bull; {anl.rehabPhase.split(':')[0]} &bull; VAS {anl.vasPainScore}/10
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedAnalysisForView(anl)}
                        className="text-[11px] font-bold text-[#FF5500] hover:underline cursor-pointer"
                      >
                        View Charts
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-center text-xs text-gray-400 bg-gray-50 rounded-2xl border border-gray-200">
                    No biomechanical assessment on record.
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setSelectedPatientHistory(null)}
                className="px-5 py-2.5 rounded-xl bg-gray-900 hover:bg-black text-xs font-bold text-white transition cursor-pointer"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULL INTERACTIVE ANALYSIS MODAL (Doctor View) */}
      {selectedAnalysisForView && (
        <PatientAnalysisView
          analysis={selectedAnalysisForView}
          currentUser={user}
          isModal
          onClose={() => setSelectedAnalysisForView(null)}
          onEdit={(anl) => {
            setSelectedAnalysisForView(null);
            setSelectedAnalysisForEdit(anl);
            setEditorPresetPatientId(anl.patientId);
            setIsEditorOpen(true);
          }}
        />
      )}

      {/* BIOMECHANICAL ANALYSIS EDITOR MODAL */}
      {isEditorOpen && (
        <PatientAnalysisEditorModal
          initialAnalysis={selectedAnalysisForEdit || undefined}
          presetPatientId={editorPresetPatientId}
          patients={patients}
          onClose={() => {
            setIsEditorOpen(false);
            setSelectedAnalysisForEdit(null);
            setEditorPresetPatientId(undefined);
          }}
          onSaved={async (saved) => {
            setIsEditorOpen(false);
            setSelectedAnalysisForEdit(null);
            setEditorPresetPatientId(undefined);
            await loadData();
            if (selectedPatientHistory && selectedPatientHistory.patient.id === saved.patientId) {
              handleOpenPatientHistory(saved.patientId);
            }
          }}
        />
      )}
    </div>
  );
};
