export type UserRole = 'admin' | 'doctor' | 'patient';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  fullName: string;
  email: string;
  phone: string;
  gender?: string;
  age?: number;
  medicalHistory?: string;
  emergencyContact?: string;
  specialty?: string;
  createdAt: string;
}

export type AppointmentStatus = 'Scheduled' | 'Confirmed' | 'In Progress' | 'Completed' | 'Cancelled';

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  doctorId: string;
  doctorName: string;
  service: string;
  date: string;
  timeSlot: string;
  status: AppointmentStatus;
  notes?: string;
  rehabGoals?: string;
  invoiceId: string;
  fee: number;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  description: string;
  code?: string;
  amount: number;
  qty: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  doctorName: string;
  date: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentStatus: 'Paid' | 'Pending' | 'Due';
  paymentMethod: string;
  clinicInfo: {
    name: string;
    tagline: string;
    address: string;
    phone: string;
    email: string;
    gstin: string;
  };
  createdAt: string;
}

export interface ExerciseItem {
  id: string;
  name: string;
  sets: number;
  repsOrDuration: string;
  frequency: string;
  notes?: string;
}
export type ExercisePrescriptionItem = ExerciseItem;

export interface MedicationItem {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}
export type MedicationPrescriptionItem = MedicationItem;

export interface Prescription {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  appointmentId?: string;
  date: string;
  diagnosis: string;
  symptoms?: string;
  exercises: ExerciseItem[];
  medications: MedicationItem[];
  precautions: string[];
  lifestyleAdvice?: string;
  nextFollowUp: string;
  createdAt: string;
}

export type NotificationType = 'appointment' | 'prescription' | 'invoice' | 'clinical_alert' | 'general';

export interface AppNotification {
  id: string;
  recipientId: string; // 'ALL' or specific patientId
  senderId: string;
  senderName: string;
  title: string;
  message: string;
  type: NotificationType;
  readBy: string[]; // array of userIds
  createdAt: string;
  link?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ServiceItem {
  id: string;
  name: string;
  duration: string;
  fee: number;
  description: string;
}

export interface RomMetric {
  joint: string;
  movement: string;
  currentDeg: number;
  targetDeg: number;
  unit?: string;
  status?: 'Optimal' | 'Progressing' | 'Impaired';
}

export interface StrengthMetric {
  muscleGroup: string;
  leftSide: number;
  rightSide: number;
  unit: string;
  asymmetryPercent: number;
}

export interface FmsScoreItem {
  name: string;
  score: number; // 0-3
  notes?: string;
}

export interface AnalysisHistoryPoint {
  date: string;
  painScore: number;
  functionalIndex: number;
  romScore: number;
  strengthSymmetry: number;
}

export interface PatientAnalysis {
  id: string;
  patientId: string;
  patientName: string;
  patientAge?: number;
  patientGender?: string;
  doctorId: string;
  doctorName: string;
  date: string;
  primaryDiagnosis: string;
  vasPainScore: number; // 0 to 10
  functionalIndex: number; // 0 to 100%
  rehabPhase: 'Phase 1: Acute Protection' | 'Phase 2: Mobility & Motor Control' | 'Phase 3: Hypertrophy & Kinetic Chain' | 'Phase 4: Return-to-Sport & Explosive Plyometrics';
  clearanceStatus: 'Restricted' | 'Modified Training' | 'Full Athletic Clearance';
  readinessToReturnPercent: number; // 0-100%
  romMetrics: RomMetric[];
  strengthMetrics: StrengthMetric[];
  fmsScores: FmsScoreItem[];
  fmsTotal: number; // /21
  biomechanicalFindings: string;
  clinicalRecommendations: string[];
  historyTimeline: AnalysisHistoryPoint[];
  createdAt: string;
  updatedAt: string;
}

