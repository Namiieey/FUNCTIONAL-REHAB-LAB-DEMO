import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db, verifyPassword, hashPassword } from './server/db.js';
import { User, AppointmentStatus } from './src/types.js';

interface AuthenticatedRequest extends Request {
  user?: User;
}

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory SSE connections for realtime synchronization
interface SSEClient {
  id: string;
  res: Response;
  userId?: string;
  role?: string;
}

const sseClients: Map<string, SSEClient> = new Map();

export function broadcastEvent(event: { type: string; data: unknown; recipientId?: string }) {
  const payload = `data: ${JSON.stringify(event)}\n\n`;
  for (const client of sseClients.values()) {
    if (
      !event.recipientId ||
      event.recipientId === 'ALL' ||
      client.role === 'admin' ||
      client.role === 'doctor' ||
      client.userId === event.recipientId
    ) {
      try {
        client.res.write(payload);
      } catch (err) {
        console.error('Failed to send SSE to client:', client.id, err);
      }
    }
  }
}

// Authentication Middleware
function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.substring(7);
  const user = db.validateSession(token);
  if (!user) {
    return res.status(401).json({ error: 'Session expired or invalid token' });
  }

  req.user = user;
  next();
}

function requireStaff(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'doctor')) {
    return res.status(403).json({ error: 'Access restricted to medical doctors and clinical administrators' });
  }
  next();
}

// --- API ROUTES ---

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'FUNCTIONAL REHAB LAB Cloud API', timestamp: new Date().toISOString() });
});

// SSE Realtime Stream
app.get('/api/events', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const token = req.query.token as string | undefined;
  let user: User | null = null;
  if (token) {
    user = db.validateSession(token);
  }

  const clientId = `client-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  sseClients.set(clientId, {
    id: clientId,
    res,
    userId: user?.id,
    role: user?.role
  });

  // Initial connection handshake
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', clientId })}\n\n`);

  // Periodic heartbeat
  const heartbeat = setInterval(() => {
    try {
      res.write(': heartbeat\n\n');
    } catch {
      clearInterval(heartbeat);
    }
  }, 20000);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseClients.delete(clientId);
  });
});

// Services List
app.get('/api/services', (req, res) => {
  res.json(db.getServices());
});

// Auth: Login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const userRecord = db.findUserByUsername(username.trim());
  if (!userRecord) {
    return res.status(401).json({ error: 'Invalid credentials. Please verify your username and password.' });
  }

  const isValid = verifyPassword(password, userRecord.passwordHash, userRecord.salt);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid credentials. Please verify your username and password.' });
  }

  const token = db.createSession(userRecord.id);
  const { passwordHash, salt, ...safeUser } = userRecord;

  res.json({ token, user: safeUser });
});

// Auth: Register (Patients)
app.post('/api/auth/register', (req, res) => {
  const { username, password, fullName, email, phone, gender, age, medicalHistory, emergencyContact } = req.body;

  if (!username || !password || !fullName || !phone) {
    return res.status(400).json({ error: 'Full name, phone, username, and password are required' });
  }

  if (username.length < 3) {
    return res.status(400).json({ error: 'Username must be at least 3 characters' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const existing = db.findUserByUsername(username.trim());
  if (existing) {
    return res.status(409).json({ error: 'Username already taken. Please choose another.' });
  }

  const { hash, salt } = hashPassword(password);
  const newUser = db.createUser({
    username: username.trim(),
    role: 'patient',
    fullName: fullName.trim(),
    email: email ? email.trim() : `${username.trim()}@patient.frl`,
    phone: phone.trim(),
    gender: gender || 'Unspecified',
    age: age ? Number(age) : undefined,
    medicalHistory: medicalHistory || '',
    emergencyContact: emergencyContact || '',
    passwordHash: hash,
    salt
  });

  const token = db.createSession(newUser.id);
  res.status(201).json({ token, user: newUser });
});

// Auth: Current User Profile
app.get('/api/auth/me', authenticate, (req: AuthenticatedRequest, res) => {
  res.json(req.user);
});

// Auth: Update Profile
app.patch('/api/auth/profile', authenticate, (req: AuthenticatedRequest, res) => {
  const { fullName, phone, email, gender, age, medicalHistory, emergencyContact } = req.body;
  const updated = db.updateUserProfile(req.user!.id, {
    fullName,
    phone,
    email,
    gender,
    age: age ? Number(age) : undefined,
    medicalHistory,
    emergencyContact
  });
  if (!updated) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(updated);
});

// Auth: Logout
app.post('/api/auth/logout', authenticate, (req: AuthenticatedRequest, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    db.deleteSession(authHeader.substring(7));
  }
  res.json({ success: true });
});

// Appointments: List
app.get('/api/appointments', authenticate, (req: AuthenticatedRequest, res) => {
  const appointments = db.getAppointments(req.user!.id, req.user!.role);
  res.json(appointments);
});

// Appointments: Create (Patient or Doctor booking)
app.post('/api/appointments', authenticate, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { service, date, timeSlot, notes, rehabGoals, doctorId, patientId } = req.body;

  if (!service || !date || !timeSlot) {
    return res.status(400).json({ error: 'Service, date, and time slot are required' });
  }

  // Determine target patient
  let targetPatient: User | undefined;
  if ((user.role === 'admin' || user.role === 'doctor') && patientId) {
    targetPatient = db.findUserById(patientId);
  } else {
    targetPatient = user;
  }

  if (!targetPatient) {
    return res.status(400).json({ error: 'Invalid patient record' });
  }

  // Determine target doctor
  let assignedDoctor = db.findUserById(doctorId);
  if (!assignedDoctor || (assignedDoctor.role !== 'doctor' && assignedDoctor.role !== 'admin')) {
    // Default to Dr. Anand G R
    const doc = db.findUserByUsername('Dr_AnandGR');
    if (doc) {
      assignedDoctor = db.findUserById(doc.id);
    }
  }

  const doctorName = assignedDoctor?.fullName || 'Dr. Anand G R (PT)';
  const docId = assignedDoctor?.id || 'doc-1';

  // Find service fee
  const allServices = db.getServices();
  const matchedService = allServices.find(s => s.name === service);
  const fee = matchedService ? matchedService.fee : 1500;

  const result = db.createAppointment({
    patientId: targetPatient.id,
    patientName: targetPatient.fullName,
    patientPhone: targetPatient.phone,
    patientEmail: targetPatient.email,
    doctorId: docId,
    doctorName,
    service,
    date,
    timeSlot,
    status: 'Confirmed',
    notes: notes || '',
    rehabGoals: rehabGoals || '',
    fee
  });

  // Broadcast realtime update
  broadcastEvent({
    type: 'APPOINTMENT_CREATED',
    data: result,
    recipientId: targetPatient.id
  });

  res.status(201).json(result);
});

// Appointments: Update Status
app.patch('/api/appointments/:id/status', authenticate, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { status } = req.body as { status: AppointmentStatus };
  const user = req.user!;

  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }

  // Patients can only cancel their own appointments
  if (user.role === 'patient') {
    const apt = db.getAppointments(user.id, user.role).find(a => a.id === id);
    if (!apt) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    if (status !== 'Cancelled') {
      return res.status(403).json({ error: 'Patients can only cancel appointments' });
    }
  }

  const updated = db.updateAppointmentStatus(id, status, user);
  if (!updated) {
    return res.status(404).json({ error: 'Appointment not found' });
  }

  broadcastEvent({
    type: 'STATUS_CHANGED',
    data: updated,
    recipientId: updated.patientId
  });

  res.json(updated);
});

// Appointments: Delete (Doctor/Admin only)
app.delete('/api/appointments/:id', authenticate, requireStaff, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const deleted = db.deleteAppointment(id);
  if (!deleted) {
    return res.status(404).json({ error: 'Appointment not found' });
  }

  broadcastEvent({
    type: 'APPOINTMENT_DELETED',
    data: { id }
  });

  res.json({ success: true, message: 'Appointment deleted successfully' });
});

// Invoices: List
app.get('/api/invoices', authenticate, (req: AuthenticatedRequest, res) => {
  const invoices = db.getInvoices(req.user!.id, req.user!.role);
  res.json(invoices);
});

// Invoices: Get Single
app.get('/api/invoices/:id', authenticate, (req: AuthenticatedRequest, res) => {
  const invoice = db.getInvoiceById(req.params.id);
  if (!invoice) {
    return res.status(404).json({ error: 'Invoice not found' });
  }

  // Security authorization check: patients can only access their own invoices
  if (req.user!.role === 'patient' && invoice.patientId !== req.user!.id) {
    return res.status(403).json({ error: 'Unauthorized invoice access' });
  }

  res.json(invoice);
});

// Prescriptions: List
app.get('/api/prescriptions', authenticate, (req: AuthenticatedRequest, res) => {
  const prescriptions = db.getPrescriptions(req.user!.id, req.user!.role);
  res.json(prescriptions);
});

// Prescriptions: Create (Doctor/Admin only)
app.post('/api/prescriptions', authenticate, requireStaff, (req: AuthenticatedRequest, res) => {
  const doctor = req.user!;
  const { patientId, diagnosis, symptoms, exercises, medications, precautions, lifestyleAdvice, nextFollowUp, appointmentId } = req.body;

  if (!patientId || !diagnosis) {
    return res.status(400).json({ error: 'Patient and clinical diagnosis are required' });
  }

  const patient = db.findUserById(patientId);
  if (!patient) {
    return res.status(404).json({ error: 'Patient not found' });
  }

  const rx = db.createPrescription({
    patientId,
    patientName: patient.fullName,
    doctorId: doctor.id,
    doctorName: doctor.fullName,
    appointmentId,
    date: new Date().toISOString().split('T')[0],
    diagnosis,
    symptoms: symptoms || '',
    exercises: Array.isArray(exercises) ? exercises : [],
    medications: Array.isArray(medications) ? medications : [],
    precautions: Array.isArray(precautions) ? precautions : [],
    lifestyleAdvice: lifestyleAdvice || '',
    nextFollowUp: nextFollowUp || ''
  });

  broadcastEvent({
    type: 'PRESCRIPTION_ADDED',
    data: rx,
    recipientId: patientId
  });

  res.status(201).json(rx);
});

// Notifications: List
app.get('/api/notifications', authenticate, (req: AuthenticatedRequest, res) => {
  const notifications = db.getNotifications(req.user!.id);
  res.json(notifications);
});

// Notifications: Mark Read
app.patch('/api/notifications/:id/read', authenticate, (req: AuthenticatedRequest, res) => {
  const success = db.markNotificationRead(req.params.id, req.user!.id);
  if (!success) {
    return res.status(404).json({ error: 'Notification not found' });
  }
  res.json({ success: true });
});

// Notifications: Send (Doctor/Admin)
app.post('/api/notifications/send', authenticate, requireStaff, (req: AuthenticatedRequest, res) => {
  const sender = req.user!;
  const { recipientId, title, message, type } = req.body;

  if (!recipientId || !title || !message) {
    return res.status(400).json({ error: 'Recipient, title, and message are required' });
  }

  const notification = db.createNotification({
    recipientId,
    senderId: sender.id,
    senderName: sender.fullName,
    title,
    message,
    type: type || 'general',
    readBy: []
  });

  broadcastEvent({
    type: 'NOTIFICATION_SENT',
    data: notification,
    recipientId
  });

  res.status(201).json(notification);
});

// Patients: List & History (Doctor/Admin only)
app.get('/api/patients', authenticate, requireStaff, (req: AuthenticatedRequest, res) => {
  const patients = db.getAllPatients();
  const appointments = db.getAppointments(req.user!.id, 'admin');
  const prescriptions = db.getPrescriptions(req.user!.id, 'admin');
  const invoices = db.getInvoices(req.user!.id, 'admin');

  const enriched = patients.map(p => {
    const userApts = appointments.filter(a => a.patientId === p.id);
    const userRxs = prescriptions.filter(r => r.patientId === p.id);
    const userInvs = invoices.filter(i => i.patientId === p.id);
    const lastApt = userApts[0];

    return {
      ...p,
      appointmentCount: userApts.length,
      prescriptionCount: userRxs.length,
      invoiceCount: userInvs.length,
      lastVisitDate: lastApt ? lastApt.date : null,
      lastService: lastApt ? lastApt.service : null
    };
  });

  res.json(enriched);
});

// Patient Detail History (Doctor/Admin only)
app.get('/api/patients/:id/history', authenticate, requireStaff, (req: AuthenticatedRequest, res) => {
  const patient = db.findUserById(req.params.id);
  if (!patient) {
    return res.status(404).json({ error: 'Patient not found' });
  }

  const appointments = db.getAppointments(patient.id, 'patient');
  const prescriptions = db.getPrescriptions(patient.id, 'patient');
  const invoices = db.getInvoices(patient.id, 'patient');
  const analyses = db.getPatientAnalyses(patient.id, 'patient');

  res.json({
    patient,
    appointments,
    prescriptions,
    invoices,
    analyses
  });
});

// --- Patient Analyses & Biomechanical Screenings ---
// List analyses
app.get('/api/analyses', authenticate, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const targetPatientId = user.role === 'patient' 
    ? user.id 
    : (req.query.patientId as string | undefined);

  const analyses = db.getPatientAnalyses(targetPatientId || user.id, user.role);
  res.json(analyses);
});

// Get single analysis
app.get('/api/analyses/:id', authenticate, (req: AuthenticatedRequest, res) => {
  const analysis = db.getPatientAnalysisById(req.params.id);
  if (!analysis) {
    return res.status(404).json({ error: 'Patient analysis record not found' });
  }

  // If patient, restrict to their own
  if (req.user!.role === 'patient' && analysis.patientId !== req.user!.id) {
    return res.status(403).json({ error: 'Unauthorized to view this analysis' });
  }

  res.json(analysis);
});

// Create or update analysis (Doctor/Admin only)
app.post('/api/analyses', authenticate, requireStaff, (req: AuthenticatedRequest, res) => {
  const doctor = req.user!;
  const { patientId, primaryDiagnosis } = req.body;

  if (!patientId || !primaryDiagnosis) {
    return res.status(400).json({ error: 'Patient selection and primary diagnosis are required' });
  }

  const patient = db.findUserById(patientId);
  if (!patient) {
    return res.status(404).json({ error: 'Patient not found' });
  }

  const saved = db.savePatientAnalysis({
    ...req.body,
    patientName: patient.fullName,
    patientAge: patient.age,
    patientGender: patient.gender
  }, doctor);

  broadcastEvent({
    type: 'ANALYSIS_UPDATED',
    data: saved,
    recipientId: saved.patientId
  });

  res.status(201).json(saved);
});

// Delete analysis (Doctor/Admin only)
app.delete('/api/analyses/:id', authenticate, requireStaff, (req: AuthenticatedRequest, res) => {
  const success = db.deletePatientAnalysis(req.params.id);
  if (!success) {
    return res.status(404).json({ error: 'Analysis record not found' });
  }
  res.json({ success: true });
});

// --- ADMIN SYSTEM EXPORTS (Cloudfare Admin {Not a Doctor}) ---
// Full Web App Database Download
app.get('/api/admin/database/export', authenticate, (req: AuthenticatedRequest, res) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Only Cloudfare (Admin) is authorized to download the complete web app database.' });
  }
  const fullDump = db.getFullDatabaseDump();
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="FRL_COMPLETE_DATABASE_DUMP_${new Date().toISOString().slice(0, 10)}.json"`);
  res.json(fullDump);
});

// Complete Patient Details Download
app.get('/api/admin/patients/export', authenticate, (req: AuthenticatedRequest, res) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Only Cloudfare (Admin) is authorized to download complete patient details.' });
  }
  const dossiers = db.getCompletePatientDossiers();
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="FRL_COMPLETE_PATIENT_DOSSIERS_${new Date().toISOString().slice(0, 10)}.json"`);
  res.json(dossiers);
});

// --- VITE MIDDLEWARE & STATIC SERVING ---
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FUNCTIONAL REHAB LAB server running on port ${PORT}`);
  });
}

startServer();
