import React, { useState } from 'react';
import { Download, Share, PlusSquare, X } from 'lucide-react';
import { usePWAInstall } from '../utils/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already installed, hide prompt
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        id="pwa-install-button"
        onClick={install}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-sm transition-all animate-pulse hover:animate-none"
        title="Instalar Aplicativo no Dispositivo"
      >
        <img src="./app-icon.png" alt="" className="w-4 h-4 rounded-xs object-cover shrink-0" />
        <span>Instalar App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          id="pwa-install-ios-button"
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-300 text-slate-700 hover:bg-slate-100 transition-all"
          title="Como instalar no iPhone / iPad"
        >
          <img src="./app-icon.png" alt="" className="w-4 h-4 rounded-xs object-cover shrink-0" />
          <span>Instalar no iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-2xl text-slate-800 border border-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 p-1 flex items-center justify-center shadow-sm shrink-0">
                    <img src="./favicon.png" alt="Salão do Reino" className="w-full h-full object-contain" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">
                    Instalar no iPhone / iPad
                  </h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 rounded-md bg-slate-100 text-slate-700 shrink-0">
                    <Share className="w-4 h-4" />
                  </div>
                  <div>
                    1. Toque no botão de <strong>Compartilhar</strong> na barra inferior do Safari.
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 rounded-md bg-slate-100 text-slate-700 shrink-0">
                    <PlusSquare className="w-4 h-4" />
                  </div>
                  <div>
                    2. Role para baixo e selecione <strong>Adicionar à Tela de Início</strong>.
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-lg bg-slate-900 py-2 text-xs font-bold text-white hover:bg-slate-800 transition-all"
              >
                Entendi
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
