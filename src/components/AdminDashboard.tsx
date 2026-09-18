import React, { useState, useEffect } from 'react';
import {
  User,
  Appointment,
  Invoice,
  Prescription,
  PatientAnalysis,
  AppointmentStatus
} from '../types.js';
import { api } from '../services/api.js';
import { exportToJson, exportToCsv, triggerPrint } from '../utils/exportUtils.js';
import {
  Database,
  Download,
  Printer,
  Users,
  Calendar,
  FileText,
  TrendingUp,
  Pill,
  Trash2,
  Search,
  CheckCircle2,
  ShieldCheck,
  Activity,
  HardDrive,
  FileCheck,
  AlertTriangle,
  Eye,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Clock,
  Sparkles
} from 'lucide-react';

interface AdminDashboardProps {
  user: User;
  onSelectInvoice: (invoice: Invoice, appointment?: Appointment) => void;
  onSelectPrescription: (prescription: Prescription) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  user,
  onSelectInvoice,
  onSelectPrescription,
}) => {
  const [activeTab, setActiveTab] = useState<'database' | 'patients' | 'appointments' | 'invoices' | 'analyses'>('database');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportSuccessMsg, setExportSuccessMsg] = useState<string | null>(null);

  // Core Data Collections
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

  // Search & Filter
  const [patientSearch, setPatientSearch] = useState('');
  const [appointmentSearch, setAppointmentSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Deletion Modal / Confirm State
  const [appointmentToDelete, setAppointmentToDelete] = useState<Appointment | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Patient Dossier Viewer
  const [selectedPatientDossier, setSelectedPatientDossier] = useState<{
    patient: User;
    appointments: Appointment[];
    prescriptions: Prescription[];
    invoices: Invoice[];
    analyses: PatientAnalysis[];
  } | null>(null);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [apts, invs, rxs, pts, anls] = await Promise.all([
        api.getAppointments(),
        api.getInvoices(),
        api.getPrescriptions(),
        api.getPatients(),
        api.getAnalyses()
      ]);
      setAppointments(apts);
      setInvoices(invs);
      setPrescriptions(rxs);
      setPatients(pts);
      setAnalyses(anls);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const notifySuccess = (msg: string) => {
    setExportSuccessMsg(msg);
    setTimeout(() => setExportSuccessMsg(null), 4000);
  };

  // --- 1. FULL WEB APP DATABASE DOWNLOAD ---
  const handleDownloadFullDatabase = async () => {
    try {
      setExporting(true);
      const fullDump = await api.downloadFullDatabaseDump();
      exportToJson(`FRL_COMPLETE_DATABASE_DUMP_${new Date().toISOString().slice(0, 10)}`, fullDump);
      notifySuccess('Full Web App Database JSON downloaded successfully!');
    } catch (err) {
      console.error('Failed to export full database:', err);
      // Fallback to client-side data synthesis
      const fallbackDump = {
        exportedAt: new Date().toISOString(),
        exportedBy: 'Cloudfare (Admin {Not a Doctor})',
        patients,
        appointments,
        invoices,
        prescriptions,
        biomechanicalAnalyses: analyses
      };
      exportToJson(`FRL_DATABASE_BACKUP_${new Date().toISOString().slice(0, 10)}`, fallbackDump);
      notifySuccess('Database backup generated and downloaded successfully!');
    } finally {
      setExporting(false);
    }
  };

  // --- 2. COMPLETE PATIENT DETAILS DOWNLOAD ---
  const handleDownloadCompletePatientDetails = async () => {
    try {
      setExporting(true);
      const dossiers = await api.downloadPatientDossiers();
      exportToJson(`FRL_ALL_PATIENT_COMPLETE_DOSSIERS_${new Date().toISOString().slice(0, 10)}`, dossiers);
      notifySuccess('Complete Patient Dossiers JSON downloaded successfully!');
    } catch (err) {
      console.error('Failed to export patient dossiers:', err);
      // Fallback
      const compiled = patients.map(p => ({
        patient: p,
        appointments: appointments.filter(a => a.patientId === p.id),
        prescriptions: prescriptions.filter(rx => rx.patientId === p.id),
        invoices: invoices.filter(i => i.patientId === p.id),
        analyses: analyses.filter(an => an.patientId === p.id)
      }));
      exportToJson(`FRL_PATIENT_DOSSIERS_${new Date().toISOString().slice(0, 10)}`, compiled);
      notifySuccess('Patient dossiers compiled and downloaded!');
    } finally {
      setExporting(false);
    }
  };

  // --- 3. EXPORT PATIENTS CSV ---
  const handleExportPatientsCsv = () => {
    const rows = patients.map(p => {
      const patientInvoices = invoices.filter(i => i.patientId === p.id);
      const totalPaid = patientInvoices.filter(i => i.paymentStatus === 'Paid').reduce((sum, i) => sum + i.total, 0);
      const totalBilled = patientInvoices.reduce((sum, i) => sum + i.total, 0);
      const patientApts = appointments.filter(a => a.patientId === p.id);
      const latestAnalysis = analyses.find(an => an.patientId === p.id);

      return {
        'Patient ID': p.id,
        'Full Name': p.fullName,
        'Username': p.username,
        'Phone': p.phone,
        'Email': p.email || 'N/A',
        'Gender': p.gender || 'Unspecified',
        'Age': p.age || 'N/A',
        'Total Appointments': patientApts.length,
        'Last Service': p.lastService || 'None',
        'Last Visit Date': p.lastVisitDate || 'None',
        'Total Billed (INR)': totalBilled,
        'Total Paid (INR)': totalPaid,
        'Outstanding (INR)': totalBilled - totalPaid,
        'Rehab Phase': latestAnalysis?.rehabPhase || 'Not Assessed',
        'VAS Pain Score': latestAnalysis?.vasPainScore ?? 'N/A',
        'Medical History': p.medicalHistory || 'None',
        'Emergency Contact': p.emergencyContact || 'None',
        'Registration Date': p.createdAt
      };
    });

    exportToCsv(`FRL_PATIENTS_MASTER_ROSTER_${new Date().toISOString().slice(0, 10)}`, rows);
    notifySuccess('Patients master roster CSV exported successfully!');
  };

  // --- 4. EXPORT APPOINTMENTS CSV ---
  const handleExportAppointmentsCsv = () => {
    const rows = appointments.map(apt => ({
      'Appointment ID': apt.id,
      'Patient Name': apt.patientName,
      'Phone': apt.patientPhone,
      'Service': apt.service,
      'Doctor': apt.doctorName,
      'Date': apt.date,
      'Time Slot': apt.timeSlot,
      'Fee (INR)': apt.fee,
      'Status': apt.status,
      'Invoice ID': apt.invoiceId,
      'Rehab Goals': apt.rehabGoals || '',
      'Clinical Notes': apt.notes || '',
      'Created At': apt.createdAt
    }));

    exportToCsv(`FRL_ALL_APPOINTMENTS_${new Date().toISOString().slice(0, 10)}`, rows);
    notifySuccess('All appointments CSV exported successfully!');
  };

  // --- 5. DOWNLOAD INDIVIDUAL PATIENT DOSSIER ---
  const handleDownloadSinglePatientDossier = (patient: User) => {
    const patientApts = appointments.filter(a => a.patientId === patient.id);
    const patientInvs = invoices.filter(i => i.patientId === patient.id);
    const patientRxs = prescriptions.filter(r => r.patientId === patient.id);
    const patientAnls = analyses.filter(an => an.patientId === patient.id);

    const dossier = {
      patientProfile: {
        id: patient.id,
        fullName: patient.fullName,
        username: patient.username,
        phone: patient.phone,
        email: patient.email,
        gender: patient.gender,
        age: patient.age,
        medicalHistory: patient.medicalHistory,
        emergencyContact: patient.emergencyContact,
        registeredAt: patient.createdAt
      },
      summaryStats: {
        totalAppointments: patientApts.length,
        totalInvoices: patientInvs.length,
        totalAmountBilled: patientInvs.reduce((sum, inv) => sum + inv.total, 0),
        totalAmountPaid: patientInvs.filter(i => i.paymentStatus === 'Paid').reduce((sum, inv) => sum + inv.total, 0),
        totalPrescriptions: patientRxs.length,
        totalBiomechanicalAssessments: patientAnls.length
      },
      appointmentsHistory: patientApts,
      invoicesHistory: patientInvs,
      prescriptionsHistory: patientRxs,
      biomechanicalAssessments: patientAnls
    };

    exportToJson(`FRL_PATIENT_DOSSIER_${patient.fullName.replace(/\s+/g, '_')}_${patient.id}`, dossier);
    notifySuccess(`Complete dossier for ${patient.fullName} exported!`);
  };

  // --- 6. VIEW PATIENT DOSSIER MODAL ---
  const handleOpenPatientDossierModal = (patient: User) => {
    const pApts = appointments.filter(a => a.patientId === patient.id);
    const pInvs = invoices.filter(i => i.patientId === patient.id);
    const pRxs = prescriptions.filter(r => r.patientId === patient.id);
    const pAnls = analyses.filter(an => an.patientId === patient.id);

    setSelectedPatientDossier({
      patient,
      appointments: pApts,
      prescriptions: pRxs,
      invoices: pInvs,
      analyses: pAnls
    });
  };

  // --- 7. DELETE APPOINTMENT ---
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
      alert('Failed to delete appointment. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Filtered Appointments
  const filteredAppointments = appointments.filter(apt => {
    const matchesSearch =
      apt.patientName.toLowerCase().includes(appointmentSearch.toLowerCase()) ||
      apt.patientPhone.includes(appointmentSearch) ||
      apt.service.toLowerCase().includes(appointmentSearch.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || apt.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filtered Patients
  const filteredPatients = patients.filter(p => {
    return (
      p.fullName.toLowerCase().includes(patientSearch.toLowerCase()) ||
      p.phone.includes(patientSearch) ||
      p.username.toLowerCase().includes(patientSearch.toLowerCase()) ||
      (p.email && p.email.toLowerCase().includes(patientSearch.toLowerCase()))
    );
  });

  const totalRevenue = invoices.filter(i => i.paymentStatus === 'Paid').reduce((s, i) => s + i.total, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Toast Notification */}
      {exportSuccessMsg && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 bg-white border-2 border-[#FF5500] text-gray-900 px-5 py-3.5 rounded-2xl shadow-[0_8px_30px_rgba(255,85,0,0.25)] animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-[#FF5500] shrink-0" />
          <span className="text-xs sm:text-sm font-bold">{exportSuccessMsg}</span>
        </div>
      )}

      {/* ADMIN HEADER BANNER */}
      <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-[#FF5500]/10 via-[#FF5500]/5 to-transparent rounded-full -mr-20 -mt-20 pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#FF5500] text-white shadow-sm">
                Cloudfare
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-black text-white">
                Admin &#123;Not a Doctor&#125;
              </span>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#FF5500]/10 text-[#FF5500] border border-[#FF5500]/30 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> Full Database & Dossier Controller
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 font-display tracking-tight">
              Clinical Database & Patient Details System
            </h1>
            <p className="text-sm text-gray-600 max-w-2xl leading-relaxed">
              Executive console for Cloudfare: Download full web application database backups, export complete patient details & clinical dossiers, manage clinic appointments, and generate audit reports.
            </p>
          </div>

          {/* Quick Primary Export Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              id="btn-admin-download-full-db"
              onClick={handleDownloadFullDatabase}
              disabled={exporting}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#FF5500] hover:bg-[#E04B00] text-white font-black text-xs uppercase tracking-wider shadow-[0_4px_16px_rgba(255,85,0,0.3)] transition transform active:scale-95 cursor-pointer"
            >
              <Database className="w-4 h-4" />
              <span>{exporting ? 'Exporting...' : 'Download Full App Database (.JSON)'}</span>
            </button>

            <button
              id="btn-admin-download-patient-dossiers"
              onClick={handleDownloadCompletePatientDetails}
              disabled={exporting}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white hover:bg-gray-50 text-gray-900 border-2 border-[#FF5500] font-black text-xs uppercase tracking-wider shadow-sm transition transform active:scale-95 cursor-pointer"
            >
              <Users className="w-4 h-4 text-[#FF5500]" />
              <span>Download Complete Patient Details (.JSON)</span>
            </button>

            <button
              id="btn-admin-print-ledger"
              onClick={() => triggerPrint()}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs uppercase tracking-wider transition cursor-pointer"
              title="Print Clinical Summary"
            >
              <Printer className="w-4 h-4 text-gray-700" />
              <span className="hidden sm:inline">Print Summary</span>
            </button>
          </div>
        </div>
      </div>

      {/* METRIC STRIP (White surfaces with Fluorescent Orange accents) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-8">
        <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-sm">
          <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Total Patients</p>
          <p className="text-2xl font-black text-gray-900 mt-1 font-mono">{patients.length}</p>
          <p className="text-[11px] text-[#FF5500] font-semibold mt-1">Registered Profiles</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-sm">
          <p className="text-[10px] uppercase tracking-wider text-[#FF5500] font-bold">Appointments</p>
          <p className="text-2xl font-black text-[#FF5500] mt-1 font-mono">{appointments.length}</p>
          <p className="text-[11px] text-gray-500 font-medium mt-1">Total Booked</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-sm">
          <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Biomechanical Tests</p>
          <p className="text-2xl font-black text-gray-900 mt-1 font-mono">{analyses.length}</p>
          <p className="text-[11px] text-[#FF5500] font-semibold mt-1">ROM & Kinematics</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-sm">
          <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Prescriptions</p>
          <p className="text-2xl font-black text-gray-900 mt-1 font-mono">{prescriptions.length}</p>
          <p className="text-[11px] text-gray-500 font-medium mt-1">Clinical Protocols</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-sm">
          <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Collected Revenue</p>
          <p className="text-2xl font-black text-emerald-600 mt-1 font-mono">₹{totalRevenue.toLocaleString('en-IN')}</p>
          <p className="text-[11px] text-gray-500 font-medium mt-1">Paid Invoices</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-sm">
          <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Database State</p>
          <p className="text-sm font-black text-emerald-600 mt-2 flex items-center gap-1.5 font-mono">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            ONLINE
          </p>
          <p className="text-[11px] text-[#FF5500] font-semibold mt-1">In-Memory JSON DB</p>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 border-b border-gray-200 scrollbar-none mb-6">
        {[
          { id: 'database', label: 'Database & Download Hub', icon: HardDrive },
          { id: 'patients', label: `Complete Patient Dossiers (${patients.length})`, icon: Users },
          { id: 'appointments', label: `All Clinic Appointments (${appointments.length})`, icon: Calendar },
          { id: 'invoices', label: `Billing & Invoices (${invoices.length})`, icon: FileText },
          { id: 'analyses', label: `Biomechanical Tests (${analyses.length})`, icon: TrendingUp },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab-admin-${tab.id}`}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer tracking-wider uppercase ${
                isActive
                  ? 'bg-[#FF5500] text-white shadow-[0_2px_10px_rgba(255,85,0,0.3)]'
                  : 'bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ============================================================== */}
      {/* TAB 1: DATABASE & DOWNLOAD HUB                                  */}
      {/* ============================================================== */}
      {activeTab === 'database' && (
        <div className="space-y-6">
          {/* Download Cards Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1: Full Web App Database Download */}
            <div className="bg-white border-2 border-[#FF5500]/30 rounded-3xl p-6 sm:p-7 shadow-sm hover:border-[#FF5500] transition">
              <div className="w-12 h-12 rounded-2xl bg-[#FF5500]/10 flex items-center justify-center text-[#FF5500] mb-4">
                <Database className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-black text-gray-900 font-display">Full Web App Database Download</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-[#FF5500]/10 text-[#FF5500] uppercase">
                  Admin Only
                </span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed mb-6">
                Downloads the complete raw system database schema including all users, patient medical records, appointments, GST tax invoices, prescriptions, biomechanical kinetic scores, services, and activity logs in structured JSON format.
              </p>

              <div className="space-y-2 mb-6 bg-gray-50 p-4 rounded-2xl border border-gray-200 text-xs font-mono text-gray-700">
                <div className="flex justify-between">
                  <span className="text-gray-500">Total System Tables:</span>
                  <span className="font-bold text-gray-900">7 Collections</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Records:</span>
                  <span className="font-bold text-[#FF5500]">
                    {patients.length + appointments.length + invoices.length + prescriptions.length + analyses.length + 3} Records
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Authorized Exporter:</span>
                  <span className="font-bold text-gray-900">Cloudfare &#123;Not a Doctor&#125;</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  id="btn-download-full-db-action"
                  onClick={handleDownloadFullDatabase}
                  disabled={exporting}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#FF5500] hover:bg-[#E04B00] text-white font-extrabold text-xs uppercase tracking-wider transition shadow-md cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Full Database (.JSON)</span>
                </button>

                <button
                  onClick={() => {
                    const dump = [
                      { Table: 'Users', Count: patients.length + 2 },
                      { Table: 'Appointments', Count: appointments.length },
                      { Table: 'Invoices', Count: invoices.length },
                      { Table: 'Prescriptions', Count: prescriptions.length },
                      { Table: 'BiomechanicalAnalyses', Count: analyses.length },
                    ];
                    exportToCsv(`FRL_DATABASE_SUMMARY_${new Date().toISOString().slice(0, 10)}`, dump);
                  }}
                  className="px-4 py-3 rounded-xl bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-bold text-xs uppercase transition cursor-pointer"
                >
                  Summary (.CSV)
                </button>
              </div>
            </div>

            {/* Card 2: Complete Patient Details Download */}
            <div className="bg-white border-2 border-gray-200 hover:border-[#FF5500] rounded-3xl p-6 sm:p-7 shadow-sm transition">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 mb-4">
                <Users className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-black text-gray-900 font-display">Complete Patient Details Download</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-50 text-blue-700 uppercase">
                  Master Dossier
                </span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed mb-6">
                Downloads comprehensive clinical profiles for all registered patients. Each dossier includes contact demographics, past consultations, complete payment history, exercise regimens, and kinetic biomechanical scores.
              </p>

              <div className="space-y-2 mb-6 bg-gray-50 p-4 rounded-2xl border border-gray-200 text-xs font-mono text-gray-700">
                <div className="flex justify-between">
                  <span className="text-gray-500">Registered Patient Dossiers:</span>
                  <span className="font-bold text-gray-900">{patients.length} Profiles</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Deep Clinical History:</span>
                  <span className="font-bold text-emerald-600">Appointments + Prescriptions + Invoices + ROM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Security & Privacy:</span>
                  <span className="font-bold text-gray-900">Compliant Sanitized Export</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  id="btn-download-all-patients-json"
                  onClick={handleDownloadCompletePatientDetails}
                  disabled={exporting}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gray-900 hover:bg-black text-white font-extrabold text-xs uppercase tracking-wider transition shadow-md cursor-pointer"
                >
                  <Download className="w-4 h-4 text-[#FF5500]" />
                  <span>Download Complete Dossiers (.JSON)</span>
                </button>

                <button
                  id="btn-export-patients-csv"
                  onClick={handleExportPatientsCsv}
                  className="px-4 py-3 rounded-xl bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-bold text-xs uppercase transition cursor-pointer"
                >
                  Master Roster (.CSV)
                </button>
              </div>
            </div>
          </div>

          {/* Database Collections Table Overview */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-base font-black text-gray-900 font-display">System Database Collection Breakdown</h3>
                <p className="text-xs text-gray-500">Active records in Functional Rehab Lab's in-memory persistence layer</p>
              </div>
              <button
                onClick={loadAllData}
                className="self-start sm:self-center flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-700 transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh Counts</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4 font-bold">Collection</th>
                    <th className="py-3 px-4 font-bold">Record Count</th>
                    <th className="py-3 px-4 font-bold">Scope / Description</th>
                    <th className="py-3 px-4 font-bold text-right">Quick Export</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr className="hover:bg-gray-50/70 transition">
                    <td className="py-3.5 px-4 font-bold text-gray-900 flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#FF5500]" /> Patients & Users
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-gray-900">{patients.length + 2}</td>
                    <td className="py-3.5 px-4 text-gray-600">Registered patients, doctors, and Cloudfare admin</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={handleExportPatientsCsv}
                        className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 font-bold text-[11px] text-gray-800 transition cursor-pointer"
                      >
                        Export CSV
                      </button>
                    </td>
                  </tr>

                  <tr className="hover:bg-gray-50/70 transition">
                    <td className="py-3.5 px-4 font-bold text-gray-900 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-600" /> Appointments
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-gray-900">{appointments.length}</td>
                    <td className="py-3.5 px-4 text-gray-600">Patient consultations, time slots, rehab services, and status</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={handleExportAppointmentsCsv}
                        className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 font-bold text-[11px] text-gray-800 transition cursor-pointer"
                      >
                        Export CSV
                      </button>
                    </td>
                  </tr>

                  <tr className="hover:bg-gray-50/70 transition">
                    <td className="py-3.5 px-4 font-bold text-gray-900 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-600" /> Tax Invoices
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-gray-900">{invoices.length}</td>
                    <td className="py-3.5 px-4 text-gray-600">GST billing invoices, payment statuses, line items</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => {
                          const rows = invoices.map(i => ({
                            'Invoice Number': i.invoiceNumber,
                            'Patient': i.patientName,
                            'Date': i.date,
                            'Amount': i.total,
                            'Status': i.paymentStatus,
                            'Method': i.paymentMethod
                          }));
                          exportToCsv(`FRL_INVOICES_${new Date().toISOString().slice(0, 10)}`, rows);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 font-bold text-[11px] text-gray-800 transition cursor-pointer"
                      >
                        Export CSV
                      </button>
                    </td>
                  </tr>

                  <tr className="hover:bg-gray-50/70 transition">
                    <td className="py-3.5 px-4 font-bold text-gray-900 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-[#FF5500]" /> Biomechanical Analyses
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-gray-900">{analyses.length}</td>
                    <td className="py-3.5 px-4 text-gray-600">Goniometry ROM, dynamometric torque asymmetry, FMS screening</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => exportToJson(`FRL_BIOMECHANICAL_ANALYSES_${new Date().toISOString().slice(0, 10)}`, analyses)}
                        className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 font-bold text-[11px] text-gray-800 transition cursor-pointer"
                      >
                        Export JSON
                      </button>
                    </td>
                  </tr>

                  <tr className="hover:bg-gray-50/70 transition">
                    <td className="py-3.5 px-4 font-bold text-gray-900 flex items-center gap-2">
                      <Pill className="w-4 h-4 text-purple-600" /> Prescriptions
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-gray-900">{prescriptions.length}</td>
                    <td className="py-3.5 px-4 text-gray-600">Active exercise prescriptions, precautions, follow-up dates</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => exportToJson(`FRL_PRESCRIPTIONS_${new Date().toISOString().slice(0, 10)}`, prescriptions)}
                        className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 font-bold text-[11px] text-gray-800 transition cursor-pointer"
                      >
                        Export JSON
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: COMPLETE PATIENT DETAILS & DOSSIERS                     */}
      {/* ============================================================== */}
      {activeTab === 'patients' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-gray-900 font-display">Complete Patient Details Directory</h2>
              <p className="text-xs text-gray-500">
                Download individual patient dossiers, inspect full clinical records, and export master rosters
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search patient, phone, username..."
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  className="bg-white border border-gray-300 rounded-xl pl-8 pr-3 py-1.5 text-xs text-gray-900 placeholder-gray-400 outline-none w-48 sm:w-64 focus:border-[#FF5500]"
                />
              </div>

              <button
                onClick={handleExportPatientsCsv}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-gray-300 hover:bg-gray-50 text-xs font-bold text-gray-800 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[#FF5500]" />
                <span className="hidden sm:inline">Export CSV</span>
              </button>

              <button
                onClick={handleDownloadCompletePatientDetails}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#FF5500] hover:bg-[#E04B00] text-xs font-extrabold text-white transition shadow-sm cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>All Dossiers (.JSON)</span>
              </button>
            </div>
          </div>

          <div className="border border-gray-200 rounded-3xl overflow-hidden bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4 font-bold">Patient Details</th>
                    <th className="py-3 px-3 font-bold">Demographics</th>
                    <th className="py-3 px-3 font-bold">Visits & Service</th>
                    <th className="py-3 px-3 font-bold">Billing & Financials</th>
                    <th className="py-3 px-3 font-bold">Rehab Status</th>
                    <th className="py-3 px-4 font-bold text-right">Dossier Downloads & Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredPatients.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-gray-500">
                        No patients matching search query.
                      </td>
                    </tr>
                  ) : (
                    filteredPatients.map((patient) => {
                      const patientApts = appointments.filter(a => a.patientId === patient.id);
                      const patientInvs = invoices.filter(i => i.patientId === patient.id);
                      const totalPaid = patientInvs.filter(i => i.paymentStatus === 'Paid').reduce((sum, i) => sum + i.total, 0);
                      const latestAnalysis = analyses.find(an => an.patientId === patient.id);

                      return (
                        <tr key={patient.id} className="hover:bg-gray-50/70 transition">
                          <td className="py-3.5 px-4">
                            <p className="font-extrabold text-gray-900 text-sm">{patient.fullName}</p>
                            <p className="text-[11px] text-gray-500 font-mono">@{patient.username} • {patient.phone}</p>
                            {patient.email && <p className="text-[10px] text-gray-400">{patient.email}</p>}
                          </td>

                          <td className="py-3.5 px-3">
                            <p className="text-gray-800 font-semibold">{patient.gender || 'Unspecified'}, {patient.age ? `${patient.age} yrs` : 'Age N/A'}</p>
                            <p className="text-[10px] text-gray-500 truncate max-w-[140px]" title={patient.medicalHistory}>
                              Hx: {patient.medicalHistory || 'None'}
                            </p>
                          </td>

                          <td className="py-3.5 px-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700">
                              {patientApts.length} Consultations
                            </span>
                            <p className="text-[10px] text-gray-500 mt-1">
                              Last: {patient.lastVisitDate || 'No visits yet'}
                            </p>
                          </td>

                          <td className="py-3.5 px-3">
                            <p className="font-mono font-bold text-emerald-600">
                              ₹{totalPaid.toLocaleString('en-IN')} <span className="text-[10px] text-gray-400">Paid</span>
                            </p>
                            <p className="text-[10px] text-gray-500">{patientInvs.length} Invoices Generated</p>
                          </td>

                          <td className="py-3.5 px-3">
                            {latestAnalysis ? (
                              <div>
                                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FF5500]/10 text-[#FF5500]">
                                  {latestAnalysis.rehabPhase}
                                </span>
                                <p className="text-[10px] text-gray-600 mt-0.5 font-medium">
                                  VAS Pain: <strong className="text-gray-900">{latestAnalysis.vasPainScore}/10</strong>
                                </p>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-[11px] italic">No biomechanical screen</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Open Dossier Modal */}
                              <button
                                onClick={() => handleOpenPatientDossierModal(patient)}
                                className="px-2.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                                title="Inspect Complete Clinical Dossier"
                              >
                                <Eye className="w-3.5 h-3.5 text-gray-600" />
                                <span>Inspect</span>
                              </button>

                              {/* Download Single Dossier JSON */}
                              <button
                                onClick={() => handleDownloadSinglePatientDossier(patient)}
                                className="px-2.5 py-1.5 rounded-xl bg-[#FF5500]/10 hover:bg-[#FF5500]/20 text-[#FF5500] text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                                title="Download Complete Patient JSON Dossier"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>Dossier (.JSON)</span>
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
      {/* TAB 3: ALL APPOINTMENTS (With DELETE Option)                    */}
      {/* ============================================================== */}
      {activeTab === 'appointments' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-gray-900 font-display">All Clinic Appointments & Schedule</h2>
              <p className="text-xs text-gray-500">
                Full audit ledger of patient consultations. Staff can delete mistaken or cancelled records.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search patient, phone..."
                  value={appointmentSearch}
                  onChange={(e) => setAppointmentSearch(e.target.value)}
                  className="bg-white border border-gray-300 rounded-xl pl-8 pr-3 py-1.5 text-xs text-gray-900 placeholder-gray-400 outline-none w-44 sm:w-56 focus:border-[#FF5500]"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white border border-gray-300 rounded-xl px-3 py-1.5 text-xs font-semibold text-gray-800 outline-none cursor-pointer focus:border-[#FF5500]"
              >
                <option value="ALL">All Statuses</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Confirmed">Confirmed</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>

              <button
                onClick={handleExportAppointmentsCsv}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-gray-300 hover:bg-gray-50 text-xs font-bold text-gray-800 transition cursor-pointer"
                title="Export Appointments to CSV"
              >
                <Download className="w-3.5 h-3.5 text-[#FF5500]" />
                <span className="hidden sm:inline">Export CSV</span>
              </button>

              <button
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
                    <th className="py-3 px-3 font-bold">Service & Doctor</th>
                    <th className="py-3 px-3 font-bold">Date & Time</th>
                    <th className="py-3 px-3 font-bold">Fee</th>
                    <th className="py-3 px-3 font-bold">Status</th>
                    <th className="py-3 px-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredAppointments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-gray-500">
                        No appointments matching query.
                      </td>
                    </tr>
                  ) : (
                    filteredAppointments.map((apt) => {
                      const invoice = invoices.find(i => i.appointmentId === apt.id || i.id === apt.invoiceId);
                      return (
                        <tr key={apt.id} className="hover:bg-gray-50/70 transition">
                          <td className="py-3.5 px-4">
                            <p className="font-bold text-gray-900">{apt.patientName}</p>
                            <p className="text-[11px] text-gray-500 font-mono">{apt.patientPhone}</p>
                          </td>

                          <td className="py-3.5 px-3">
                            <p className="text-gray-800 font-semibold">{apt.service}</p>
                            <p className="text-[10px] text-gray-500">Doc: {apt.doctorName}</p>
                          </td>

                          <td className="py-3.5 px-3">
                            <p className="text-gray-900 font-mono font-medium">{apt.date}</p>
                            <p className="text-[11px] text-[#FF5500] font-bold">{apt.timeSlot}</p>
                          </td>

                          <td className="py-3.5 px-3 font-mono font-bold text-[#FF5500]">
                            ₹{apt.fee}
                          </td>

                          <td className="py-3.5 px-3">
                            <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              apt.status === 'Completed'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : apt.status === 'Cancelled'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : apt.status === 'Confirmed'
                                ? 'bg-[#FF5500]/10 text-[#FF5500] border border-[#FF5500]/25'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}>
                              {apt.status}
                            </span>
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

                              {/* DELETE BUTTON with confirmation */}
                              <button
                                id={`btn-delete-appointment-${apt.id}`}
                                onClick={() => setAppointmentToDelete(apt)}
                                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 transition cursor-pointer"
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
      {/* TAB 4: BILLING & INVOICES                                       */}
      {/* ============================================================== */}
      {activeTab === 'invoices' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-gray-900 font-display">Clinic Tax Invoices & Financials</h2>
              <p className="text-xs text-gray-500">Official GST invoices, payment statuses, and revenue records</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const rows = invoices.map(i => ({
                    'Invoice Number': i.invoiceNumber,
                    'Patient Name': i.patientName,
                    'Phone': i.patientPhone,
                    'Doctor': i.doctorName,
                    'Date': i.date,
                    'Amount (INR)': i.total,
                    'Payment Status': i.paymentStatus,
                    'Payment Method': i.paymentMethod
                  }));
                  exportToCsv(`FRL_INVOICES_LEDGER_${new Date().toISOString().slice(0, 10)}`, rows);
                }}
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
                <span>Print Ledger</span>
              </button>
            </div>
          </div>

          <div className="border border-gray-200 rounded-3xl overflow-hidden bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4 font-bold">Invoice #</th>
                    <th className="py-3 px-3 font-bold">Patient</th>
                    <th className="py-3 px-3 font-bold">Date</th>
                    <th className="py-3 px-3 font-bold">Amount</th>
                    <th className="py-3 px-3 font-bold">Payment Status</th>
                    <th className="py-3 px-4 font-bold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-gray-50/70 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-gray-900">{inv.invoiceNumber}</td>
                      <td className="py-3.5 px-3">
                        <p className="font-bold text-gray-900">{inv.patientName}</p>
                        <p className="text-[10px] text-gray-500">{inv.patientPhone}</p>
                      </td>
                      <td className="py-3.5 px-3 font-mono text-gray-700">{inv.date}</td>
                      <td className="py-3.5 px-3 font-mono font-bold text-gray-900">₹{inv.total}</td>
                      <td className="py-3.5 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          inv.paymentStatus === 'Paid'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {inv.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => onSelectInvoice(inv)}
                          className="px-3 py-1 rounded-xl bg-gray-100 hover:bg-[#FF5500] text-gray-800 hover:text-white font-bold text-xs transition cursor-pointer"
                        >
                          View / Print Invoice
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 5: BIOMECHANICAL ANALYSES                                  */}
      {/* ============================================================== */}
      {activeTab === 'analyses' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-gray-900 font-display">Biomechanical Screening Reports</h2>
              <p className="text-xs text-gray-500">Joint Goniometry (ROM), Peak Torque Dynamometry, and Functional Movement Screen</p>
            </div>

            <button
              onClick={() => exportToJson(`FRL_ALL_BIOMECHANICAL_ANALYSES_${new Date().toISOString().slice(0, 10)}`, analyses)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FF5500] hover:bg-[#E04B00] text-xs font-bold text-white transition shadow-sm cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export All Analyses (.JSON)</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analyses.map((anl) => (
              <div key={anl.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:border-[#FF5500]/50 transition">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div>
                    <h3 className="font-extrabold text-sm text-gray-900">{anl.patientName}</h3>
                    <p className="text-xs text-gray-500">{anl.primaryDiagnosis}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#FF5500]/10 text-[#FF5500] font-mono">
                    {anl.date}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 my-3 text-center">
                  <div className="bg-gray-50 p-2 rounded-xl border border-gray-100">
                    <p className="text-[10px] uppercase text-gray-400 font-bold">VAS Pain</p>
                    <p className="text-base font-black text-gray-900">{anl.vasPainScore}/10</p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded-xl border border-gray-100">
                    <p className="text-[10px] uppercase text-gray-400 font-bold">Functional</p>
                    <p className="text-base font-black text-blue-600">{anl.functionalIndex}%</p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded-xl border border-gray-100">
                    <p className="text-[10px] uppercase text-gray-400 font-bold">RTS Readiness</p>
                    <p className="text-base font-black text-emerald-600">{anl.readinessToReturnPercent}%</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <span className="text-xs text-gray-500">{anl.rehabPhase}</span>
                  <button
                    onClick={() => exportToJson(`FRL_ANALYSIS_${anl.patientName}_${anl.id}`, anl)}
                    className="flex items-center gap-1 text-xs font-bold text-[#FF5500] hover:underline cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download Report</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
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
                Are you sure you want to permanently delete the following appointment from the clinic system?
              </p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 text-xs space-y-1.5 font-mono">
              <p><strong className="text-gray-900">Patient:</strong> {appointmentToDelete.patientName}</p>
              <p><strong className="text-gray-900">Service:</strong> {appointmentToDelete.service}</p>
              <p><strong className="text-gray-900">Date & Slot:</strong> {appointmentToDelete.date} @ {appointmentToDelete.timeSlot}</p>
              <p><strong className="text-gray-900">Fee:</strong> ₹{appointmentToDelete.fee}</p>
              <p><strong className="text-gray-900">Current Status:</strong> {appointmentToDelete.status}</p>
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
                id="btn-confirm-delete-apt"
                onClick={handleConfirmDeleteAppointment}
                disabled={deleteLoading}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-wider transition shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{deleteLoading ? 'Deleting...' : 'Confirm Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: COMPLETE PATIENT DOSSIER VIEWER                         */}
      {/* ============================================================== */}
      {selectedPatientDossier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto animate-in fade-in">
          <div className="bg-white border border-gray-200 rounded-3xl max-w-3xl w-full p-6 shadow-2xl my-8 max-h-[90vh] overflow-y-auto space-y-6">
            {/* Dossier Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black text-gray-900 font-display">
                    {selectedPatientDossier.patient.fullName}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#FF5500]/10 text-[#FF5500]">
                    Complete Dossier
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  ID: {selectedPatientDossier.patient.id} • Registered: {selectedPatientDossier.patient.createdAt?.slice(0, 10)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadSinglePatientDossier(selectedPatientDossier.patient)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#FF5500] hover:bg-[#E04B00] text-white font-extrabold text-xs uppercase tracking-wider transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download JSON</span>
                </button>
                <button
                  onClick={() => triggerPrint()}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
                <button
                  onClick={() => setSelectedPatientDossier(null)}
                  className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Demographics & History */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-200 text-xs">
              <div>
                <p className="text-gray-500 text-[10px] uppercase font-bold">Contact Phone</p>
                <p className="font-mono font-bold text-gray-900 mt-0.5">{selectedPatientDossier.patient.phone}</p>
              </div>
              <div>
                <p className="text-gray-500 text-[10px] uppercase font-bold">Email Address</p>
                <p className="font-semibold text-gray-900 mt-0.5 truncate">{selectedPatientDossier.patient.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-500 text-[10px] uppercase font-bold">Age & Gender</p>
                <p className="font-semibold text-gray-900 mt-0.5">
                  {selectedPatientDossier.patient.gender || 'Unspecified'} ({selectedPatientDossier.patient.age || 'N/A'} yrs)
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-[10px] uppercase font-bold">Emergency Contact</p>
                <p className="font-mono font-semibold text-gray-900 mt-0.5">{selectedPatientDossier.patient.emergencyContact || 'None'}</p>
              </div>
            </div>

            {/* Medical History */}
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 text-xs">
              <p className="font-bold text-amber-900 uppercase text-[10px] tracking-wider mb-1">Reported Medical History & Notes</p>
              <p className="text-amber-950 leading-relaxed font-medium">
                {selectedPatientDossier.patient.medicalHistory || 'No pre-existing conditions or orthopedic contraindications reported.'}
              </p>
            </div>

            {/* Consultation Timeline */}
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#FF5500]" />
                <span>Consultation History ({selectedPatientDossier.appointments.length})</span>
              </h4>
              <div className="border border-gray-200 rounded-2xl divide-y divide-gray-100 overflow-hidden text-xs">
                {selectedPatientDossier.appointments.length === 0 ? (
                  <p className="p-4 text-gray-400 italic">No appointments recorded</p>
                ) : (
                  selectedPatientDossier.appointments.map(apt => (
                    <div key={apt.id} className="p-3 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-gray-900">{apt.service}</p>
                        <p className="text-[11px] text-gray-500">Dr: {apt.doctorName} • {apt.date} @ {apt.timeSlot}</p>
                      </div>
                      <div className="text-right">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">
                          {apt.status}
                        </span>
                        <p className="font-mono font-bold text-gray-900 mt-0.5">₹{apt.fee}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Biomechanical Analyses */}
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-[#FF5500]" />
                <span>Biomechanical Diagnostic Screenings ({selectedPatientDossier.analyses.length})</span>
              </h4>
              <div className="border border-gray-200 rounded-2xl divide-y divide-gray-100 overflow-hidden text-xs">
                {selectedPatientDossier.analyses.length === 0 ? (
                  <p className="p-4 text-gray-400 italic">No movement screenings recorded for this patient</p>
                ) : (
                  selectedPatientDossier.analyses.map(anl => (
                    <div key={anl.id} className="p-3">
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          <p className="font-bold text-gray-900">{anl.primaryDiagnosis}</p>
                          <p className="text-[11px] text-[#FF5500] font-semibold">{anl.rehabPhase}</p>
                        </div>
                        <span className="font-mono text-xs text-gray-500">{anl.date}</span>
                      </div>
                      <div className="flex gap-4 text-[11px] text-gray-600 mt-2 font-mono">
                        <span>VAS Pain: <strong>{anl.vasPainScore}/10</strong></span>
                        <span>Functional Index: <strong>{anl.functionalIndex}%</strong></span>
                        <span>Readiness: <strong>{anl.readinessToReturnPercent}%</strong></span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
