import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserProfile,
  AVATAR_OPTIONS,
  createNewProfile,
  deleteProfile,
  exportAllDataAsJson,
  importDataFromJson,
} from '../utils/profileStorage';
import {
  X,
  UserCheck,
  UserPlus,
  Download,
  Upload,
  Trash2,
  Calendar,
  Flame,
  Award,
  ShieldCheck,
  Check,
  Smartphone,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProfile: UserProfile;
  allProfiles: UserProfile[];
  onSelectProfile: (profile: UserProfile) => void;
  onProfilesUpdated: () => void;
  totalPoolSize: number;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  activeProfile,
  allProfiles,
  onSelectProfile,
  onProfilesUpdated,
  totalPoolSize,
}) => {
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>('');
  const [selectedAvatar, setSelectedAvatar] = useState<string>(AVATAR_OPTIONS[0]);
  const [targetDate, setTargetDate] = useState<string>('');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  // Calculate quick stats for active profile
  const masteredCount = Object.values(activeProfile.masteryScores || {}).filter(
    (count) => count >= 3
  ).length;
  const readiness = totalPoolSize > 0 ? Math.round((masteredCount / totalPoolSize) * 100) : 0;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const created = createNewProfile(newName, selectedAvatar, targetDate || undefined);
    onSelectProfile(created);
    onProfilesUpdated();
    setNewName('');
    setIsCreating(false);
  };

  const handleDelete = (id: string) => {
    if (allProfiles.length <= 1) {
      alert('Cannot delete the only profile.');
      return;
    }
    if (confirm('Are you sure you want to delete this profile and its progress from this device?')) {
      const { newActive } = deleteProfile(id);
      onSelectProfile(newActive);
      onProfilesUpdated();
    }
  };

  const handleExport = () => {
    const jsonStr = exportAllDataAsJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PassIN_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importDataFromJson(content);
      if (success) {
        setImportStatus('Backup restored successfully!');
        onProfilesUpdated();
        setTimeout(() => setImportStatus(null), 3000);
      } else {
        setImportStatus('Failed to restore backup. Invalid file format.');
        setTimeout(() => setImportStatus(null), 4000);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl relative text-slate-900 dark:text-white"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 p-5 flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-2xl bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xl">
                👤
              </span>
              <div>
                <h2 className="text-lg font-black tracking-tight leading-snug">
                  Learner Profiles & Sign-In
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Smartphone className="w-3 h-3 text-emerald-500" />
                  <span>Saved on this phone · $0 Cloud Cost</span>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 space-y-6">
            {/* Active Profile Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50/50 dark:from-indigo-950/40 dark:to-slate-800/40 border border-indigo-100 dark:border-indigo-900/50">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3.5">
                  <span className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 shadow-md flex items-center justify-center text-3xl border border-slate-100 dark:border-slate-700">
                    {activeProfile.avatar}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-extrabold tracking-tight">
                        {activeProfile.name}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white shadow-xs">
                        Active
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Practicing since {new Date(activeProfile.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-indigo-100/80 dark:border-indigo-900/40 text-center">
                <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded-xl">
                  <div className="flex items-center justify-center gap-1 text-amber-500 text-xs font-bold">
                    <Flame className="w-3.5 h-3.5 fill-amber-500" />
                    <span>{activeProfile.streakDays}d</span>
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    Daily Streak
                  </span>
                </div>
                <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded-xl">
                  <div className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                    {masteredCount}
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    Mastered
                  </span>
                </div>
                <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded-xl">
                  <div className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                    {readiness}%
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    Readiness
                  </span>
                </div>
              </div>
            </div>

            {/* Switch Profiles List */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Switch Learner ({allProfiles.length})
                </h4>
                {!isCreating && (
                  <button
                    type="button"
                    onClick={() => setIsCreating(true)}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Add Learner</span>
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {allProfiles.map((p) => {
                  const isActive = p.id === activeProfile.id;
                  const pMastered = Object.values(p.masteryScores || {}).filter((c) => c >= 3).length;
                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        if (!isActive) {
                          onSelectProfile(p);
                          onProfilesUpdated();
                        }
                      }}
                      className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                        isActive
                          ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-400 dark:border-indigo-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{p.avatar}</span>
                        <div>
                          <span className="text-sm font-bold block">{p.name}</span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            {pMastered} mastered · {p.streakDays}d streak
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isActive ? (
                          <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(p.id);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                            title="Delete profile"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Create New Profile Form */}
            {isCreating && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleCreate}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    New Learner Profile
                  </h4>
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="text-xs text-slate-400 hover:text-slate-600"
                  >
                    Cancel
                  </button>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Learner Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Maria or Dad"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Choose Avatar Icon
                  </label>
                  <div className="grid grid-cols-8 gap-1.5 p-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                    {AVATAR_OPTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setSelectedAvatar(emoji)}
                        className={`text-xl p-1.5 rounded-lg transition-transform ${
                          selectedAvatar === emoji
                            ? 'bg-indigo-100 dark:bg-indigo-900/60 scale-110 shadow-xs'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs transition-colors shadow-xs"
                >
                  Create & Start Learning
                </button>
              </motion.form>
            )}

            {/* Data & Backup Tools */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Device Backup & Transfer
              </h4>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleExport}
                  className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Export Backup</span>
                </button>

                <label className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-colors cursor-pointer">
                  <Upload className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Restore Backup</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    className="hidden"
                  />
                </label>
              </div>

              {importStatus && (
                <p className="mt-2 text-xs font-bold text-center text-emerald-600 dark:text-emerald-400">
                  {importStatus}
                </p>
              )}
            </div>

            {/* Privacy & Zero-Cost Notice */}
            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-200">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="text-[11px] leading-tight">
                <span className="font-bold block">100% On-Device & Private</span>
                <span className="opacity-90">
                  Your progress is saved right into your phone's storage. No cloud database fees, no logins needed, and works completely offline.
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
