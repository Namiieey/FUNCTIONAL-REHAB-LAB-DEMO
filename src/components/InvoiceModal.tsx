import React from 'react';
import { Invoice, Appointment } from '../types.js';
import { generateWhatsAppBookingUrl } from '../services/api.js';
import { exportToJson, triggerPrint } from '../utils/exportUtils.js';
import { X, Printer, Share2, CheckCircle2, ShieldCheck, Phone, MapPin, Mail, ArrowUpRight, Download } from 'lucide-react';

interface InvoiceModalProps {
  invoice: Invoice | null;
  appointment?: Appointment | null;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ invoice, appointment, onClose }) => {
  if (!invoice) return null;

  // Derive appointment if not passed directly
  const apt: Appointment = appointment || {
    id: invoice.appointmentId,
    patientId: invoice.patientId,
    patientName: invoice.patientName,
    patientPhone: invoice.patientPhone,
    doctorId: 'doc-1',
    doctorName: invoice.doctorName,
    service: invoice.items[0]?.description || 'Clinical Rehabilitation',
    date: invoice.date,
    timeSlot: 'Scheduled Slot',
    status: 'Confirmed',
    invoiceId: invoice.id,
    fee: invoice.total,
    createdAt: invoice.createdAt,
    updatedAt: invoice.createdAt
  };

  const whatsappUrl = generateWhatsAppBookingUrl(apt, invoice);

  const handleExportJson = () => {
    exportToJson(`INVOICE_${invoice.invoiceNumber}`, invoice);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white border border-gray-200 rounded-3xl shadow-2xl overflow-hidden my-auto print-container">
        
        {/* Modal Top Bar - Hidden on print */}
        <div className="no-print flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF5500] animate-pulse" />
            <h3 className="text-sm font-black text-gray-900 tracking-wide uppercase font-display">
              Tax Invoice & Receipt
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
              id="btn-print-invoice"
              onClick={() => triggerPrint()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-300 hover:border-[#FF5500] bg-white text-xs font-bold text-gray-700 hover:text-gray-900 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-[#FF5500]" />
              <span>Print / PDF</span>
            </button>

            <button
              id="btn-close-invoice"
              onClick={onClose}
              className="p-1.5 rounded-xl border border-gray-300 hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Sheet */}
        <div className="p-6 sm:p-8 bg-white text-gray-900 font-sans">
          {/* Clinic Header */}
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
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900 font-display">
                  FUNCTIONAL <span className="text-[#FF5500]">REHAB LAB</span>
                </h1>
                <p className="text-xs text-gray-500 font-medium tracking-wide">
                  {invoice.clinicInfo?.tagline || 'Advanced Sports & Orthopedic Physical Rehabilitation'}
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right text-xs text-gray-600 space-y-1">
              <p className="flex items-center sm:justify-end gap-1.5 text-gray-900 font-medium">
                <MapPin className="w-3.5 h-3.5 text-[#FF5500]" />
                #14, 2nd Floor, 100ft Rd, Indiranagar, Bengaluru
              </p>
              <p className="flex items-center sm:justify-end gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#FF5500]" />
                +91 80885 96486
              </p>
              <p className="flex items-center sm:justify-end gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#FF5500]" />
                care@functionalrehablab.com
              </p>
              <p className="text-[10px] text-gray-400 font-mono">
                GSTIN: {invoice.clinicInfo?.gstin || '29AABCF9241K1ZP'}
              </p>
            </div>
          </div>

          {/* Invoice Meta Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-6 border-b border-gray-200 text-xs">
            <div>
              <p className="text-gray-500 uppercase tracking-wider font-bold text-[10px]">Invoice Number</p>
              <p className="text-gray-900 font-mono font-black text-sm mt-0.5">{invoice.invoiceNumber}</p>
            </div>
            <div>
              <p className="text-gray-500 uppercase tracking-wider font-bold text-[10px]">Date of Issue</p>
              <p className="text-gray-900 font-semibold text-sm mt-0.5">{invoice.date}</p>
            </div>
            <div>
              <p className="text-gray-500 uppercase tracking-wider font-bold text-[10px]">Attending Doctor</p>
              <p className="text-[#FF5500] font-bold text-sm mt-0.5">{invoice.doctorName}</p>
            </div>
            <div>
              <p className="text-gray-500 uppercase tracking-wider font-bold text-[10px]">Payment Status</p>
              <span className="inline-flex items-center gap-1 mt-0.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" />
                {invoice.paymentStatus}
              </span>
            </div>
          </div>

          {/* Patient Details */}
          <div className="py-4 border-b border-gray-200 bg-gray-50 rounded-2xl p-4 my-4">
            <p className="text-[10px] uppercase tracking-wider font-bold text-gray-500">Patient Billing Profile</p>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-1">
              <div>
                <p className="text-base font-extrabold text-gray-900">{invoice.patientName}</p>
                <p className="text-xs text-gray-600 font-mono">Mobile: {invoice.patientPhone}</p>
              </div>
              <div className="text-xs sm:text-right">
                <span className="text-gray-500">Booking Reference: </span>
                <span className="text-[#FF5500] font-mono font-bold">{invoice.appointmentId}</span>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="py-2">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 text-[11px] uppercase tracking-wider">
                  <th className="py-2 font-bold">Service Description</th>
                  <th className="py-2 font-bold text-center">Code</th>
                  <th className="py-2 font-bold text-center">Qty</th>
                  <th className="py-2 font-bold text-right">Fee (INR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoice.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="py-3.5 pr-2">
                      <p className="font-bold text-gray-900 text-sm">{item.description}</p>
                      <p className="text-[11px] text-gray-500">Clinical session, neuromuscular assessment, manual mobilization</p>
                    </td>
                    <td className="py-3.5 px-2 text-center text-gray-500 font-mono">{item.code || 'FRL-REHAB'}</td>
                    <td className="py-3.5 px-2 text-center text-gray-900 font-bold">{item.qty}</td>
                    <td className="py-3.5 pl-2 text-right font-black text-gray-900 font-mono text-sm">
                      ₹{item.amount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary / Total Box */}
          <div className="pt-4 border-t border-gray-200 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="text-xs text-gray-500 space-y-1">
              <p className="flex items-center gap-1.5 text-emerald-700 font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Verified Digital Clinical Receipt
              </p>
              <p className="text-[11px] text-gray-500">
                Payment processed via {invoice.paymentMethod}. All clinical physiotherapy fees are GST compliant.
              </p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 min-w-[220px] text-right space-y-1.5">
              <div className="flex justify-between text-xs text-gray-600">
                <span>Subtotal:</span>
                <span className="text-gray-900 font-mono font-semibold">₹{invoice.subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-600">
                <span>GST / Taxes (0%):</span>
                <span className="text-gray-900 font-mono font-semibold">₹{invoice.tax}</span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between items-baseline">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-700">Total Paid:</span>
                <span className="text-xl font-black text-[#FF5500] font-mono">
                  ₹{invoice.total.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* WhatsApp Direct Action Bar */}
          <div className="no-print mt-6 pt-5 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gradient-to-r from-orange-50 to-white p-4 rounded-2xl border border-[#FF5500]/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <Share2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-gray-900 tracking-wide">
                  Share Booking & Invoice via WhatsApp
                </p>
                <p className="text-[11px] text-gray-600">
                  Preformatted for clinic desk <strong className="text-gray-900 font-mono">+91 80885 96486</strong>
                </p>
              </div>
            </div>

            <a
              id="btn-whatsapp-invoice"
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-black font-extrabold text-xs tracking-wider uppercase transition shadow-sm shrink-0 cursor-pointer"
            >
              <span>Send WhatsApp (+91 80885 96486)</span>
              <ArrowUpRight className="w-4 h-4 stroke-[3]" />
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="no-print px-6 py-3 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-xs font-bold text-gray-800 transition cursor-pointer"
          >
            Close Invoice
          </button>
        </div>
      </div>
    </div>
  );
};
