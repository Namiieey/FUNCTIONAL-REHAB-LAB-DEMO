import React, { useState } from 'react';
import { PatientAnalysis, User } from '../types.js';
import { triggerPrint } from '../utils/exportUtils.js';
import {
  Activity,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  FileDown,
  Share2,
  Calendar,
  User as UserIcon,
  CheckCircle2,
  ChevronRight,
  Printer,
  Compass,
  Zap,
  Layers,
  ArrowUpRight,
  Edit3
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

interface PatientAnalysisViewProps {
  analysis: PatientAnalysis;
  currentUser: User;
  onEdit?: (analysis: PatientAnalysis) => void;
  onClose?: () => void;
  isModal?: boolean;
}

export const PatientAnalysisView: React.FC<PatientAnalysisViewProps> = ({
  analysis,
  currentUser,
  onEdit,
  onClose,
  isModal = false,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'rom' | 'strength' | 'fms'>('overview');

  const isDoctorOrAdmin = currentUser.role === 'doctor' || currentUser.role === 'admin';

  // Format date
  const formattedDate = new Date(analysis.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  // Color mapping for rehab phases
  const phaseColors: Record<string, string> = {
    'Phase 1: Acute Protection': 'border-blue-200 text-blue-700 bg-blue-50',
    'Phase 2: Mobility & Motor Control': 'border-amber-200 text-amber-700 bg-amber-50',
    'Phase 3: Hypertrophy & Kinetic Chain': 'border-orange-200 text-[#FF5500] bg-orange-50',
    'Phase 4: Return-to-Sport & Explosive Plyometrics': 'border-emerald-200 text-emerald-700 bg-emerald-50'
  };

  const clearanceColors: Record<string, string> = {
    'Restricted': 'border-red-200 text-red-700 bg-red-50',
    'Modified Training': 'border-amber-200 text-amber-700 bg-amber-50',
    'Full Athletic Clearance': 'border-emerald-200 text-emerald-700 bg-emerald-50'
  };

  // Prepare ROM chart data
  const romChartData = analysis.romMetrics.map(r => ({
    joint: r.joint.length > 18 ? r.joint.substring(0, 16) + '...' : r.joint,
    Current: r.currentDeg,
    Target: r.targetDeg,
    fullName: r.joint
  }));

  // Prepare Strength / Asymmetry chart data
  const strengthChartData = analysis.strengthMetrics.map(s => ({
    name: s.muscleGroup.length > 16 ? s.muscleGroup.substring(0, 14) + '...' : s.muscleGroup,
    Left: s.leftSide,
    Right: s.rightSide,
    unit: s.unit,
    asymmetry: s.asymmetryPercent
  }));

  // Prepare FMS Radar data
  const fmsRadarData = analysis.fmsScores.map(f => ({
    subject: f.name.replace(' Stability', ' Stab.').replace('Shoulder ', 'Shldr '),
    Score: f.score,
    fullMark: 3
  }));

  // WhatsApp share
  const handleWhatsAppShare = () => {
    const text = [
      `*FUNCTIONAL REHAB LAB* | Biomechanical Recovery Analysis`,
      `----------------------------------------`,
      `*Patient:* ${analysis.patientName}`,
      `*Clinical Diagnosis:* ${analysis.primaryDiagnosis}`,
      `*Rehab Stage:* ${analysis.rehabPhase}`,
      `*VAS Pain Level:* ${analysis.vasPainScore}/10`,
      `*Functional Recovery Index:* ${analysis.functionalIndex}%`,
      `*Return-to-Sport Readiness:* ${analysis.readinessToReturnPercent}%`,
      `*Clearance Status:* ${analysis.clearanceStatus}`,
      `*FMS Movement Score:* ${analysis.fmsTotal}/21`,
      `*Assessing Specialist:* ${analysis.doctorName}`,
      `----------------------------------------`,
      `Functional Rehab Lab - Bangalore | +91 80885 96486`
    ].join('\n');

    window.open(`https://wa.me/918088596486?text=${encodeURIComponent(text)}`, '_blank');
  };

  const content = (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="p-6 rounded-3xl bg-white border border-gray-200 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-80 h-full bg-[#FF5500]/5 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${phaseColors[analysis.rehabPhase] || 'border-gray-200 text-gray-700 bg-gray-50'}`}>
                {analysis.rehabPhase}
              </span>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${clearanceColors[analysis.clearanceStatus] || 'border-gray-200 text-gray-700 bg-gray-50'}`}>
                {analysis.clearanceStatus}
              </span>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700 border border-gray-200">
                Date: {formattedDate}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight font-display">
              {analysis.patientName} &bull; <span className="text-[#FF5500]">Biomechanical Analysis</span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1 max-w-2xl font-medium">
              <span className="text-gray-400 font-bold uppercase text-[10px] tracking-wider mr-1.5">Diagnosis:</span>
              {analysis.primaryDiagnosis}
            </p>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Assessed by <span className="text-gray-800 font-bold">{analysis.doctorName}</span> &bull; {analysis.patientGender || 'Adult'}, {analysis.patientAge || 30} yrs
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center flex-wrap">
            {isDoctorOrAdmin && onEdit && (
              <button
                onClick={() => onEdit(analysis)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 text-xs font-bold transition cursor-pointer"
                title="Edit Analysis"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#FF5500]" />
                <span>Edit Assessment</span>
              </button>
            )}

            <button
              onClick={handleWhatsAppShare}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition cursor-pointer"
              title="Share via WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp Desk</span>
            </button>

            <button
              onClick={() => triggerPrint()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-200 text-xs font-bold transition cursor-pointer"
              title="Print Clinical Summary"
            >
              <Printer className="w-3.5 h-3.5 text-gray-700" />
              <span>Print Report</span>
            </button>

            {onClose && isModal && (
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900 border border-gray-200 text-xs font-bold transition cursor-pointer ml-1"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Primary KPI Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Pain VAS */}
        <div className="p-4 rounded-2xl bg-white border border-gray-200 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500">VAS Pain Scale</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${analysis.vasPainScore <= 3 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
              {analysis.vasPainScore <= 2 ? 'Minimal' : analysis.vasPainScore <= 5 ? 'Moderate' : 'Elevated'}
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-gray-900 font-mono">{analysis.vasPainScore}</span>
            <span className="text-xs text-gray-400 font-bold">/ 10</span>
          </div>
          <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2.5 overflow-hidden">
            <div
              className={`h-full rounded-full ${analysis.vasPainScore <= 3 ? 'bg-emerald-500' : analysis.vasPainScore <= 6 ? 'bg-amber-500' : 'bg-red-500'}`}
              style={{ width: `${(analysis.vasPainScore / 10) * 100}%` }}
            />
          </div>
          <p className="text-[10px] text-gray-500 mt-2">Visual Analogue Pain Index</p>
        </div>

        {/* Functional Index */}
        <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500">Functional Recovery</span>
            <TrendingUp className="w-3.5 h-3.5 text-[#FF5500]" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-[#FF5500] font-mono">{analysis.functionalIndex}%</span>
          </div>
          <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2.5 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#FF5500]"
              style={{ width: `${analysis.functionalIndex}%` }}
            />
          </div>
          <p className="text-[10px] text-gray-500 mt-2">Kinetic recovery trajectory</p>
        </div>

        {/* Return to Sport / Readiness */}
        <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500">RTS Readiness</span>
            <Zap className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-gray-900 font-mono">{analysis.readinessToReturnPercent}%</span>
          </div>
          <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2.5 overflow-hidden">
            <div
              className="h-full rounded-full bg-amber-500"
              style={{ width: `${analysis.readinessToReturnPercent}%` }}
            />
          </div>
          <p className="text-[10px] text-gray-500 mt-2">Target &gt; 90% for contact sport</p>
        </div>

        {/* FMS Score */}
        <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500">FMS Movement Total</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-emerald-600 font-mono">{analysis.fmsTotal}</span>
            <span className="text-xs text-gray-400 font-bold">/ 21</span>
          </div>
          <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2.5 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500"
              style={{ width: `${(analysis.fmsTotal / 21) * 100}%` }}
            />
          </div>
          <p className="text-[10px] text-gray-500 mt-2">{analysis.fmsTotal >= 14 ? 'Low Injury Risk Profile' : 'Sub-optimal Movement Symmetry'}</p>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-3 overflow-x-auto">
        {[
          { id: 'overview', label: 'Progress Timeline & Biomechanics' },
          { id: 'rom', label: `Goniometry ROM (${analysis.romMetrics.length})` },
          { id: 'strength', label: `Strength & Symmetry (${analysis.strengthMetrics.length})` },
          { id: 'fms', label: `FMS Screening (${analysis.fmsScores.length})` },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              activeSubTab === tab.id
                ? 'bg-[#FF5500] text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 bg-white hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT: OVERVIEW */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* Historical Progression Chart */}
          {analysis.historyTimeline && analysis.historyTimeline.length > 0 && (
            <div className="p-5 rounded-3xl bg-white border border-gray-200 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div>
                  <h3 className="text-sm font-extrabold text-gray-900 font-display">Rehabilitation Progression Trajectory</h3>
                  <p className="text-xs text-gray-500">
                    Dual-axis tracking of VAS Pain reduction vs Functional Index improvements across visits.
                  </p>
                </div>
                <div className="flex items-center gap-3 text-[11px]">
                  <span className="flex items-center gap-1.5 text-[#FF5500] font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FF5500]" /> Functional Index (%)
                  </span>
                  <span className="flex items-center gap-1.5 text-red-500 font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Pain Score (0-10)
                  </span>
                </div>
              </div>

              <div className="h-64 sm:h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analysis.historyTimeline} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                    <XAxis dataKey="date" stroke="#888" fontSize={11} tickLine={false} />
                    <YAxis yAxisId="left" domain={[0, 100]} stroke="#FF5500" fontSize={11} tickLine={false} />
                    <YAxis yAxisId="right" orientation="right" domain={[0, 10]} stroke="#ef4444" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb', borderRadius: '12px', fontSize: '12px', color: '#111827' }}
                      formatter={(value: any, name: any) => [value, name === 'functionalIndex' ? 'Functional Index (%)' : name === 'painScore' ? 'VAS Pain Score' : name]}
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="functionalIndex"
                      stroke="#FF5500"
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#FF5500', stroke: '#ffffff', strokeWidth: 2 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="painScore"
                      stroke="#ef4444"
                      strokeWidth={2.5}
                      strokeDasharray="4 4"
                      dot={{ r: 4, fill: '#ef4444', stroke: '#ffffff', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Biomechanical Observations & Clinical Recommendations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Findings */}
            <div className="p-5 rounded-3xl bg-white border border-gray-200 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#FF5500]" />
                <h3 className="text-sm font-extrabold text-gray-900 font-display">Specialist Biomechanical Findings</h3>
              </div>
              <p className="text-xs leading-relaxed text-gray-700 whitespace-pre-line bg-gray-50 p-3.5 rounded-2xl border border-gray-200">
                {analysis.biomechanicalFindings || 'No detailed kinetic narrative logged for this session.'}
              </p>
            </div>

            {/* Recommendations */}
            <div className="p-5 rounded-3xl bg-white border border-gray-200 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-extrabold text-gray-900 font-display">Clinical Action Plan & Recommendations</h3>
              </div>
              <div className="space-y-2">
                {analysis.clinicalRecommendations && analysis.clinicalRecommendations.length > 0 ? (
                  analysis.clinicalRecommendations.map((rec, i) => (
                    <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-800">
                      <span className="w-4 h-4 rounded-full bg-[#FF5500]/15 text-[#FF5500] flex items-center justify-center font-black text-[10px] shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span>{rec}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-500 italic p-3">No specific action items listed.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: ROM */}
      {activeSubTab === 'rom' && (
        <div className="space-y-5">
          {/* ROM Bar Chart */}
          <div className="p-5 rounded-3xl bg-white border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-extrabold text-gray-900 font-display">Goniometric Range of Motion Comparison</h3>
                <p className="text-xs text-gray-500">Current joint degrees versus normal anatomical reference baseline.</p>
              </div>
            </div>

            <div className="h-64 sm:h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={romChartData} margin={{ top: 10, right: 20, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                  <XAxis dataKey="joint" stroke="#777" fontSize={10} angle={-15} textAnchor="end" />
                  <YAxis stroke="#777" fontSize={11} unit="°" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb', borderRadius: '12px', fontSize: '12px', color: '#111827' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="Current" fill="#FF5500" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Target" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ROM Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {analysis.romMetrics.map((rom, i) => {
              const percent = Math.min(100, Math.round((rom.currentDeg / (rom.targetDeg || 1)) * 100));
              return (
                <div key={i} className="p-4 rounded-2xl bg-white border border-gray-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-extrabold text-gray-900">{rom.joint}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        rom.status === 'Optimal'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : rom.status === 'Progressing'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {rom.status || 'Active'}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">{rom.movement}</p>
                  </div>

                  <div className="mt-3">
                    <div className="flex items-baseline justify-between text-xs mb-1 font-mono">
                      <span className="text-[#FF5500] font-black text-sm">
                        {rom.currentDeg}{rom.unit || '°'}
                      </span>
                      <span className="text-gray-500 font-medium">
                        Target: {rom.targetDeg}{rom.unit || '°'} ({percent}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#FF5500]"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB CONTENT: STRENGTH */}
      {activeSubTab === 'strength' && (
        <div className="space-y-5">
          {/* Strength Bar Chart */}
          <div className="p-5 rounded-3xl bg-white border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-extrabold text-gray-900 font-display">Bilateral Muscle Dynamometry (Left vs Right)</h3>
                <p className="text-xs text-gray-500">Assessment of side-to-side limb asymmetry deficit (LSI).</p>
              </div>
            </div>

            <div className="h-64 sm:h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={strengthChartData} margin={{ top: 10, right: 20, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                  <XAxis dataKey="name" stroke="#777" fontSize={10} angle={-15} textAnchor="end" />
                  <YAxis stroke="#777" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb', borderRadius: '12px', fontSize: '12px', color: '#111827' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="Left" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Right" fill="#FF5500" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Strength Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {analysis.strengthMetrics.map((str, i) => (
              <div key={i} className="p-4 rounded-2xl bg-white border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-900">{str.muscleGroup}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    str.asymmetryPercent <= 10
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : str.asymmetryPercent <= 20
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {str.asymmetryPercent}% Asymmetry
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3 text-center">
                  <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-100">
                    <p className="text-[10px] text-purple-700 font-bold uppercase">Left Limb</p>
                    <p className="text-base font-black text-gray-900 font-mono mt-0.5">{str.leftSide} <span className="text-[10px] font-normal text-gray-500">{str.unit}</span></p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-orange-50 border border-orange-100">
                    <p className="text-[10px] text-[#FF5500] font-bold uppercase">Right Limb</p>
                    <p className="text-base font-black text-gray-900 font-mono mt-0.5">{str.rightSide} <span className="text-[10px] font-normal text-gray-500">{str.unit}</span></p>
                  </div>
                </div>

                <p className="text-[10px] text-gray-500 mt-2 text-center">
                  {str.asymmetryPercent <= 10 ? 'Normal physiological symmetry (<10% deficit)' : 'Clinically significant strength deficit requires focused hypertrophy'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: FMS SCREENING */}
      {activeSubTab === 'fms' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Radar Visualizer */}
            <div className="p-5 rounded-3xl bg-white border border-gray-200 shadow-sm flex flex-col items-center justify-center">
              <h3 className="text-sm font-extrabold text-gray-900 font-display self-start mb-1">FMS Movement Screen Radar</h3>
              <p className="text-xs text-gray-500 self-start mb-4">7 fundamental kinetic movement patterns (0-3 score each).</p>

              <div className="h-64 sm:h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={fmsRadarData}>
                    <PolarGrid stroke="#E5E7EB" />
                    <PolarAngleAxis dataKey="subject" stroke="#6B7280" fontSize={10} />
                    <PolarRadiusAxis angle={30} domain={[0, 3]} stroke="#9CA3AF" fontSize={9} />
                    <Radar name="Score" dataKey="Score" stroke="#FF5500" fill="#FF5500" fillOpacity={0.3} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb', borderRadius: '12px', fontSize: '12px', color: '#111827' }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* FMS Score Breakdown List */}
            <div className="p-5 rounded-3xl bg-white border border-gray-200 shadow-sm space-y-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <h3 className="text-sm font-extrabold text-gray-900 font-display">Test Breakdown</h3>
                <span className="text-xs font-mono font-black text-emerald-700">Total: {analysis.fmsTotal} / 21</span>
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {analysis.fmsScores.map((item, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-gray-900">{item.name}</p>
                      {item.notes && <p className="text-[10px] text-gray-500 mt-0.5">{item.notes}</p>}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black font-mono ${
                        item.score === 3
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : item.score === 2
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-red-100 text-red-800 border border-red-200'
                      }`}>
                        {item.score}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto">
        <div className="w-full max-w-5xl bg-white border border-gray-200 rounded-3xl p-5 sm:p-8 shadow-2xl my-auto">
          {content}
        </div>
      </div>
    );
  }

  return content;
};
