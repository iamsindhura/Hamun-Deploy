"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Phone, Mail, Users, CheckCircle2, ArrowLeft, Info, Lock } from "lucide-react";

interface FollowUpDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectMethod: (method: "CALL" | "EMAIL" | "MEETING" | "NONE", notes?: string) => void;
  contactName: string;
}

type MethodType = "CALL" | "EMAIL" | "MEETING" | null;

export function FollowUpDialog({ isOpen, onOpenChange, onSelectMethod, contactName }: FollowUpDialogProps) {
  const [selectedMethod, setSelectedMethod] = useState<MethodType>(null);
  const [notes, setNotes] = useState("");

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setSelectedMethod(null);
        setNotes("");
      }, 200);
    }
  }, [isOpen]);

  const handleSave = () => {
    if (selectedMethod) {
      onSelectMethod(selectedMethod, notes.trim());
    }
  };

  const methodDetails = {
    CALL: {
      title: `Phone Call with ${contactName}`,
      label: "Conversation Notes",
      icon: <Phone className="h-5 w-5 text-blue-500" />,
      placeholder: "e.g., Discussed internship opportunities and agreed to reconnect next month.",
    },
    EMAIL: {
      title: `Email with ${contactName}`,
      label: "Email Summary",
      icon: <Mail className="h-5 w-5 text-emerald-500" />,
      placeholder: "e.g., Sent portfolio, resume, and project links.",
    },
    MEETING: {
      title: `Meeting with ${contactName}`,
      label: "Meeting Notes",
      icon: <Users className="h-5 w-5 text-purple-500" />,
      placeholder: "e.g., Coffee chat. Discussed AI startup ideas and mentorship.",
    },
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {!selectedMethod ? (
          // STEP 1: Select Method
          <>
            <DialogHeader>
              <DialogTitle>Complete Follow Up</DialogTitle>
              <DialogDescription>
                How did you follow up with {contactName}?
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex flex-col gap-3 py-4">
              <Button 
                variant="outline" 
                className="w-full justify-start h-auto py-3 px-4"
                onClick={() => setSelectedMethod("CALL")}
              >
                <Phone className="mr-3 h-5 w-5 text-blue-500" />
                <div className="text-left">
                  <div className="font-medium">Phone Call</div>
                  <div className="text-xs text-muted-foreground font-normal">Log call and update last contacted</div>
                </div>
              </Button>

              <Button 
                variant="outline" 
                className="w-full justify-start h-auto py-3 px-4"
                onClick={() => setSelectedMethod("EMAIL")}
              >
                <Mail className="mr-3 h-5 w-5 text-emerald-500" />
                <div className="text-left">
                  <div className="font-medium">Email</div>
                  <div className="text-xs text-muted-foreground font-normal">Log email and update last contacted</div>
                </div>
              </Button>

              <Button 
                variant="outline" 
                className="w-full justify-start h-auto py-3 px-4"
                onClick={() => setSelectedMethod("MEETING")}
              >
                <Users className="mr-3 h-5 w-5 text-purple-500" />
                <div className="text-left">
                  <div className="font-medium">Meeting</div>
                  <div className="text-xs text-muted-foreground font-normal">Log meeting and update last contacted</div>
                </div>
              </Button>

              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              <Button 
                variant="outline" 
                className="w-full justify-start h-auto py-3 px-4 bg-slate-50 hover:bg-slate-100"
                onClick={() => onSelectMethod("NONE")}
              >
                <CheckCircle2 className="mr-3 h-5 w-5 text-slate-500" />
                <div className="text-left whitespace-normal">
                  <div className="font-medium text-slate-700">Complete without contact</div>
                  <div className="text-xs text-slate-500 font-normal mt-1 leading-snug">
                    This will not update Last Contacted and the contact may receive another follow-up reminder.
                  </div>
                </div>
              </Button>
            </div>
          </>
        ) : (
          // STEP 2: Optional Notes
          <>
            <DialogHeader className="pb-4 border-b">
              <div className="flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 -ml-2 text-slate-500 hover:text-slate-900 shrink-0"
                  onClick={() => setSelectedMethod(null)}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-2">
                  {methodDetails[selectedMethod].icon}
                  <DialogTitle>{methodDetails[selectedMethod].title}</DialogTitle>
                </div>
              </div>
            </DialogHeader>

            <div className="py-4 space-y-5">
              {/* Info Card */}
              <div className="bg-blue-50/50 text-blue-800 border border-blue-100 rounded-lg p-3 flex gap-3 text-sm">
                <Info className="h-5 w-5 shrink-0 text-blue-500" />
                <p>These notes will be saved to the contact timeline and can be referenced later.</p>
              </div>

              {/* Form Section */}
              <div className="space-y-2">
                <label className="block mb-3 text-sm font-medium text-slate-700">
                  {methodDetails[selectedMethod].label} <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={methodDetails[selectedMethod].placeholder}
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                  autoFocus
                />
              </div>

              {/* Helper Text */}
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Lock className="h-3.5 w-3.5 shrink-0" />
                <p>Your notes are private and only visible to you.</p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 pt-2 border-t mt-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                Save Activity
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
