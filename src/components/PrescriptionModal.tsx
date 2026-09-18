import React from 'react';
import { Prescription } from '../types.js';
import { exportToJson, triggerPrint } from '../utils/exportUtils.js';
import { X, Printer, Pill, Dumbbell, AlertTriangle, Calendar, UserCheck, Shield, Download } from 'lucide-react';

interface PrescriptionModalProps {
  prescription: Prescription | null;
  onClose: () => void;
}

export const PrescriptionModal: React.FC<PrescriptionModalProps> = ({ prescription, onClose }) => {
  if (!prescription) return null;

  const handleExportJson = () => {
    exportToJson(`PRESCRIPTION_${prescription.id}`, prescription);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white border border-gray-200 rounded-3xl shadow-2xl overflow-hidden my-auto print-container">
        
        {/* Top bar - Hidden on print */}
        <div className="no-print flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF5500] animate-pulse" />
            <h3 className="text-sm font-black text-gray-900 tracking-wide uppercase font-display">
              Clinical Physical Rehabilitation Prescription
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJson}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-300 hover:border-[#FF5500] bg-white text-xs font-bold text-gray-700 hover:text-gray-900 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#FF5500]" />
              <span>JSON</span>
            </button>
            <button
              onClick={() => triggerPrint()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-300 hover:border-[#FF5500] bg-white text-xs font-bold text-gray-700 hover:text-gray-900 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-[#FF5500]" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl border border-gray-300 hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Prescription Sheet */}
        <div className="p-6 sm:p-8 bg-white text-gray-900 font-sans space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white border-2 border-[#FF5500] flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                <img
                  src="https://plain-apac-prod-public.komododecks.com/202609/17/Kw2mXJAzBAz9GQSJUTXp/image.jpg"
                  alt="Functional Rehab Lab"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-gray-900 font-display">
                  FUNCTIONAL <span className="text-[#FF5500]">REHAB LAB</span>
                </h1>
                <p className="text-xs text-gray-500 font-medium">
                  Prescribed by: <strong className="text-[#FF5500] font-bold">{prescription.doctorName}</strong>
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right text-xs text-gray-500">
              <p className="font-mono text-gray-700 font-bold">Date: {prescription.date}</p>
              <p className="font-mono text-[11px] text-gray-400">Ref: {prescription.id}</p>
            </div>
          </div>

          {/* Patient & Diagnosis Block */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-200">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Patient Name</p>
              <p className="text-sm font-extrabold text-gray-900 mt-0.5">{prescription.patientName}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[#FF5500] font-bold">Clinical Diagnosis</p>
              <p className="text-sm font-bold text-gray-900 mt-0.5">{prescription.diagnosis}</p>
            </div>
            {prescription.symptoms && (
              <div className="sm:col-span-2 pt-2 border-t border-gray-200">
                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Reported Symptoms & Movement Limitations</p>
                <p className="text-xs text-gray-700 mt-0.5">{prescription.symptoms}</p>
              </div>
            )}
          </div>

          {/* Prescribed Exercises Section */}
          {prescription.exercises && prescription.exercises.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Dumbbell className="w-4 h-4 text-[#FF5500]" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                  Targeted Neuromuscular Exercises & Protocols
                </h4>
              </div>

              <div className="space-y-2.5">
                {prescription.exercises.map((ex, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-2xl bg-white border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#FF5500]/10 text-[#FF5500] text-xs font-black flex items-center justify-center">
                          {i + 1}
                        </span>
                        <h5 className="text-sm font-bold text-gray-900">{ex.name}</h5>
                      </div>
                      {ex.notes && (
                        <p className="text-xs text-gray-500 pl-7">{ex.notes}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 pl-7 sm:pl-0 shrink-0 text-xs">
                      <span className="px-3 py-1 rounded-xl bg-orange-50 text-[#FF5500] border border-orange-200 font-bold">
                        {ex.sets} Sets × {ex.repsOrDuration}
                      </span>
                      <span className="px-3 py-1 rounded-xl bg-gray-100 text-gray-700 font-semibold border border-gray-200">
                        {ex.frequency}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Precautions & Clinical Directives */}
          {prescription.precautions && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
              <div className="flex items-center gap-2 text-amber-800 font-bold text-xs mb-1">
                <AlertTriangle className="w-4 h-4" />
                <span>Clinical Precautions & Activity Limits</span>
              </div>
              <p className="text-xs text-amber-900 leading-relaxed pl-6">
                {prescription.precautions}
              </p>
            </div>
          )}

          {/* Follow-up & Review */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-200 text-xs">
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="w-4 h-4 text-[#FF5500]" />
              <span>Next Review / Progression Check:</span>
              <strong className="text-gray-900 font-bold">{prescription.nextFollowUp || 'After 7-10 Days'}</strong>
            </div>

            <div className="text-right">
              <p className="text-[11px] text-gray-500">Authorized Medical Physiotherapist</p>
              <p className="font-bold text-gray-900">{prescription.doctorName}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="no-print px-6 py-3 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-xs font-bold text-gray-800 transition cursor-pointer"
          >
            Close Prescription
          </button>
        </div>
      </div>
    </div>
  );
};
