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
 <div className="bg-card rounded-2xl border border-border p-8 shadow-sm relative hover:border-[#8B5CF6]/30 transition-colors">
 <div className="flex items-center gap-2.5 mb-6 text-muted-foreground">
 <Volume2 className="w-4 h-4 text-[#8B5CF6]" />
 <h2 className="text-sm font-bold uppercase tracking-wider">Audio Settings</h2>
 </div>

 <div className="space-y-5">
 {/* Master Toggle */}
 <div className="flex items-center justify-between">
 <label className="text-sm font-medium text-foreground cursor-pointer" htmlFor="audioCuesEnabled">
 Enable Audio Cues
 </label>
 <input 
 type="checkbox"
 id="audioCuesEnabled"
 className="w-5 h-5 text-[#8B5CF6] rounded border-border bg-background focus:ring-[#8B5CF6] focus:ring-offset-[#111827] cursor-pointer transition-colors"
 checked={settings.audioCuesEnabled}
 onChange={(e) => handleChange("audioCuesEnabled", e.target.checked)}
 disabled={isSaving}
 />
 </div>

 {settings.audioCuesEnabled && (
 <div className="space-y-4 pt-2">
 <div className="flex items-center justify-between pl-4 border-l-2 border-border">
 <label className="text-sm font-medium text-muted-foreground cursor-pointer" htmlFor="audioCheckpointsEnabled">
 Progress Checkpoints
 </label>
 <input 
 type="checkbox"
 id="audioCheckpointsEnabled"
 className="w-4 h-4 text-[#8B5CF6] rounded border-border bg-background focus:ring-[#8B5CF6] focus:ring-offset-[#111827] cursor-pointer transition-colors"
 checked={settings.audioCheckpointsEnabled}
 onChange={(e) => handleChange("audioCheckpointsEnabled", e.target.checked)}
 disabled={isSaving}
 />
 </div>

 <div className="flex items-center justify-between pl-4 border-l-2 border-border">
 <label className="text-sm font-medium text-muted-foreground cursor-pointer" htmlFor="audioWarningEnabled">
 Final Warning (5 min)
 </label>
 <input 
 type="checkbox"
 id="audioWarningEnabled"
 className="w-4 h-4 text-[#8B5CF6] rounded border-border bg-background focus:ring-[#8B5CF6] focus:ring-offset-[#111827] cursor-pointer transition-colors"
 checked={settings.audioWarningEnabled}
 onChange={(e) => handleChange("audioWarningEnabled", e.target.checked)}
 disabled={isSaving}
 />
 </div>

 <div className="pt-4 mt-4 border-t border-border">
 <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 block">
 Volume
 </label>
 <div className="flex bg-background p-1.5 rounded-xl border border-border">
 {["LOW", "MEDIUM", "HIGH"].map((vol) => (
 <button
 key={vol}
 disabled={isSaving}
 onClick={() => handleChange("audioVolume", vol)}
 className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${
 settings.audioVolume === vol 
 ? "bg-[#8B5CF6] text-white shadow-[0_2px_8px_rgba(139,92,246,0.4)]" 
 : "text-muted-foreground hover:text-foreground hover:bg-muted"
 }`}
 >
 {vol}
 </button>
 ))}
 </div>
 </div>
 </div>
 )}
 </div>
 </div>
 );
}
