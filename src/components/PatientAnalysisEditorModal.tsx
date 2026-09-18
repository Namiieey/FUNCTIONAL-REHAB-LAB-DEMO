import React, { useState } from 'react';
import { PatientAnalysis, User, RomMetric, StrengthMetric, FmsScoreItem } from '../types.js';
import { api } from '../services/api.js';
import {
  X,
  Save,
  Plus,
  Trash2,
  Activity,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface PatientAnalysisEditorModalProps {
  initialAnalysis?: PatientAnalysis | null;
  patients: User[];
  presetPatientId?: string;
  onClose: () => void;
  onSaved: (analysis: PatientAnalysis) => void;
}

const DEFAULT_FMS_ITEMS: FmsScoreItem[] = [
  { name: 'Deep Squat', score: 2, notes: '' },
  { name: 'Hurdle Step', score: 2, notes: '' },
  { name: 'In-line Lunge', score: 2, notes: '' },
  { name: 'Shoulder Mobility', score: 3, notes: '' },
  { name: 'Active Straight-Leg Raise', score: 3, notes: '' },
  { name: 'Trunk Stability Push-up', score: 2, notes: '' },
  { name: 'Rotary Stability', score: 2, notes: '' },
];

export const PatientAnalysisEditorModal: React.FC<PatientAnalysisEditorModalProps> = ({
  initialAnalysis,
  patients,
  presetPatientId,
  onClose,
  onSaved
}) => {
  const [patientId, setPatientId] = useState<string>(
    initialAnalysis?.patientId || presetPatientId || (patients[0]?.id || '')
  );
  const [date, setDate] = useState<string>(
    initialAnalysis?.date || new Date().toISOString().split('T')[0]
  );
  const [primaryDiagnosis, setPrimaryDiagnosis] = useState<string>(
    initialAnalysis?.primaryDiagnosis || ''
  );
  const [rehabPhase, setRehabPhase] = useState<PatientAnalysis['rehabPhase']>(
    initialAnalysis?.rehabPhase || 'Phase 2: Mobility & Motor Control'
  );
  const [clearanceStatus, setClearanceStatus] = useState<PatientAnalysis['clearanceStatus']>(
    initialAnalysis?.clearanceStatus || 'Modified Training'
  );
  const [vasPainScore, setVasPainScore] = useState<number>(
    initialAnalysis?.vasPainScore ?? 3
  );
  const [functionalIndex, setFunctionalIndex] = useState<number>(
    initialAnalysis?.functionalIndex ?? 75
  );
  const [readinessToReturnPercent, setReadinessToReturnPercent] = useState<number>(
    initialAnalysis?.readinessToReturnPercent ?? 75
  );

  // ROM Metrics
  const [romMetrics, setRomMetrics] = useState<RomMetric[]>(
    initialAnalysis?.romMetrics || [
      { joint: 'Knee Flexion', movement: 'Active Range', currentDeg: 120, targetDeg: 140, unit: '°', status: 'Progressing' },
      { joint: 'Knee Extension', movement: 'Terminal Ext', currentDeg: 0, targetDeg: 0, unit: '°', status: 'Optimal' }
    ]
  );

  // Strength Metrics
  const [strengthMetrics, setStrengthMetrics] = useState<StrengthMetric[]>(
    initialAnalysis?.strengthMetrics || [
      { muscleGroup: 'Quadriceps Peak Torque', leftSide: 180, rightSide: 155, unit: 'Nm', asymmetryPercent: 13.8 },
      { muscleGroup: 'Hamstrings Peak Torque', leftSide: 110, rightSide: 105, unit: 'Nm', asymmetryPercent: 4.5 }
    ]
  );

  // FMS
  const [fmsScores, setFmsScores] = useState<FmsScoreItem[]>(
    initialAnalysis?.fmsScores?.length ? initialAnalysis.fmsScores : DEFAULT_FMS_ITEMS
  );

  const [biomechanicalFindings, setBiomechanicalFindings] = useState<string>(
    initialAnalysis?.biomechanicalFindings || ''
  );
  const [clinicalRecommendations, setClinicalRecommendations] = useState<string[]>(
    initialAnalysis?.clinicalRecommendations || [
      'Progress closed kinetic chain exercises with resistance',
      'Maintain neuromuscular motor control drills'
    ]
  );
  const [newRec, setNewRec] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Compute live FMS total
  const fmsTotal = fmsScores.reduce((acc, curr) => acc + (curr.score || 0), 0);

  // Handle ROM changes
  const updateRom = (index: number, field: keyof RomMetric, val: any) => {
    const updated = [...romMetrics];
    updated[index] = { ...updated[index], [field]: val };
    setRomMetrics(updated);
  };

  const addRom = () => {
    setRomMetrics([
      ...romMetrics,
      { joint: 'Ankle Dorsiflexion', movement: 'Weight Bearing Lunge', currentDeg: 35, targetDeg: 45, unit: '°', status: 'Progressing' }
    ]);
  };

  const removeRom = (index: number) => {
    setRomMetrics(romMetrics.filter((_, i) => i !== index));
  };

  // Handle Strength changes
  const updateStrength = (index: number, field: keyof StrengthMetric, val: any) => {
    const updated = [...strengthMetrics];
    const item = { ...updated[index], [field]: val };
    if (field === 'leftSide' || field === 'rightSide') {
      const left = field === 'leftSide' ? Number(val) : item.leftSide;
      const right = field === 'rightSide' ? Number(val) : item.rightSide;
      const maxVal = Math.max(left, right);
      if (maxVal > 0) {
        item.asymmetryPercent = Number((Math.abs(left - right) / maxVal * 100).toFixed(1));
      }
    }
    updated[index] = item;
    setStrengthMetrics(updated);
  };

  const addStrength = () => {
    setStrengthMetrics([
      ...strengthMetrics,
      { muscleGroup: 'Hip Abductor Dynamometry', leftSide: 25, rightSide: 22, unit: 'kg', asymmetryPercent: 12.0 }
    ]);
  };

  const removeStrength = (index: number) => {
    setStrengthMetrics(strengthMetrics.filter((_, i) => i !== index));
  };

  // Handle FMS change
  const updateFms = (index: number, score: number) => {
    const updated = [...fmsScores];
    updated[index] = { ...updated[index], score };
    setFmsScores(updated);
  };

  // Handle Recommendations
  const addRecommendation = () => {
    if (!newRec.trim()) return;
    setClinicalRecommendations([...clinicalRecommendations, newRec.trim()]);
    setNewRec('');
  };

  const removeRecommendation = (index: number) => {
    setClinicalRecommendations(clinicalRecommendations.filter((_, i) => i !== index));
  };

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId) {
      setError('Please select a patient');
      return;
    }
    if (!primaryDiagnosis.trim()) {
      setError('Primary diagnosis is required');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const payload = {
        id: initialAnalysis?.id,
        patientId,
        date,
        primaryDiagnosis: primaryDiagnosis.trim(),
        rehabPhase,
        clearanceStatus,
        vasPainScore,
        functionalIndex,
        readinessToReturnPercent,
        romMetrics,
        strengthMetrics,
        fmsScores,
        fmsTotal,
        biomechanicalFindings,
        clinicalRecommendations
      };

      const saved = await api.saveAnalysis(payload);
      onSaved(saved);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save analysis');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-4xl bg-white border border-gray-200 rounded-3xl p-5 sm:p-7 shadow-2xl my-auto max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-black text-gray-900 font-display">
              {initialAnalysis ? 'Edit Biomechanical Analysis' : 'New Biomechanical Patient Assessment'}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Record clinical range of motion, muscle torque asymmetry, and functional movement metrics.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900 border border-gray-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-6">
          {/* Patient and Core Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">
                Select Patient *
              </label>
              <select
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                disabled={!!initialAnalysis}
                className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:border-[#FF5500] focus:outline-none"
              >
                {patients.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.fullName} ({p.phone})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">
                Assessment Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-xs text-gray-900 focus:border-[#FF5500] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">
                Rehab Protocol Phase
              </label>
              <select
                value={rehabPhase}
                onChange={(e) => setRehabPhase(e.target.value as PatientAnalysis['rehabPhase'])}
                className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-xs text-gray-900 focus:border-[#FF5500] focus:outline-none"
              >
                <option value="Phase 1: Acute Protection">Phase 1: Acute Protection</option>
                <option value="Phase 2: Mobility & Motor Control">Phase 2: Mobility & Motor Control</option>
                <option value="Phase 3: Hypertrophy & Kinetic Chain">Phase 3: Hypertrophy & Kinetic Chain</option>
                <option value="Phase 4: Return-to-Sport & Explosive Plyometrics">Phase 4: Return-to-Sport & Explosive Plyometrics</option>
              </select>
            </div>
          </div>

          {/* Primary Diagnosis & Clearance */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">
                Primary Clinical Diagnosis *
              </label>
              <input
                type="text"
                value={primaryDiagnosis}
                onChange={(e) => setPrimaryDiagnosis(e.target.value)}
                placeholder="e.g. ACL Reconstruction (Month 4) with Patellar Autograft"
                required
                className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:border-[#FF5500] focus:outline-none placeholder-gray-400"
              />
            </div>

            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">
                Clearance Status
              </label>
              <select
                value={clearanceStatus}
                onChange={(e) => setClearanceStatus(e.target.value as PatientAnalysis['clearanceStatus'])}
                className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-xs text-gray-900 focus:border-[#FF5500] focus:outline-none"
              >
                <option value="Restricted">Restricted</option>
                <option value="Modified Training">Modified Training</option>
                <option value="Full Athletic Clearance">Full Athletic Clearance</option>
              </select>
            </div>
          </div>

          {/* Sliders: VAS Pain, Functional Index, Readiness */}
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-gray-700">VAS Pain Level</span>
                <span className="text-xs font-black font-mono text-red-600">{vasPainScore} / 10</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={vasPainScore}
                onChange={(e) => setVasPainScore(Number(e.target.value))}
                className="w-full accent-[#FF5500] cursor-pointer"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-gray-700">Functional Index</span>
                <span className="text-xs font-black font-mono text-[#FF5500]">{functionalIndex}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={functionalIndex}
                onChange={(e) => setFunctionalIndex(Number(e.target.value))}
                className="w-full accent-[#FF5500] cursor-pointer"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-gray-700">Return-to-Sport Readiness</span>
                <span className="text-xs font-black font-mono text-emerald-600">{readinessToReturnPercent}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={readinessToReturnPercent}
                onChange={(e) => setReadinessToReturnPercent(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
            </div>
          </div>

          {/* Section: Range of Motion (ROM) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-[#FF5500]" />
                Range of Motion Goniometry ({romMetrics.length})
              </h3>
              <button
                type="button"
                onClick={addRom}
                className="flex items-center gap-1 text-xs font-extrabold text-[#FF5500] hover:text-[#e04b00] cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Joint Movement
              </button>
            </div>

            <div className="space-y-2">
              {romMetrics.map((rom, i) => (
                <div key={i} className="p-3 rounded-xl bg-gray-50 border border-gray-200 grid grid-cols-2 sm:grid-cols-6 gap-2 items-center">
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      placeholder="Joint (e.g. Knee Flexion)"
                      value={rom.joint}
                      onChange={(e) => updateRom(i, 'joint', e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Movement type"
                      value={rom.movement}
                      onChange={(e) => updateRom(i, 'movement', e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      placeholder="Current °"
                      value={rom.currentDeg}
                      onChange={(e) => updateRom(i, 'currentDeg', Number(e.target.value))}
                      className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      placeholder="Target °"
                      value={rom.targetDeg}
                      onChange={(e) => updateRom(i, 'targetDeg', Number(e.target.value))}
                      className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none font-mono"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={rom.status || 'Progressing'}
                      onChange={(e) => updateRom(i, 'status', e.target.value)}
                      className="bg-white border border-gray-300 rounded-lg px-2 py-1.5 text-[11px] text-gray-900 focus:outline-none flex-1"
                    >
                      <option value="Optimal">Optimal</option>
                      <option value="Progressing">Progressing</option>
                      <option value="Impaired">Impaired</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => removeRom(i)}
                      className="text-gray-400 hover:text-red-500 p-1 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Strength & Asymmetry */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                Bilateral Muscle Torque & Asymmetry ({strengthMetrics.length})
              </h3>
              <button
                type="button"
                onClick={addStrength}
                className="flex items-center gap-1 text-xs font-extrabold text-[#FF5500] hover:text-[#e04b00] cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Muscle Group
              </button>
            </div>

            <div className="space-y-2">
              {strengthMetrics.map((str, i) => (
                <div key={i} className="p-3 rounded-xl bg-gray-50 border border-gray-200 grid grid-cols-2 sm:grid-cols-6 gap-2 items-center">
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      placeholder="Muscle Group"
                      value={str.muscleGroup}
                      onChange={(e) => updateStrength(i, 'muscleGroup', e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      placeholder="Left Side"
                      value={str.leftSide}
                      onChange={(e) => updateStrength(i, 'leftSide', Number(e.target.value))}
                      className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      placeholder="Right Side"
                      value={str.rightSide}
                      onChange={(e) => updateStrength(i, 'rightSide', Number(e.target.value))}
                      className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Unit (Nm/kg)"
                      value={str.unit}
                      onChange={(e) => updateStrength(i, 'unit', e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[11px] font-mono font-bold text-amber-700">
                      {str.asymmetryPercent}% Asym
                    </span>
                    <button
                      type="button"
                      onClick={() => removeStrength(i)}
                      className="text-gray-400 hover:text-red-500 p-1 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section: FMS Movement Scoring */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-1.5">
                Functional Movement Screen (FMS Total: <span className="text-emerald-700 font-mono">{fmsTotal} / 21</span>)
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {fmsScores.map((item, i) => (
                <div key={i} className="p-2.5 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between">
                  <span className="text-xs text-gray-800 font-bold truncate max-w-[150px]">{item.name}</span>
                  <div className="flex items-center gap-1">
                    {[0, 1, 2, 3].map(score => (
                      <button
                        key={score}
                        type="button"
                        onClick={() => updateFms(i, score)}
                        className={`w-6 h-6 rounded-lg text-xs font-bold font-mono transition cursor-pointer ${
                          item.score === score
                            ? 'bg-[#FF5500] text-white shadow-xs'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {score}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Biomechanical Observations */}
          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">
              Biomechanical Findings & Kinetic Observations
            </label>
            <textarea
              rows={3}
              value={biomechanicalFindings}
              onChange={(e) => setBiomechanicalFindings(e.target.value)}
              placeholder="e.g. Dynamic knee valgus eliminated on single-leg squat. Quadriceps symmetry improved to 86%."
              className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:border-[#FF5500] focus:outline-none placeholder-gray-400 leading-relaxed"
            />
          </div>

          {/* Clinical Action Plan Recommendations */}
          <div className="space-y-2">
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-700">
              Clinical Recommendations ({clinicalRecommendations.length})
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newRec}
                onChange={(e) => setNewRec(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addRecommendation();
                  }
                }}
                placeholder="Type recommendation and press Enter..."
                className="flex-1 bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-xs text-gray-900 focus:border-[#FF5500] focus:outline-none placeholder-gray-400"
              />
              <button
                type="button"
                onClick={addRecommendation}
                className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-900 text-xs font-bold border border-gray-300 transition cursor-pointer"
              >
                Add
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {clinicalRecommendations.map((rec, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gray-100 border border-gray-200 text-xs text-gray-800"
                >
                  <span>{rec}</span>
                  <button
                    type="button"
                    onClick={() => removeRecommendation(i)}
                    className="text-gray-400 hover:text-red-500 ml-1 cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold border border-gray-300 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF5500] hover:bg-[#e04b00] text-white text-xs font-extrabold shadow-sm transition cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : 'Save Assessment'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
