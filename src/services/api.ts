import { User, Appointment, Invoice, Prescription, AppNotification, ServiceItem, AppointmentStatus, PatientAnalysis } from '../types.js';

const TOKEN_KEY = 'frl_auth_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Network request failed' }));
    throw new Error(errorData.error || `HTTP error ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Auth
  async login(username: string, password: string): Promise<{ token: string; user: User }> {
    const res = await request<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    setStoredToken(res.token);
    return res;
  },

  async register(data: {
    username: string;
    password: string;
    fullName: string;
    phone: string;
    email?: string;
    gender?: string;
    age?: number;
    medicalHistory?: string;
    emergencyContact?: string;
  }): Promise<{ token: string; user: User }> {
    const res = await request<{ token: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    setStoredToken(res.token);
    return res;
  },

  async getCurrentUser(): Promise<User> {
    return request<User>('/api/auth/me');
  },

  async updateProfile(updates: Partial<User>): Promise<User> {
    return request<User>('/api/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  async logout(): Promise<void> {
    try {
      await request('/api/auth/logout', { method: 'POST' });
    } finally {
      clearStoredToken();
    }
  },

  // Services
  async getServices(): Promise<ServiceItem[]> {
    return request<ServiceItem[]>('/api/services');
  },

  // Appointments
  async getAppointments(): Promise<Appointment[]> {
    return request<Appointment[]>('/api/appointments');
  },

  async createAppointment(data: {
    service: string;
    date: string;
    timeSlot: string;
    notes?: string;
    rehabGoals?: string;
    doctorId?: string;
    patientId?: string;
  }): Promise<{ appointment: Appointment; invoice: Invoice }> {
    return request<{ appointment: Appointment; invoice: Invoice }>('/api/appointments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateAppointmentStatus(id: string, status: AppointmentStatus): Promise<Appointment> {
    return request<Appointment>(`/api/appointments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async deleteAppointment(id: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(`/api/appointments/${id}`, {
      method: 'DELETE',
    });
  },

  // Invoices
  async getInvoices(): Promise<Invoice[]> {
    return request<Invoice[]>('/api/invoices');
  },

  async getInvoiceById(id: string): Promise<Invoice> {
    return request<Invoice>(`/api/invoices/${id}`);
  },

  // Prescriptions
  async getPrescriptions(): Promise<Prescription[]> {
    return request<Prescription[]>('/api/prescriptions');
  },

  async createPrescription(data: {
    patientId: string;
    diagnosis: string;
    symptoms?: string;
    appointmentId?: string;
    exercises: {
      id: string;
      name: string;
      sets: number;
      repsOrDuration: string;
      frequency: string;
      notes?: string;
    }[];
    medications: {
      id: string;
      name: string;
      dosage: string;
      frequency: string;
      duration: string;
      instructions?: string;
    }[];
    precautions: string[];
    lifestyleAdvice?: string;
    nextFollowUp?: string;
  }): Promise<Prescription> {
    return request<Prescription>('/api/prescriptions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Notifications
  async getNotifications(): Promise<AppNotification[]> {
    return request<AppNotification[]>('/api/notifications');
  },

  async markNotificationRead(id: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/api/notifications/${id}/read`, {
      method: 'PATCH',
    });
  },

  async sendNotification(data: {
    recipientId: string;
    title: string;
    message: string;
    type?: string;
  }): Promise<AppNotification> {
    return request<AppNotification>('/api/notifications/send', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Staff: Patients Management
  async getPatients(): Promise<(User & {
    appointmentCount: number;
    prescriptionCount: number;
    invoiceCount: number;
    lastVisitDate: string | null;
    lastService: string | null;
  })[]> {
    return request('/api/patients');
  },

  async getPatientHistory(patientId: string): Promise<{
    patient: User;
    appointments: Appointment[];
    prescriptions: Prescription[];
    invoices: Invoice[];
    analyses?: PatientAnalysis[];
  }> {
    return request(`/api/patients/${patientId}/history`);
  },

  // Patient Biomechanical Analyses
  async getAnalyses(patientId?: string): Promise<PatientAnalysis[]> {
    const query = patientId ? `?patientId=${encodeURIComponent(patientId)}` : '';
    return request<PatientAnalysis[]>(`/api/analyses${query}`);
  },

  async getAnalysisById(id: string): Promise<PatientAnalysis> {
    return request<PatientAnalysis>(`/api/analyses/${id}`);
  },

  async saveAnalysis(data: Partial<PatientAnalysis> & { patientId: string; primaryDiagnosis: string }): Promise<PatientAnalysis> {
    return request<PatientAnalysis>('/api/analyses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async deleteAnalysis(id: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/api/analyses/${id}`, {
      method: 'DELETE',
    });
  },

  // Admin Endpoints for Cloudfare
  async downloadFullDatabaseDump(): Promise<any> {
    return request<any>('/api/admin/database/export');
  },

  async downloadPatientDossiers(): Promise<any[]> {
    return request<any[]>('/api/admin/patients/export');
  },
};

// WhatsApp Web Click-to-Chat URL Generator for +91 80885 96486
export function generateWhatsAppBookingUrl(appointment: Appointment, invoice: Invoice): string {
  const targetPhone = '918088596486';
  const text = [
    `*FUNCTIONAL REHAB LAB* | Appointment & Invoice`,
    `----------------------------------------`,
    `*Patient Name:* ${appointment.patientName}`,
    `*Contact:* ${appointment.patientPhone}`,
    `*Service:* ${appointment.service}`,
    `*Consulting Specialist:* ${appointment.doctorName}`,
    `*Date & Time:* ${appointment.date} @ ${appointment.timeSlot}`,
    `*Status:* ${appointment.status}`,
    `----------------------------------------`,
    `*Invoice Number:* ${invoice.invoiceNumber}`,
    `*Amount:* ₹${invoice.total.toLocaleString('en-IN')}`,
    `*Payment Status:* ${invoice.paymentStatus}`,
    `----------------------------------------`,
    `*Clinic:* Functional Rehab Lab, #14, 2nd Floor, 100ft Rd, Indiranagar, Bengaluru`,
    `*Direct Desk:* +91 80885 96486`,
  ].join('\n');

  return `https://wa.me/${targetPhone}?text=${encodeURIComponent(text)}`;
}

// Realtime SSE Event Listener
export function setupRealtimeSync(
  token: string | null,
  onEvent: (event: { type: string; data: unknown }) => void
): () => void {
  const url = token ? `/api/events?token=${encodeURIComponent(token)}` : '/api/events';
  const eventSource = new EventSource(url);

  eventSource.onmessage = (e) => {
    try {
      const parsed = JSON.parse(e.data);
      onEvent(parsed);
    } catch (err) {
      console.error('Failed to parse SSE payload:', err);
    }
  };

  eventSource.onerror = (err) => {
    console.warn('SSE connection warning, will reconnect automatically:', err);
  };

  return () => {
    eventSource.close();
  };
}

// Real Web Push / Browser Notification helper
export async function requestPushPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    return false;
  }
  if (Notification.permission === 'granted') {
    return true;
  }
  if (Notification.permission !== 'denied') {
    const perm = await Notification.requestPermission();
    return perm === 'granted';
  }
  return false;
}

export function triggerBrowserNotification(title: string, body: string) {
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: '/pwa-192x192.png',
        badge: '/icon.svg',
      });
    } catch {
      // Ignore if iframe blocks
    }
  }
}
