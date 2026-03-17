import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';

/**
 * PWA Update Prompt component.
 * Displays a non-intrusive toast when a new version of the app is available.
 */
const UpdatePrompt: React.FC = () => {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ', r);
    },
    onRegisterError(error) {
      console.error('SW Registration Error: ', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  if (!offlineReady && !needRefresh) {
    return null;
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4 transform transition-all animate-in fade-in slide-in-from-bottom-4">
      <div className="bg-zinc-900 border border-zinc-800 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-4">
        <div className="bg-blue-600/20 p-2 rounded-xl">
          <RefreshCw className="w-5 h-5 text-blue-400 animate-spin-slow" />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">
            {offlineReady ? 'Ready for offline' : 'Update Available'}
          </p>
          <p className="text-xs text-zinc-400 truncate">
            {offlineReady 
              ? 'App is ready to work offline' 
              : 'A new version is ready to install'
            }
          </p>
        </div>

        <div className="flex items-center gap-2">
          {needRefresh && (
            <button
              onClick={() => updateServiceWorker(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 px-3 rounded-lg transition-colors whitespace-nowrap"
            >
              Update Now
            </button>
          )}
          <button
            onClick={close}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-500 hover:text-white"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdatePrompt;
