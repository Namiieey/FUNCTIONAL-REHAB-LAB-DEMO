import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { User, Appointment, Invoice, Prescription, AppNotification, ServiceItem, PatientAnalysis } from '../src/types.js';

export interface DatabaseSchema {
  users: (User & { passwordHash: string; salt: string })[];
  sessions: { token: string; userId: string; expiresAt: number }[];
  appointments: Appointment[];
  invoices: Invoice[];
  prescriptions: Prescription[];
  notifications: AppNotification[];
  services: ServiceItem[];
  patientAnalyses: PatientAnalysis[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Password hashing using Node's native crypto
export function hashPassword(password: string, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string) {
  const check = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(check, 'hex'));
}

const initialServices: ServiceItem[] = [
  {
    id: 'srv-1',
    name: 'Sports Injury & Athletic Performance Rehab',
    duration: '45 mins',
    fee: 1500,
    description: 'Targeted biomechanical recovery, joint mobilization, eccentric loading, and return-to-sport protocols.'
  },
  {
    id: 'srv-2',
    name: 'Spine, Cervical & Posture Realignment',
    duration: '45 mins',
    fee: 1400,
    description: 'McKenzie approach, core kinetic chain activation, lumbar decompression, and postural correction.'
  },
  {
    id: 'srv-3',
    name: 'Post-Surgical Orthopedic Rehabilitation',
    duration: '60 mins',
    fee: 1800,
    description: 'ACL reconstruction, meniscus, rotator cuff, and total joint replacement recovery protocol.'
  },
  {
    id: 'srv-4',
    name: 'Dry Needling & Advanced Manual Therapy',
    duration: '40 mins',
    fee: 1600,
    description: 'Myofascial trigger point release, neuro-fascial modulation, and neuromuscular stimulation.'
  },
  {
    id: 'srv-5',
    name: 'Biomechanical Gait & Movement Screening',
    duration: '50 mins',
    fee: 2000,
    description: 'High-speed kinetic video analysis, plantar pressure distribution, and functional movement assessment.'
  }
];

function seedDatabase(): DatabaseSchema {
  const drAnand = hashPassword('dranand@123');
  const cloudfare = hashPassword('cloudfare@123');
  const demoPatient = hashPassword('patient@123');

  const now = new Date();
  const pastDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const upcomingDate = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const todayDate = now.toISOString().split('T')[0];

  const users: DatabaseSchema['users'] = [
    {
      id: 'doc-1',
      username: 'Dr_AnandGR',
      role: 'doctor',
      fullName: 'Dr. Anand G R (PT)',
      email: 'anand@functionalrehablab.com',
      phone: '+91 80885 96486',
      gender: 'Male',
      age: 38,
      specialty: 'Lead Physiotherapist & Sports Rehab Specialist',
      medicalHistory: '',
      emergencyContact: '+91 80885 96486',
      createdAt: new Date().toISOString(),
      passwordHash: drAnand.hash,
      salt: drAnand.salt
    },
    {
      id: 'admin-1',
      username: 'Cloudfare',
      role: 'admin',
      fullName: 'Cloudfare',
      email: 'admin@functionalrehablab.com',
      phone: '+91 80885 96486',
      gender: 'Male',
      age: 40,
      specialty: 'Clinical Operations & Database Administrator {Not a Doctor}',
      medicalHistory: '',
      emergencyContact: '+91 80885 96486',
      createdAt: new Date().toISOString(),
      passwordHash: cloudfare.hash,
      salt: cloudfare.salt
    },
    {
      id: 'pat-1',
      username: 'rohit_sharma',
      role: 'patient',
      fullName: 'Rohit Sharma',
      email: 'rohit.s@example.com',
      phone: '+91 98451 22345',
      gender: 'Male',
      age: 32,
      medicalHistory: 'Right knee ACL grade-2 sprain during marathon training, chronic lower back stiffness.',
      emergencyContact: 'Mrs. Neha Sharma (+91 98451 99887)',
      createdAt: new Date().toISOString(),
      passwordHash: demoPatient.hash,
      salt: demoPatient.salt
    }
  ];

  const appointments: Appointment[] = [
    {
      id: 'apt-101',
      patientId: 'pat-1',
      patientName: 'Rohit Sharma',
      patientPhone: '+91 98451 22345',
      patientEmail: 'rohit.s@example.com',
      doctorId: 'doc-1',
      doctorName: 'Dr. Anand G R (PT)',
      service: 'Sports Injury & Athletic Performance Rehab',
      date: pastDate,
      timeSlot: '10:30 AM',
      status: 'Completed',
      notes: 'Initial evaluation for right knee stability and quad inhibition.',
      rehabGoals: 'Restore full knee terminal extension, reduce patellofemoral pain.',
      invoiceId: 'inv-101',
      fee: 1500,
      createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'apt-102',
      patientId: 'pat-1',
      patientName: 'Rohit Sharma',
      patientPhone: '+91 98451 22345',
      patientEmail: 'rohit.s@example.com',
      doctorId: 'doc-1',
      doctorName: 'Dr. Anand G R (PT)',
      service: 'Sports Injury & Athletic Performance Rehab',
      date: todayDate,
      timeSlot: '04:00 PM',
      status: 'Confirmed',
      notes: 'Session 2: Closed-kinetic chain strengthening and dry needling on vastus medialis.',
      rehabGoals: 'Improve single leg balance and eccentric control.',
      invoiceId: 'inv-102',
      fee: 1500,
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  const invoices: Invoice[] = [
    {
      id: 'inv-101',
      invoiceNumber: 'FRL-INV-2026-0089',
      appointmentId: 'apt-101',
      patientId: 'pat-1',
      patientName: 'Rohit Sharma',
      patientPhone: '+91 98451 22345',
      doctorName: 'Dr. Anand G R (PT)',
      date: pastDate,
      items: [
        {
          description: 'Sports Injury & Athletic Performance Rehab (Initial Assessment)',
          code: 'REHAB-SPT-01',
          amount: 1500,
          qty: 1
        }
      ],
      subtotal: 1500,
      tax: 0,
      discount: 0,
      total: 1500,
      paymentStatus: 'Paid',
      paymentMethod: 'UPI / Card',
      clinicInfo: {
        name: 'FUNCTIONAL REHAB LAB',
        tagline: 'Advanced Orthopedic & Sports Kinetic Rehabilitation Center',
        address: '#14, 2nd Floor, 100ft Road, Indiranagar, Bengaluru, Karnataka 560038',
        phone: '+91 80885 96486',
        email: 'care@functionalrehablab.com',
        gstin: '29AABCF9241K1ZP'
      },
      createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'inv-102',
      invoiceNumber: 'FRL-INV-2026-0094',
      appointmentId: 'apt-102',
      patientId: 'pat-1',
      patientName: 'Rohit Sharma',
      patientPhone: '+91 98451 22345',
      doctorName: 'Dr. Anand G R (PT)',
      date: todayDate,
      items: [
        {
          description: 'Sports Injury & Athletic Performance Rehab (Session 2)',
          code: 'REHAB-SPT-02',
          amount: 1500,
          qty: 1
        }
      ],
      subtotal: 1500,
      tax: 0,
      discount: 0,
      total: 1500,
      paymentStatus: 'Paid',
      paymentMethod: 'UPI / Card',
      clinicInfo: {
        name: 'FUNCTIONAL REHAB LAB',
        tagline: 'Advanced Orthopedic & Sports Kinetic Rehabilitation Center',
        address: '#14, 2nd Floor, 100ft Road, Indiranagar, Bengaluru, Karnataka 560038',
        phone: '+91 80885 96486',
        email: 'care@functionalrehablab.com',
        gstin: '29AABCF9241K1ZP'
      },
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  const prescriptions: Prescription[] = [
    {
      id: 'rx-101',
      patientId: 'pat-1',
      patientName: 'Rohit Sharma',
      doctorId: 'doc-1',
      doctorName: 'Dr. Anand G R (PT)',
      appointmentId: 'apt-101',
      date: pastDate,
      diagnosis: 'Right Knee Grade-II Anterior Cruciate Ligament (ACL) Strain & VMO Weakness',
      symptoms: 'Anterior knee pain on descending stairs, mild swelling, quadriceps lag.',
      exercises: [
        {
          id: 'ex-1',
          name: 'Straight Leg Raise with Isometric Quad Contraction',
          sets: 3,
          repsOrDuration: '15 reps (5 sec hold)',
          frequency: 'Twice daily',
          notes: 'Focus on full terminal extension with ankle dorsiflexed.'
        },
        {
          id: 'ex-2',
          name: 'Terminal Knee Extension (TKE) with Green Resistance Band',
          sets: 3,
          repsOrDuration: '20 reps',
          frequency: 'Daily morning & evening',
          notes: 'Keep knee tracking directly over 2nd toe; no inward collapse.'
        },
        {
          id: 'ex-3',
          name: 'Wall Squat Hold with Yoga Block between Thighs',
          sets: 4,
          repsOrDuration: '30 seconds hold',
          frequency: 'Once daily',
          notes: 'Bend knees up to 60 degrees only. Squeeze block gently.'
        },
        {
          id: 'ex-4',
          name: 'Single-Leg Proprioceptive Balance on Foam Mat',
          sets: 3,
          repsOrDuration: '45 seconds each leg',
          frequency: 'Daily',
          notes: 'Maintain micro-bend in knee; engage abdominal core.'
        }
      ],
      medications: [
        {
          id: 'med-1',
          name: 'Ice Therapy (Cryo-compression cup)',
          dosage: '15-20 mins',
          frequency: '3 times / day',
          duration: '7 days',
          instructions: 'Apply immediately post-exercise sessions.'
        },
        {
          id: 'med-2',
          name: 'Topical Arnica / Diclofenac Gel',
          dosage: 'Pea-sized amount',
          frequency: 'Twice daily',
          duration: '5 days',
          instructions: 'Gentle circular application around peripatellar tendon.'
        }
      ],
      precautions: [
        'Avoid deep squats past 90 degrees or heavy impact running until re-evaluated.',
        'Wear supportive footwear during all rehabilitation drills.',
        'Cease any exercise immediately if sharp pain (> 3/10 visual analogue scale) is felt.'
      ],
      lifestyleAdvice: 'Elevate right leg while sitting at desk. Maintain adequate hydration and high-collagen protein intake for connective tissue repair.',
      nextFollowUp: upcomingDate,
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  const notifications: AppNotification[] = [
    {
      id: 'notif-1',
      recipientId: 'pat-1',
      senderId: 'doc-1',
      senderName: 'Dr. Anand G R (PT)',
      title: 'Rehabilitation Protocol Assigned',
      message: 'Dr. Anand has uploaded your customized ACL recovery exercises and precautions. Review your prescription tab.',
      type: 'prescription',
      readBy: [],
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'notif-2',
      recipientId: 'pat-1',
      senderId: 'doc-1',
      senderName: 'Dr. Anand G R (PT)',
      title: 'Appointment Confirmed for Today',
      message: 'Your session for Sports Injury & Athletic Performance Rehab is scheduled at 04:00 PM. Please wear athletic clothing.',
      type: 'appointment',
      readBy: [],
      createdAt: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'notif-3',
      recipientId: 'ALL',
      senderId: 'admin-1',
      senderName: 'Clinical Director',
      title: 'Functional Rehab Lab Biomechanics Update',
      message: 'New high-speed wireless EMG kinetic sensors installed at our gait diagnostic lab. Book with your doctor for advanced screening.',
      type: 'clinical_alert',
      readBy: [],
      createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  const patientAnalyses = initialPatientAnalyses(todayDate, now);

  return {
    users,
    sessions: [],
    appointments,
    invoices,
    prescriptions,
    notifications,
    services: initialServices,
    patientAnalyses
  };
}

function initialPatientAnalyses(todayDate: string, now: Date): PatientAnalysis[] {
  return [
    {
      id: 'anl-101',
      patientId: 'pat-1',
      patientName: 'Rohit Sharma',
      patientAge: 28,
      patientGender: 'Male',
      doctorId: 'doc-1',
      doctorName: 'Dr. Anand G R (PT)',
      date: todayDate,
      primaryDiagnosis: 'ACL Reconstruction (Month 4) with Patellar Tendon Autograft & Quadriceps Lag',
      vasPainScore: 2,
      functionalIndex: 82,
      rehabPhase: 'Phase 3: Hypertrophy & Kinetic Chain',
      clearanceStatus: 'Modified Training',
      readinessToReturnPercent: 82,
      romMetrics: [
        { joint: 'Knee Flexion (Right)', movement: 'Active Range', currentDeg: 135, targetDeg: 140, unit: '°', status: 'Optimal' },
        { joint: 'Knee Extension (Right)', movement: 'Terminal Ext', currentDeg: 0, targetDeg: 0, unit: '°', status: 'Optimal' },
        { joint: 'Ankle Dorsiflexion (Right)', movement: 'Weight-bearing Lunge', currentDeg: 38, targetDeg: 42, unit: '°', status: 'Progressing' },
        { joint: 'Hip Internal Rotation', movement: 'Prone Rotation', currentDeg: 34, targetDeg: 35, unit: '°', status: 'Optimal' }
      ],
      strengthMetrics: [
        { muscleGroup: 'Quadriceps Peak Torque (60°/s)', leftSide: 210, rightSide: 178, unit: 'Nm', asymmetryPercent: 15.2 },
        { muscleGroup: 'Hamstrings Peak Torque (60°/s)', leftSide: 130, rightSide: 121, unit: 'Nm', asymmetryPercent: 6.9 },
        { muscleGroup: 'Single-Leg Triple Hop Test', leftSide: 485, rightSide: 432, unit: 'cm', asymmetryPercent: 10.9 },
        { muscleGroup: 'Hip Abductor Dynamometry', leftSide: 28, rightSide: 25, unit: 'kg', asymmetryPercent: 10.7 }
      ],
      fmsScores: [
        { name: 'Deep Squat', score: 2, notes: 'Good depth, slight weight shift to left' },
        { name: 'Hurdle Step', score: 2, notes: 'Mild compensation on right leg step' },
        { name: 'In-line Lunge', score: 2, notes: 'Slight ankle instability right' },
        { name: 'Shoulder Mobility', score: 3, notes: 'Full symmetrical clearance' },
        { name: 'Active Straight-Leg Raise', score: 3, notes: 'Symmetrical hamstring flexibility' },
        { name: 'Trunk Stability Push-up', score: 3, notes: 'Excellent core kinetic stability' },
        { name: 'Rotary Stability', score: 2, notes: 'Minor trunk sway on right side' }
      ],
      fmsTotal: 17,
      biomechanicalFindings: 'Patient shows remarkable neuromuscular progress from Month 2. Quadriceps limb symmetry index (LSI) improved to 84.8%. Dynamic valgus on drop-jump landing is virtually eliminated with good hip glute medius activation. Minor terminal dorsiflexion stiffness remains during deep single-leg deceleration.',
      clinicalRecommendations: [
        'Progress to multi-directional plyometrics (box jumps and lateral skater bounds)',
        'Continue eccentric hamstring curls and Romanian deadlifts to preserve 0.65+ H/Q ratio',
        'Incorporate agility ladder drills with rapid directional deceleration',
        'Re-evaluate in 3 weeks for full athletic contact sports clearance'
      ],
      historyTimeline: [
        { date: '2026-07-15', painScore: 8, functionalIndex: 35, romScore: 65, strengthSymmetry: 55 },
        { date: '2026-08-01', painScore: 6, functionalIndex: 52, romScore: 78, strengthSymmetry: 66 },
        { date: '2026-08-20', painScore: 4, functionalIndex: 68, romScore: 88, strengthSymmetry: 74 },
        { date: '2026-09-05', painScore: 3, functionalIndex: 76, romScore: 94, strengthSymmetry: 80 },
        { date: todayDate, painScore: 2, functionalIndex: 82, romScore: 97, strengthSymmetry: 85 }
      ],
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'anl-102',
      patientId: 'pat-2',
      patientName: 'Priya Patel',
      patientAge: 32,
      patientGender: 'Female',
      doctorId: 'doc-1',
      doctorName: 'Dr. Anand G R (PT)',
      date: todayDate,
      primaryDiagnosis: 'Cervicogenic Headache & Postural Upper Crossed Syndrome with Scapular Dyskinesis',
      vasPainScore: 2,
      functionalIndex: 84,
      rehabPhase: 'Phase 2: Mobility & Motor Control',
      clearanceStatus: 'Modified Training',
      readinessToReturnPercent: 78,
      romMetrics: [
        { joint: 'Cervical Rotation (Right)', movement: 'Active Range', currentDeg: 72, targetDeg: 80, unit: '°', status: 'Optimal' },
        { joint: 'Cervical Rotation (Left)', movement: 'Active Range', currentDeg: 76, targetDeg: 80, unit: '°', status: 'Optimal' },
        { joint: 'Cervical Lateral Flexion', movement: 'Side Bending', currentDeg: 38, targetDeg: 45, unit: '°', status: 'Progressing' },
        { joint: 'Thoracic Extension', movement: 'Foam Roller Extension', currentDeg: 28, targetDeg: 30, unit: '°', status: 'Optimal' }
      ],
      strengthMetrics: [
        { muscleGroup: 'Deep Cervical Flexor Endurance', leftSide: 32, rightSide: 30, unit: 'sec', asymmetryPercent: 6.2 },
        { muscleGroup: 'Serratus Anterior Strength', leftSide: 18, rightSide: 14, unit: 'kg', asymmetryPercent: 22.2 },
        { muscleGroup: 'Lower Trapezius MMT', leftSide: 15, rightSide: 12, unit: 'kg', asymmetryPercent: 20.0 }
      ],
      fmsScores: [
        { name: 'Deep Squat', score: 3, notes: 'Symmetrical' },
        { name: 'Hurdle Step', score: 3, notes: 'Normal' },
        { name: 'In-line Lunge', score: 3, notes: 'Normal' },
        { name: 'Shoulder Mobility', score: 2, notes: 'Right shoulder internal rotation deficit' },
        { name: 'Active Straight-Leg Raise', score: 3, notes: 'Normal' },
        { name: 'Trunk Stability Push-up', score: 2, notes: 'Mild winging on concentric push' },
        { name: 'Rotary Stability', score: 3, notes: 'Normal' }
      ],
      fmsTotal: 19,
      biomechanicalFindings: 'Forward head posture and rounded shoulders significantly reduced with chin tucks and thoracic mobility drills. Scapular winging on right side during wall push-up is down by 60%. Pain episodes reduced from daily to only after 6+ hours of uninterrupted laptop work.',
      clinicalRecommendations: [
        'Continue ergonomic workstation setup with monitor raised to eye level',
        'Integrate banded face pulls and prone Y-raises to strengthen mid/lower trapezius',
        'Micro-breaks every 45 minutes for McKenzie cervical retractions'
      ],
      historyTimeline: [
        { date: '2026-08-10', painScore: 7, functionalIndex: 45, romScore: 60, strengthSymmetry: 62 },
        { date: '2026-08-25', painScore: 5, functionalIndex: 62, romScore: 74, strengthSymmetry: 71 },
        { date: '2026-09-08', painScore: 3, functionalIndex: 75, romScore: 85, strengthSymmetry: 80 },
        { date: todayDate, painScore: 2, functionalIndex: 84, romScore: 92, strengthSymmetry: 86 }
      ],
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];
}

class Database {
  private data: DatabaseSchema;

  constructor() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(DB_FILE)) {
      this.data = seedDatabase();
      this.save();
    } else {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        // Ensure mandatory admin accounts exist with exact required credentials
        this.ensureRequiredAccounts();
      } catch (e) {
        console.error('Error reading db.json, re-seeding:', e);
        this.data = seedDatabase();
        this.save();
      }
    }
  }

  private ensureRequiredAccounts() {
    let changed = false;
    // Check Dr_AnandGR
    const drAnand = this.data.users.find(u => u.username.toLowerCase() === 'dr_anandgr');
    if (!drAnand) {
      const hashed = hashPassword('dranand@123');
      this.data.users.push({
        id: 'doc-1',
        username: 'Dr_AnandGR',
        role: 'doctor',
        fullName: 'Dr. Anand G R (PT)',
        email: 'anand@functionalrehablab.com',
        phone: '+91 80885 96486',
        gender: 'Male',
        age: 38,
        specialty: 'Lead Physiotherapist & Sports Rehab Specialist',
        medicalHistory: '',
        emergencyContact: '+91 80885 96486',
        createdAt: new Date().toISOString(),
        passwordHash: hashed.hash,
        salt: hashed.salt
      });
      changed = true;
    }

    // Check Cloudfare
    const cloudfare = this.data.users.find(u => u.username.toLowerCase() === 'cloudfare');
    if (!cloudfare) {
      const hashed = hashPassword('cloudfare@123');
      this.data.users.push({
        id: 'admin-1',
        username: 'Cloudfare',
        role: 'admin',
        fullName: 'Cloudfare',
        email: 'admin@functionalrehablab.com',
        phone: '+91 80885 96486',
        gender: 'Male',
        age: 40,
        specialty: 'Clinical Operations & Database Administrator {Not a Doctor}',
        medicalHistory: '',
        emergencyContact: '+91 80885 96486',
        createdAt: new Date().toISOString(),
        passwordHash: hashed.hash,
        salt: hashed.salt
      });
      changed = true;
    }

    if (!this.data.patientAnalyses || this.data.patientAnalyses.length === 0) {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      this.data.patientAnalyses = initialPatientAnalyses(today, now);
      changed = true;
    }

    if (changed) {
      this.save();
    }
  }

  private save() {
    try {
      const tempPath = `${DB_FILE}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tempPath, DB_FILE);
    } catch (err) {
      console.error('Failed to save db.json:', err);
    }
  }

  // --- Users & Sessions ---
  findUserByUsername(username: string) {
    return this.data.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  }

  findUserById(id: string): User | undefined {
    const u = this.data.users.find(user => user.id === id);
    if (!u) return undefined;
    const { passwordHash, salt, ...safeUser } = u;
    return safeUser;
  }

  createUser(user: Omit<DatabaseSchema['users'][0], 'id' | 'createdAt'>): User {
    const id = `pat-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const newUser = {
      ...user,
      id,
      createdAt: new Date().toISOString()
    };
    this.data.users.push(newUser);
    this.save();
    const { passwordHash, salt, ...safe } = newUser;
    return safe;
  }

  updateUserProfile(id: string, updates: Partial<Pick<User, 'fullName' | 'phone' | 'email' | 'gender' | 'age' | 'medicalHistory' | 'emergencyContact'>>): User | null {
    const user = this.data.users.find(u => u.id === id);
    if (!user) return null;
    Object.assign(user, updates);
    this.save();
    const { passwordHash, salt, ...safe } = user;
    return safe;
  }

  getAllPatients(): User[] {
    return this.data.users
      .filter(u => u.role === 'patient')
      .map(({ passwordHash, salt, ...safe }) => safe);
  }

  createSession(userId: string): string {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days
    this.data.sessions.push({ token, userId, expiresAt });
    this.save();
    return token;
  }

  validateSession(token: string): User | null {
    const session = this.data.sessions.find(s => s.token === token && s.expiresAt > Date.now());
    if (!session) return null;
    return this.findUserById(session.userId) || null;
  }

  deleteSession(token: string) {
    this.data.sessions = this.data.sessions.filter(s => s.token !== token);
    this.save();
  }

  // --- Appointments ---
  getAppointments(userId: string, role: string): Appointment[] {
    if (role === 'admin' || role === 'doctor') {
      return [...this.data.appointments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    return this.data.appointments
      .filter(apt => apt.patientId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  createAppointment(aptData: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt' | 'invoiceId'>): { appointment: Appointment; invoice: Invoice } {
    const id = `apt-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`;
    const invoiceId = `inv-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`;
    const invoiceNumber = `FRL-INV-${new Date().getFullYear()}-${String(this.data.invoices.length + 101).padStart(4, '0')}`;
    
    const nowIso = new Date().toISOString();

    const appointment: Appointment = {
      ...aptData,
      id,
      invoiceId,
      createdAt: nowIso,
      updatedAt: nowIso
    };

    const invoice: Invoice = {
      id: invoiceId,
      invoiceNumber,
      appointmentId: id,
      patientId: aptData.patientId,
      patientName: aptData.patientName,
      patientPhone: aptData.patientPhone,
      doctorName: aptData.doctorName,
      date: aptData.date,
      items: [
        {
          description: aptData.service,
          code: `REHAB-${aptData.service.slice(0, 3).toUpperCase()}`,
          amount: aptData.fee,
          qty: 1
        }
      ],
      subtotal: aptData.fee,
      tax: 0,
      discount: 0,
      total: aptData.fee,
      paymentStatus: 'Paid',
      paymentMethod: 'UPI / Card',
      clinicInfo: {
        name: 'FUNCTIONAL REHAB LAB',
        tagline: 'Advanced Orthopedic & Sports Kinetic Rehabilitation Center',
        address: '#14, 2nd Floor, 100ft Road, Indiranagar, Bengaluru, Karnataka 560038',
        phone: '+91 80885 96486',
        email: 'care@functionalrehablab.com',
        gstin: '29AABCF9241K1ZP'
      },
      createdAt: nowIso
    };

    this.data.appointments.push(appointment);
    this.data.invoices.push(invoice);

    // Auto-create confirmation notification for patient
    this.createNotification({
      recipientId: aptData.patientId,
      senderId: aptData.doctorId,
      senderName: aptData.doctorName,
      title: 'Appointment & Invoice Generated',
      message: `Your booking for ${aptData.service} on ${aptData.date} at ${aptData.timeSlot} has been confirmed. Invoice #${invoiceNumber} issued.`,
      type: 'appointment',
      readBy: [],
      link: `/invoices/${invoiceId}`
    });

    this.save();
    return { appointment, invoice };
  }

  updateAppointmentStatus(id: string, status: Appointment['status'], updatedBy: User): Appointment | null {
    const apt = this.data.appointments.find(a => a.id === id);
    if (!apt) return null;

    apt.status = status;
    apt.updatedAt = new Date().toISOString();

    // Notify patient
    this.createNotification({
      recipientId: apt.patientId,
      senderId: updatedBy.id,
      senderName: updatedBy.fullName,
      title: `Appointment Status: ${status}`,
      message: `Your appointment for ${apt.service} scheduled on ${apt.date} at ${apt.timeSlot} is now marked as ${status}.`,
      type: 'appointment',
      readBy: [],
      link: `/appointments`
    });

    this.save();
    return apt;
  }

  deleteAppointment(id: string): boolean {
    const initialLen = this.data.appointments.length;
    this.data.appointments = this.data.appointments.filter(a => a.id !== id);
    if (this.data.appointments.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  // --- Invoices ---
  getInvoices(userId: string, role: string): Invoice[] {
    if (role === 'admin' || role === 'doctor') {
      return [...this.data.invoices].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return this.data.invoices
      .filter(inv => inv.patientId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getInvoiceById(id: string): Invoice | undefined {
    return this.data.invoices.find(inv => inv.id === id || inv.invoiceNumber === id);
  }

  // --- Prescriptions ---
  getPrescriptions(userId: string, role: string): Prescription[] {
    if (role === 'admin' || role === 'doctor') {
      return [...this.data.prescriptions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return this.data.prescriptions
      .filter(rx => rx.patientId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  createPrescription(rxData: Omit<Prescription, 'id' | 'createdAt'>): Prescription {
    const id = `rx-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`;
    const rx: Prescription = {
      ...rxData,
      id,
      createdAt: new Date().toISOString()
    };
    this.data.prescriptions.push(rx);

    // Securely trigger patient notification
    this.createNotification({
      recipientId: rxData.patientId,
      senderId: rxData.doctorId,
      senderName: rxData.doctorName,
      title: 'New Clinical Prescription Issued',
      message: `${rxData.doctorName} submitted your rehabilitation exercise prescription for ${rxData.diagnosis}. Access it now in your prescriptions tab.`,
      type: 'prescription',
      readBy: [],
      link: `/prescriptions`
    });

    this.save();
    return rx;
  }

  // --- Notifications ---
  getNotifications(userId: string): AppNotification[] {
    return this.data.notifications
      .filter(n => n.recipientId === userId || n.recipientId === 'ALL')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  createNotification(notifData: Omit<AppNotification, 'id' | 'createdAt'>): AppNotification {
    const id = `notif-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`;
    const notification: AppNotification = {
      ...notifData,
      id,
      createdAt: new Date().toISOString()
    };
    this.data.notifications.push(notification);
    this.save();
    return notification;
  }

  markNotificationRead(notificationId: string, userId: string): boolean {
    const notif = this.data.notifications.find(n => n.id === notificationId);
    if (!notif) return false;
    if (!notif.readBy.includes(userId)) {
      notif.readBy.push(userId);
      this.save();
    }
    return true;
  }

  // --- Services ---
  getServices(): ServiceItem[] {
    return this.data.services;
  }

  // --- Patient Analysis & Biomechanical Assessments ---
  getPatientAnalyses(userId?: string, role?: string): PatientAnalysis[] {
    if (!this.data.patientAnalyses) {
      this.data.patientAnalyses = [];
    }
    if (role === 'admin' || role === 'doctor') {
      if (userId && userId.startsWith('pat-')) {
        return this.data.patientAnalyses
          .filter(a => a.patientId === userId)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      }
      return [...this.data.patientAnalyses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    // Patient role
    return this.data.patientAnalyses
      .filter(a => a.patientId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  getPatientAnalysisById(id: string): PatientAnalysis | undefined {
    return this.data.patientAnalyses?.find(a => a.id === id);
  }

  savePatientAnalysis(
    data: Partial<PatientAnalysis> & { patientId: string; patientName: string; primaryDiagnosis: string },
    doctor: User
  ): PatientAnalysis {
    if (!this.data.patientAnalyses) {
      this.data.patientAnalyses = [];
    }

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const existingIndex = data.id ? this.data.patientAnalyses.findIndex(a => a.id === data.id) : -1;

    let analysis: PatientAnalysis;

    if (existingIndex >= 0) {
      const existing = this.data.patientAnalyses[existingIndex];
      analysis = {
        ...existing,
        ...data,
        updatedAt: now.toISOString()
      };
      this.data.patientAnalyses[existingIndex] = analysis;
    } else {
      const id = `anl-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`;
      analysis = {
        id,
        patientId: data.patientId,
        patientName: data.patientName,
        patientAge: data.patientAge || 30,
        patientGender: data.patientGender || 'Unspecified',
        doctorId: doctor.id,
        doctorName: doctor.fullName,
        date: data.date || today,
        primaryDiagnosis: data.primaryDiagnosis,
        vasPainScore: typeof data.vasPainScore === 'number' ? data.vasPainScore : 3,
        functionalIndex: typeof data.functionalIndex === 'number' ? data.functionalIndex : 75,
        rehabPhase: data.rehabPhase || 'Phase 2: Mobility & Motor Control',
        clearanceStatus: data.clearanceStatus || 'Modified Training',
        readinessToReturnPercent: typeof data.readinessToReturnPercent === 'number' ? data.readinessToReturnPercent : 75,
        romMetrics: data.romMetrics || [],
        strengthMetrics: data.strengthMetrics || [],
        fmsScores: data.fmsScores || [],
        fmsTotal: typeof data.fmsTotal === 'number' ? data.fmsTotal : (data.fmsScores ? data.fmsScores.reduce((acc, curr) => acc + curr.score, 0) : 15),
        biomechanicalFindings: data.biomechanicalFindings || '',
        clinicalRecommendations: data.clinicalRecommendations || [],
        historyTimeline: data.historyTimeline && data.historyTimeline.length > 0 ? data.historyTimeline : [
          { date: today, painScore: data.vasPainScore ?? 3, functionalIndex: data.functionalIndex ?? 75, romScore: 85, strengthSymmetry: 80 }
        ],
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      };
      this.data.patientAnalyses.push(analysis);
    }

    // Trigger notification to patient
    this.createNotification({
      recipientId: data.patientId,
      senderId: doctor.id,
      senderName: doctor.fullName,
      title: 'Biomechanical Analysis Report Updated',
      message: `${doctor.fullName} has recorded your clinical kinetic & recovery analysis for ${data.primaryDiagnosis}. Access your real-time recovery metrics.`,
      type: 'clinical_alert',
      readBy: [],
      link: '/analysis'
    });

    this.save();
    return analysis;
  }

  deletePatientAnalysis(id: string): boolean {
    if (!this.data.patientAnalyses) return false;
    const initialLen = this.data.patientAnalyses.length;
    this.data.patientAnalyses = this.data.patientAnalyses.filter(a => a.id !== id);
    if (this.data.patientAnalyses.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  // --- Admin Exporters for Cloudfare ---
  getFullDatabaseDump() {
    const totalPatients = this.data.users.filter(u => u.role === 'patient').length;
    return {
      metadata: {
        appName: 'FUNCTIONAL REHAB LAB',
        version: '3.0.0',
        systemStatus: 'ONLINE_STABLE',
        exportTimestamp: new Date().toISOString(),
        exportedBy: 'Cloudfare',
        adminDesignation: 'System Administrator {Not a Doctor}',
        clinicInfo: {
          name: 'FUNCTIONAL REHAB LAB',
          tagline: 'Advanced Orthopedic & Sports Kinetic Rehabilitation Center',
          address: '#14, 2nd Floor, 100ft Road, Indiranagar, Bengaluru, Karnataka 560038',
          phone: '+91 80885 96486',
          email: 'care@functionalrehablab.com',
          gstin: '29AABCF9241K1ZP'
        },
        counts: {
          totalUsers: this.data.users.length,
          totalPatients,
          totalAppointments: this.data.appointments.length,
          totalInvoices: this.data.invoices.length,
          totalPrescriptions: this.data.prescriptions.length,
          totalBiomechanicalAnalyses: this.data.patientAnalyses?.length || 0,
          totalServices: this.data.services.length
        }
      },
      users: this.data.users.map(({ passwordHash, salt, ...u }) => u),
      appointments: this.data.appointments,
      invoices: this.data.invoices,
      prescriptions: this.data.prescriptions,
      patientAnalyses: this.data.patientAnalyses || [],
      services: this.data.services,
      notifications: this.data.notifications
    };
  }

  getCompletePatientDossiers() {
    const patients = this.getAllPatients();
    return patients.map(patient => {
      const appointments = this.data.appointments.filter(a => a.patientId === patient.id);
      const invoices = this.data.invoices.filter(i => i.patientId === patient.id);
      const prescriptions = this.data.prescriptions.filter(p => p.patientId === patient.id);
      const analyses = (this.data.patientAnalyses || []).filter(a => a.patientId === patient.id);

      const totalBilled = invoices.reduce((sum, inv) => sum + inv.total, 0);
      const totalPaid = invoices.filter(i => i.paymentStatus === 'Paid').reduce((sum, inv) => sum + inv.total, 0);
      const latestAnalysis = analyses[0];

      return {
        patientId: patient.id,
        fullName: patient.fullName,
        username: patient.username,
        phone: patient.phone,
        email: patient.email,
        gender: patient.gender,
        age: patient.age,
        registeredAt: patient.createdAt,
        medicalHistory: patient.medicalHistory || 'None reported',
        emergencyContact: patient.emergencyContact || 'None provided',
        metricsSummary: {
          totalConsultations: appointments.length,
          completedConsultations: appointments.filter(a => a.status === 'Completed').length,
          cancelledConsultations: appointments.filter(a => a.status === 'Cancelled').length,
          totalBilledAmount: totalBilled,
          totalPaidAmount: totalPaid,
          outstandingBalance: totalBilled - totalPaid,
          prescriptionsCount: prescriptions.length,
          biomechanicalAnalysesCount: analyses.length,
          latestVASPainScore: latestAnalysis?.vasPainScore ?? null,
          latestFunctionalIndex: latestAnalysis?.functionalIndex ?? null,
          rehabPhase: latestAnalysis?.rehabPhase ?? 'Not Assessed',
          clearanceStatus: latestAnalysis?.clearanceStatus ?? 'Pending Clinical Evaluation'
        },
        appointments,
        invoices,
        prescriptions,
        biomechanicalAnalyses: analyses
      };
    });
  }
}

export const db = new Database();
