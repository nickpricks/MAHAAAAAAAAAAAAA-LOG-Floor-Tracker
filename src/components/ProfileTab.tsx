import React from 'react';
import { User, Moon, Sun, Monitor, Hash, ShieldCheck, Trophy, Palette, AtSign, Edit3, Check, X as XIcon } from 'lucide-react';
import { APP_NAME, APP_VERSION, COLOR_MODES, DEFAULT_THEME_ID, type ColorMode } from '@/constants';
import { UserSettings, isUsernameAvailable, claimUsername, releaseUsername } from '@utils/firebase';
import { FLOOR_HEIGHT_PRESETS, DEFAULT_FLOOR_HEIGHT } from '@utils/challenges';
import { THEME_DEFINITIONS, type ThemeId, isValidThemeId, getThemeDefinition } from '@utils/themes';
import { validateUsername } from '@utils/usernames';
import { useNavigate } from 'react-router-dom';

type Props = {
  userId: string | null;
  settings: UserSettings;
  updateSettings: (newSettings: UserSettings) => void;
  floorHeight: number;
};

export default function ProfileTab({ userId, settings, updateSettings, floorHeight }: Props) {
  const navigate = useNavigate();
  const currentThemeId: ThemeId = isValidThemeId(settings.theme ?? '') ? settings.theme as ThemeId : DEFAULT_THEME_ID;
  const currentColorMode: ColorMode = settings.colorMode || COLOR_MODES.SYSTEM;
  const currentTheme = getThemeDefinition(currentThemeId);

  const [editingUsername, setEditingUsername] = React.useState(false);
  const [newUsername, setNewUsername] = React.useState('');
  const [usernameError, setUsernameError] = React.useState('');
  const [savingUsername, setSavingUsername] = React.useState(false);

  const [editingEmail, setEditingEmail] = React.useState(false);
  const [newEmail, setNewEmail] = React.useState('');

  const handleSaveUsername = async () => {
    if (!userId) return;
    const validation = validateUsername(newUsername);
    if (!validation.valid) {
      setUsernameError(validation.error);
      return;
    }

    setSavingUsername(true);
    setUsernameError('');

    const available = await isUsernameAvailable(newUsername);
    if (!available) {
      setUsernameError('Username is already taken');
      setSavingUsername(false);
      return;
    }

    const claimed = await claimUsername(newUsername, userId);
    if (!claimed) {
      setUsernameError('Failed to claim username');
      setSavingUsername(false);
      return;
    }

    // Release old username only after new one is secured
    if (settings.username) {
      await releaseUsername(settings.username);
    }

    updateSettings({ username: newUsername });
    setEditingUsername(false);
    setSavingUsername(false);
    navigate(`/${newUsername}`, { replace: true });
  };

  const handleSaveEmail = () => {
    updateSettings({ email: newEmail });
    setEditingEmail(false);
  };

  const colorModes: { id: ColorMode; name: string; icon: typeof Sun }[] = [
    { id: COLOR_MODES.LIGHT, name: 'Light', icon: Sun },
    { id: COLOR_MODES.DARK, name: 'Dark', icon: Moon },
    { id: COLOR_MODES.SYSTEM, name: 'Device', icon: Monitor },
  ];

  return (
    <div className="w-full max-w-sm bg-surface-card p-8 rounded-[2rem] shadow-sm border border-line flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center">
        <div className="w-20 h-20 bg-surface-raised rounded-full flex items-center justify-center mx-auto mb-4 border border-line text-fg-subtle">
          <User size={40} />
        </div>
        <h2 className="text-2xl font-display font-extrabold text-fg-heading">Your Profile</h2>
        <p className="text-sm text-fg-muted mt-1">Synced across your devices</p>
      </div>

      {/* User ID Section */}
      <div className="bg-surface-raised p-4 rounded-2xl border border-line-subtle">
        <div className="flex items-center gap-2 mb-2 text-fg-subtle">
          <Hash size={14} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Unique Identifier</span>
        </div>
        <code className="text-[10px] break-all text-fg font-mono bg-surface p-2 rounded-lg border border-line block">
          {userId || 'Loading...'}
        </code>
        <div className="flex items-center gap-1.5 mt-3 text-green-600">
          <ShieldCheck size={14} />
          <span className="text-[10px] font-bold">Cloud Synced & Anonymous</span>
        </div>
      </div>

      {/* Username Section */}
      <div className="bg-surface-raised p-4 rounded-2xl border border-line-subtle">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-fg-subtle">
            <AtSign size={14} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Username</span>
          </div>
          {!editingUsername && (
            <button
              onClick={() => {
                setNewUsername(settings.username || '');
                setEditingUsername(true);
                setUsernameError('');
              }}
              className="text-fg-subtle hover:text-accent transition-colors"
            >
              <Edit3 size={14} />
            </button>
          )}
        </div>

        {editingUsername ? (
          <div className="flex flex-col gap-2">
            <input
              type="text"
              value={newUsername}
              onChange={(e) => {
                setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                setUsernameError('');
              }}
              maxLength={20}
              className="w-full bg-surface border border-line text-fg text-sm font-mono rounded-lg p-2 focus:ring-accent focus:border-accent"
              autoFocus
            />
            {usernameError && <p className="text-red-500 text-[11px] font-medium">{usernameError}</p>}
            <div className="flex gap-2">
              <button
                onClick={handleSaveUsername}
                disabled={savingUsername || !newUsername}
                className="flex items-center gap-1 text-[11px] font-bold text-accent hover:opacity-80 disabled:opacity-50"
              >
                <Check size={12} /> {savingUsername ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => setEditingUsername(false)}
                className="flex items-center gap-1 text-[11px] font-bold text-fg-muted hover:text-fg"
              >
                <XIcon size={12} /> Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm font-mono text-fg font-medium">
            {settings.username || <span className="text-fg-subtle italic">No username set</span>}
          </p>
        )}
      </div>

      {/* Email Section */}
      <div className="bg-surface-raised p-4 rounded-2xl border border-line-subtle">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-fg-subtle">
            <AtSign size={14} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Email</span>
          </div>
          {!editingEmail && (
            <button
              onClick={() => {
                setNewEmail(settings.email || '');
                setEditingEmail(true);
              }}
              className="text-fg-subtle hover:text-accent transition-colors"
            >
              <Edit3 size={14} />
            </button>
          )}
        </div>

        {editingEmail ? (
          <div className="flex flex-col gap-2">
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="for future recovery"
              className="w-full bg-surface border border-line text-fg text-sm rounded-lg p-2 focus:ring-accent focus:border-accent placeholder:text-fg-subtle"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveEmail}
                className="flex items-center gap-1 text-[11px] font-bold text-accent hover:opacity-80"
              >
                <Check size={12} /> Save
              </button>
              <button
                onClick={() => setEditingEmail(false)}
                className="flex items-center gap-1 text-[11px] font-bold text-fg-muted hover:text-fg"
              >
                <XIcon size={12} /> Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-fg font-medium">
            {settings.email || <span className="text-fg-subtle italic">Not set</span>}
          </p>
        )}
      </div>

      {/* Theme Selection */}
      <section>
        <h3 className="text-xs font-bold uppercase tracking-widest text-fg-subtle mb-4 flex items-center gap-2">
          <Palette size={14} /> Theme
        </h3>
        <select
          value={currentThemeId}
          onChange={(e) => updateSettings({ theme: e.target.value as ThemeId })}
          className="w-full bg-surface-raised border border-line text-fg text-sm font-bold rounded-xl focus:ring-accent focus:border-accent block p-3 cursor-pointer shadow-sm"
        >
          {Object.values(THEME_DEFINITIONS).map((theme) => (
            <option key={theme.id} value={theme.id}>
              {theme.name} ({theme.family}{theme.darkOnly ? ' · Dark' : ''})
            </option>
          ))}
        </select>
        {/* Preview swatch */}
        <div
          className="mt-3 h-10 rounded-xl border border-line/50 flex items-center justify-center overflow-hidden transition-all"
          style={{ backgroundColor: currentTheme.previewColors.bg }}
        >
          <span
            className="text-lg font-bold font-display tracking-wider"
            style={{ color: currentTheme.previewColors.accent }}
          >
            {currentTheme.name}
          </span>
        </div>
      </section>

      {/* Color Mode — only for themes that support light/dark */}
      {!currentTheme.darkOnly && (
        <section>
          <h3 className="text-xs font-bold uppercase tracking-widest text-fg-subtle mb-4 flex items-center gap-2">
            <Monitor size={14} /> Appearance
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {colorModes.map((m) => {
              const Icon = m.icon;
              const active = currentColorMode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => updateSettings({ colorMode: m.id })}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                    active
                      ? 'bg-accent border-accent text-surface shadow-md shadow-accent/20'
                      : 'bg-surface-card border-line text-fg-muted hover:border-line'
                  }`}
                >
                  <Icon size={18} />
                  <span className="text-[10px] font-bold">{m.name}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Floor Height */}
      <section>
        <h3 className="text-xs font-bold uppercase tracking-widest text-fg-subtle mb-4 flex items-center gap-2">
          <Trophy size={14} /> Floor Height
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {FLOOR_HEIGHT_PRESETS.map((preset) => {
            const active = floorHeight === preset.meters;
            return (
              <button
                key={preset.id}
                onClick={() => updateSettings({ floorHeight: preset.meters })}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all ${
                  active
                    ? 'bg-accent border-accent text-surface shadow-md shadow-accent/20'
                    : 'bg-surface-card border-line text-fg-muted hover:border-line'
                }`}
              >
                <span className="text-sm font-bold">{preset.meters}m</span>
                <span className="text-[9px] font-medium">{preset.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
        <p className="text-[10px] text-fg-subtle mt-2 px-1">
          Height per floor used for distance calculations.
        </p>
      </section>

      <div className="mt-4 pt-6 border-t border-line-subtle text-center">
        <p className="text-[10px] text-fg-subtle font-medium">
          {APP_NAME} {APP_VERSION} • Open Source
        </p>
      </div>
    </div>
  );
}
