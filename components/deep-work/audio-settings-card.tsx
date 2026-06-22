"use client";

import { useState } from "react";
import { updateAudioSettings } from "@/app/actions/user";
import { toast } from "sonner";
import { Volume2 } from "lucide-react";

interface AudioSettingsCardProps {
  initialSettings: {
    audioCuesEnabled: boolean;
    audioCheckpointsEnabled: boolean;
    audioWarningEnabled: boolean;
    audioVolume: string;
  };
}

export function AudioSettingsCard({ initialSettings }: AudioSettingsCardProps) {
  const [settings, setSettings] = useState(initialSettings);
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = async (key: keyof typeof settings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    setIsSaving(true);
    
    const result = await updateAudioSettings({ [key]: value });
    if (result.success) {
      toast.success("Audio settings updated");
    } else {
      toast.error(result.error);
      setSettings(settings); // revert on error
    }
    setIsSaving(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm relative">
      <div className="flex items-center gap-2 mb-6 text-slate-500">
        <Volume2 className="w-4 h-4" />
        <h2 className="text-sm font-bold uppercase tracking-wider">Audio Settings</h2>
      </div>

      <div className="space-y-4">
        {/* Master Toggle */}
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-slate-800 cursor-pointer" htmlFor="audioCuesEnabled">
            Enable Audio Cues
          </label>
          <input 
            type="checkbox"
            id="audioCuesEnabled"
            className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
            checked={settings.audioCuesEnabled}
            onChange={(e) => handleChange("audioCuesEnabled", e.target.checked)}
            disabled={isSaving}
          />
        </div>

        {settings.audioCuesEnabled && (
          <>
            <div className="flex items-center justify-between pl-4 border-l-2 border-slate-100">
              <label className="text-sm font-medium text-slate-600 cursor-pointer" htmlFor="audioCheckpointsEnabled">
                Progress Checkpoints
              </label>
              <input 
                type="checkbox"
                id="audioCheckpointsEnabled"
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                checked={settings.audioCheckpointsEnabled}
                onChange={(e) => handleChange("audioCheckpointsEnabled", e.target.checked)}
                disabled={isSaving}
              />
            </div>

            <div className="flex items-center justify-between pl-4 border-l-2 border-slate-100">
              <label className="text-sm font-medium text-slate-600 cursor-pointer" htmlFor="audioWarningEnabled">
                Final Warning (5 min)
              </label>
              <input 
                type="checkbox"
                id="audioWarningEnabled"
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                checked={settings.audioWarningEnabled}
                onChange={(e) => handleChange("audioWarningEnabled", e.target.checked)}
                disabled={isSaving}
              />
            </div>

            <div className="pt-2 border-t border-slate-100">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                Volume
              </label>
              <div className="flex bg-slate-100 p-1 rounded-lg">
                {["LOW", "MEDIUM", "HIGH"].map((vol) => (
                  <button
                    key={vol}
                    disabled={isSaving}
                    onClick={() => handleChange("audioVolume", vol)}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      settings.audioVolume === vol 
                        ? "bg-white text-indigo-600 shadow-sm" 
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {vol}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
