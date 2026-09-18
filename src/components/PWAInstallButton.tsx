import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall.js';
import { Download, Smartphone, X } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        id="btn-pwa-install"
        onClick={install}
        className="flex items-center gap-2 rounded-xl bg-[#FF5500] hover:bg-[#E04B00] text-white font-extrabold px-3.5 py-2 text-xs transition-all shadow-sm cursor-pointer tracking-wider"
      >
        <Download className="w-3.5 h-3.5 stroke-[2.5]" />
        <span>INSTALL APP</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          id="btn-pwa-ios"
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-2 rounded-xl border border-gray-300 hover:border-[#FF5500] bg-white px-3.5 py-2 text-xs font-bold text-gray-700 hover:text-gray-900 transition cursor-pointer"
        >
          <Smartphone className="w-3.5 h-3.5 text-[#FF5500]" />
          <span>Install App</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-3xl bg-white border border-gray-200 p-6 shadow-2xl relative">
              <button
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="w-10 h-10 rounded-2xl bg-[#FF5500]/10 border border-[#FF5500]/30 flex items-center justify-center mb-4">
                <Smartphone className="w-5 h-5 text-[#FF5500]" />
              </div>
              <h3 className="text-lg font-black text-gray-900 font-display">Install FRL on iPhone/iPad</h3>
              <p className="mt-3 text-xs text-gray-600 leading-relaxed">
                1. Tap the <strong className="text-gray-900">Share button</strong> <span className="text-[#FF5500] font-bold">(⎋)</span> in Safari.<br />
                2. Scroll down and choose <strong className="text-[#FF5500]">Add to Home Screen</strong>.<br />
                3. Tap <strong className="text-gray-900">Add</strong> to complete instant setup.
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-[#FF5500] text-white font-extrabold py-2.5 text-xs hover:bg-[#E04B00] transition cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
