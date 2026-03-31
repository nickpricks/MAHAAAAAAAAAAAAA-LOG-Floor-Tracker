import React from 'react';
import { UserPlus } from 'lucide-react';
import { validateUsername, generateAutoUsername } from '@utils/usernames';
import { isUsernameAvailable, claimUsername, saveUserSettings } from '@utils/firebase';

type Props = {
  userId: string;
  onComplete: (username: string) => void;
};

export default function UsernamePopup({ userId, onComplete }: Props) {
  const [username, setUsername] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [error, setError] = React.useState('');
  const [checking, setChecking] = React.useState(false);

  const handleClaim = async () => {
    const validation = validateUsername(username);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    setChecking(true);
    setError('');

    const available = await isUsernameAvailable(username);
    if (!available) {
      setError('Username is already taken');
      setChecking(false);
      return;
    }

    const claimed = await claimUsername(username, userId);
    if (!claimed) {
      setError('Failed to claim username. Try again.');
      setChecking(false);
      return;
    }

    await saveUserSettings(userId, { username, ...(email ? { email } : {}) });
    setChecking(false);
    onComplete(username);
  };

  const handleSkip = async () => {
    setChecking(true);
    const autoName = generateAutoUsername();
    for (let i = 0; i < 3; i++) {
      const name = i === 0 ? autoName : generateAutoUsername();
      const available = await isUsernameAvailable(name);
      if (available) {
        await claimUsername(name, userId);
        await saveUserSettings(userId, { username: name });
        setChecking(false);
        onComplete(name);
        return;
      }
    }
    setChecking(false);
    onComplete('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-surface-card p-8 rounded-2xl shadow-xl border border-line">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-surface-raised rounded-full flex items-center justify-center mx-auto mb-4 border border-line">
            <UserPlus size={28} className="text-accent" />
          </div>
          <h2 className="text-xl font-display font-extrabold text-fg-heading">Choose your identity</h2>
          <p className="text-sm text-fg-muted mt-2">Pick a username for your shareable profile</p>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-fg-subtle block mb-1.5">
              Username (optional)
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                setError('');
              }}
              placeholder="climber-7f3a"
              maxLength={20}
              className="w-full bg-surface-raised border border-line text-fg text-sm font-mono rounded-xl p-3 focus:ring-accent focus:border-accent placeholder:text-fg-subtle"
            />
            {error && <p className="text-red-500 text-[11px] mt-1.5 font-medium">{error}</p>}
            <p className="text-[10px] text-fg-subtle mt-1.5">Lowercase letters, numbers, hyphens. 3-20 chars.</p>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-fg-subtle block mb-1.5">
              Email (optional)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="for future account recovery"
              className="w-full bg-surface-raised border border-line text-fg text-sm rounded-xl p-3 focus:ring-accent focus:border-accent placeholder:text-fg-subtle"
            />
          </div>

          <button
            onClick={handleClaim}
            disabled={checking || !username}
            className="w-full bg-accent text-surface font-bold py-3 rounded-xl shadow-md shadow-accent/20 transition-all disabled:opacity-50 hover:opacity-90"
          >
            {checking ? 'Claiming...' : 'Claim Username'}
          </button>

          <div className="flex items-center justify-center gap-1.5">
            <button
              onClick={handleSkip}
              disabled={checking}
              className="text-fg-muted text-sm hover:text-fg transition-colors"
            >
              Auto-choose for me
            </button>
            <span className="group relative">
              <span className="w-4 h-4 rounded-full border border-fg-subtle text-fg-subtle text-[9px] font-bold flex items-center justify-center cursor-help">i</span>
              <span className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-surface-card border border-line text-fg-muted text-[10px] px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-lg">
                We'll pick a random name. Change anytime in Profile.
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
