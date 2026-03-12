import React from 'react';


type Props = {
  showWarning: boolean;
  setShowWarning: React.Dispatch<React.SetStateAction<boolean>>;
};


export default function OnboardingWarning({ showWarning, setShowWarning }: Props) {
  if (!showWarning) return null;

  return (
    <div className="mb-6 w-full max-w-sm bg-red-100 border border-red-200 text-red-800 p-4 rounded-xl shadow-sm text-sm relative animate-in fade-in slide-in-from-top-4 duration-500">
      <button
        onClick={() => setShowWarning(false)}
        className="absolute top-2 right-2 text-red-400 hover:text-red-700 font-bold p-1"
      >
        ✕
      </button>
      <strong className="block mb-1">⚠️ Unsaved Changes Risk</strong>
      Your progress is currently saved <b>only on this device</b> via this unique URL: <br />
      <code className="text-xs bg-red-200/50 px-1 py-0.5 rounded mt-1 block mb-2 break-all">{window.location.href}</code>
      Please <b>bookmark this URL</b> or open it on your phone to ensure you don't lose your data!
    </div>
  );
}
