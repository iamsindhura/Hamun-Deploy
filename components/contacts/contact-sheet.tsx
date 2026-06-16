"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contactSchema, type ContactInput } from "@/lib/validations";
import { createContact, updateContact } from "@/app/actions/contacts";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Lightbulb } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Stage, Priority, ActivityType, TaskPriority } from "@prisma/client";
import { useEffect, useState, useCallback } from "react";
import { getActivities, createActivity } from "@/app/actions/activities";
import { getProjects } from "@/app/actions/projects";
import { createTask } from "@/app/actions/tasks";
import { ActivityTimeline } from "./activity-timeline";
import {
  UserPlus,
  UserPen,
  Mail,
  Phone,
  User,
  Building2,
  IndianRupee,
  AlignLeft,
  BriefcaseBusiness,
  AlertCircle,
  Save,
  X,
  RefreshCw,
  MessageSquare,
  Calendar,
  Contact as ContactIcon,
  Tag
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ContactSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact?: any; // If provided, we are in Edit mode
  initialTab?: "profile" | "timeline";
}
function calculateRelationshipScore(contact: any) {
  let score = 50;

  score += Math.min((contact?.followUpCount || 0) * 2, 20);

  if (contact?.lastContactedAt) {
    const days =
      Math.floor(
        (Date.now() -
          new Date(contact.lastContactedAt).getTime()) /
        (1000 * 60 * 60 * 24)
      );

    if (days <= 7) score += 20;
    else if (days <= 30) score += 10;
    else score -= 15;
  }

  if (contact?.linkedin) score += 5;

  if (contact?.company) score += 5;

  return Math.max(0, Math.min(100, score));
}
function getRelationshipHealth(score: number) {

  if (score >= 80) {
    return "🟢 Strong";
  }

  if (score >= 60) {
    return "🟡 Good";
  }

  if (score >= 40) {
    return "🟠 Weak";
  }

  return "🔴 Cold";
}
function getSuggestedAction(contact: any) {

  if (!contact) {
    return "No recommendation available";
  }

  if (!contact.lastContactedAt) {
    return "Make first contact";
  }

  const days =
    Math.floor(
      (Date.now() -
        new Date(contact.lastContactedAt).getTime()) /
      (1000 * 60 * 60 * 24)
    );

  if (days > 30) {
    return "Reconnect immediately";
  }

  if (days > 14) {
    return "Schedule a follow-up";
  }

  if (contact.contactType === "MENTOR") {
    return "Schedule mentor catch-up this week";
  }

  if (contact.contactType === "INVESTOR") {
    return "Send an investor progress update";
  }

  if (contact.contactType === "CLIENT") {
    return "Check project progress  and next steps";
  }

  if (contact.followUpCount < 3) {
    return "Strengthen relationship";
  }

  return "Maintain regular contact";
}
export function ContactSheet({ open, onOpenChange, contact, initialTab = "profile" }: ContactSheetProps) {
  const isEdit = !!contact;
  const [activities, setActivities] = useState<any[]>([]);
  const [isLogging, setIsLogging] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [activityType, setActivityType] = useState<ActivityType>(ActivityType.NOTE);
  const [activeTab, setActiveTab] =
    useState<"profile" | "timeline" | "insights">(initialTab as any); const [tagInput, setTagInput] = useState("");

  const [projects, setProjects] = useState<any[]>([]);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [taskProjectId, setTaskProjectId] = useState("");
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);

  const fetchProjects = useCallback(async () => {
    try {
      const data = await getProjects();
      if (data.success && data.data) {
        setProjects(data.data);
        if (data.data.length > 0) setTaskProjectId(data.data[0].id);
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    }
  }, []);

  useEffect(() => {
    if (open) {
      setActiveTab(initialTab);
      fetchProjects();
    }
  }, [open, initialTab, fetchProjects]);

  async function handleCreateTask() {
    if (!contact?.id || !taskProjectId) return;
    setIsSubmittingTask(true);
    
    const suggested = getSuggestedAction(contact);
    
    // Default due date to today
    const dueDate = new Date();

    const result = await createTask({
      title: suggested,
      projectId: taskProjectId,
      contactId: contact.id,
      dueDate,
      priority: TaskPriority.MEDIUM,
      position: 0,
    });
    
    setIsSubmittingTask(false);
    
    if (result.success) {
      toast.success("Task created");
      setIsCreatingTask(false);
    } else {
      toast.error(result.error || "Failed to create task");
    }
  }

  const fetchActivities = useCallback(async () => {
    if (contact?.id) {
      try {
        const data = await getActivities(contact.id);
        setActivities(data);
      } catch (error) {
        console.error("Failed to fetch activities:", error);
      }
    }
  }, [contact?.id]);

  useEffect(() => {
    if (open && isEdit) {
      fetchActivities();
    }
  }, [open, isEdit, fetchActivities]);
  const form = useForm<ContactInput>({
    resolver: zodResolver(contactSchema) as any,
    defaultValues: {
      name: "",
      email: "",
      company: "",
      linkedin: "",
      contactType: "OTHER",
      relationshipScore: 50,
      interests: [],
      phone: "",
      stage: Stage.LEAD,
      priority: Priority.MEDIUM,
      moneyValue: 0,
      notes: "",
      source: "",
      tags: [],
    },
  });

  const contactName = form.watch("name") || contact?.name || "New Contact";

  // Reset form when contact changes
  useEffect(() => {
    if (contact) {
      form.reset({
        name: contact.name,
        email: contact.email || "",
        phone: contact.phone || "",
        stage: contact.stage,
        priority: contact.priority,
        moneyValue: Number(contact.moneyValue),
        notes: contact.notes || "",
        source: contact.source || "",
        tags: contact.tags || [],
      });
    } else {
      form.reset({
        name: "",
        email: "",
        phone: "",
        stage: Stage.LEAD,
        priority: Priority.MEDIUM,
        moneyValue: 0,
        notes: "",
        source: "",
        tags: [],
      });
    }
  }, [contact, form]);

  async function onSubmit(values: ContactInput) {
    const result = isEdit
      ? await updateContact(contact.id, values)
      : await createContact(values);

    if (result.success) {
      toast.success(isEdit ? "Contact updated" : "Contact created");
      onOpenChange(false);
      if (!isEdit) form.reset();
    } else {
      toast.error(result.error || "Something went wrong");
    }
  }

  async function handleLogActivity() {
    if (!newComment.trim() || !contact?.id) return;

    setIsLogging(true);
    const result = await createActivity(contact.id, activityType, newComment);
    setIsLogging(false);

    if (result.success) {
      toast.success("Activity logged");
      setNewComment("");
      fetchActivities();
    } else {
      toast.error(result.error || "Failed to log activity");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl w-[95vw] max-h-[90vh] overflow-hidden border-0 shadow-2xl rounded-3xl p-0 flex flex-col bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl">
        {/* Enhanced Header */}
        <DialogHeader className="p-6 pb-2 border-b bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 relative overflow-hidden z-10 shrink-0">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 dark:bg-primary/5 rounded-bl-full -mr-8 -mt-8" />
          <div className="flex items-center gap-4 relative mb-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary/80 shadow-inner">
              <ContactIcon className="w-6 h-6" />
            </div>
            <div className="text-left">
              <DialogTitle className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100 truncate max-w-[400px]">
                {isEdit ? contactName : "Add New Contact"}
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {isEdit
                  ? `Managing relationship with ${contactName}`
                  : "Enter details to create a new CRM record."}
              </DialogDescription>
            </div>
          </div>

          {/* Tab Switcher */}
          {isEdit && (
            <div className="flex items-center gap-1 p-1 bg-slate-100/50 dark:bg-slate-900/50 rounded-xl w-fit">
              <button
                type="button"
                onClick={() => setActiveTab("profile")}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
                  activeTab === "profile"
                    ? "bg-white dark:bg-slate-800 text-primary shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                Profile
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("timeline")}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
                  activeTab === "timeline"
                    ? "bg-white dark:bg-slate-800 text-primary shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                Timeline
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("insights")}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
                  activeTab === "insights"
                    ? "bg-white dark:bg-slate-800 text-primary shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                Insights
              </button>
            </div>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <Form {...(form as any)}>
            <form id="contact-form" onSubmit={form.handleSubmit(onSubmit)} className="p-6">

              {activeTab === "profile" ? (
                <div className="space-y-6">
                  {/* Section 1: Basic Information */}
                  <div className="space-y-4 bg-slate-50/50 dark:bg-slate-900/30 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
                    <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-slate-800 dark:text-slate-200">
                      <User className="w-4 h-4 text-primary" />
                      <span>Basic Profile</span>
                    </div>

                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-600 dark:text-slate-400">Full Name</FormLabel>
                          <FormControl>
                            <Input className="bg-white dark:bg-slate-950 focus-visible:ring-primary" placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                              <Mail className="w-3 h-3" /> Email
                            </FormLabel>
                            <FormControl>
                              <Input className="bg-white dark:bg-slate-950 focus-visible:ring-primary" placeholder="john@example.com" type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                              <Phone className="w-3 h-3" /> Phone
                            </FormLabel>
                            <FormControl>
                              <Input className="bg-white dark:bg-slate-950 focus-visible:ring-primary" placeholder="+1234567890" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">

                      <FormField
                        control={form.control}
                        name="company"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Microsoft"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="linkedin"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>LinkedIn</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="https://linkedin.com/in/username"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                    </div>
                  </div>
                  {/* Relationship Details */}

                  <div className="space-y-4 bg-primary/5 dark:bg-primary/10 p-5 rounded-2xl border border-primary/20">

                    <div className="flex items-center gap-2 mb-4 text-sm font-semibold">
                      <span>Relationship Details</span>
                    </div>

                    <FormField
                      control={form.control}
                      name="contactType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Type</FormLabel>

                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select Type" />
                              </SelectTrigger>
                            </FormControl>

                            <SelectContent>
                              <SelectItem value="FRIEND">Friend</SelectItem>
                              <SelectItem value="MENTOR">Mentor</SelectItem>
                              <SelectItem value="PROFESSOR">Professor</SelectItem>
                              <SelectItem value="INVESTOR">Investor</SelectItem>
                              <SelectItem value="CLIENT">Client</SelectItem>
                              <SelectItem value="TEAM_MEMBER">Team Member</SelectItem>
                              <SelectItem value="OTHER">Other</SelectItem>
                            </SelectContent>

                          </Select>

                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="interests"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                            <Tag className="w-3 h-3" /> Interests
                          </FormLabel>

                          <FormControl>
                            <div className="space-y-2">

                              {(field.value?.length || 0) > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {field.value?.map((interest: string, index: number) => (
                                    <Badge
                                      key={index}
                                      variant="secondary"
                                      className="px-2 py-1 flex items-center gap-1 text-xs"
                                    >
                                      {interest}

                                      <button
                                        type="button"
                                        className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                                        onClick={() => {
                                          const newInterests = [...(field.value || [])];
                                          newInterests.splice(index, 1);
                                          field.onChange(newInterests);
                                        }}
                                      >
                                        <X className="w-3 h-3" />
                                      </button>

                                    </Badge>
                                  ))}
                                </div>
                              )}

                              <Input
                                placeholder={
                                  (field.value?.length || 0) >= 3
                                    ? "Maximum interests reached"
                                    : "Type an interest and press Enter..."
                                }
                                value={tagInput}
                                disabled={(field.value?.length || 0) >= 3}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === ",") {
                                    e.preventDefault();

                                    const newInterest = tagInput.trim();

                                    if (
                                      newInterest &&
                                      (field.value?.length || 0) < 3 &&
                                      !field.value?.includes(newInterest)
                                    ) {
                                      field.onChange([
                                        ...(field.value || []),
                                        newInterest,
                                      ]);

                                      setTagInput("");
                                    }
                                  }
                                }}
                                className="bg-white dark:bg-slate-950 focus-visible:ring-primary"
                              />

                            </div>
                          </FormControl>

                          <FormMessage />
                        </FormItem>
                      )}
                    />

                  </div>

                  {/* Section 2: Pipeline Details */}
                  <div className="space-y-4 bg-primary/5 dark:bg-primary/10 p-5 rounded-2xl border border-primary/20 dark:border-primary/20 shadow-sm transition-all hover:shadow-md">
                    <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-slate-800 dark:text-slate-200">
                      <BriefcaseBusiness className="w-4 h-4 text-primary" />
                      <span>Pipeline Details</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="stage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-600 dark:text-slate-400">Stage</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-white dark:bg-slate-950 focus:ring-primary">
                                  <SelectValue placeholder="Select stage" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Object.values(Stage).map((stage) => (
                                  <SelectItem key={stage} value={stage}>
                                    <div className="flex items-center gap-2">
                                      <div className={`w-2 h-2 rounded-full ${stage === 'CUSTOMER' ? 'bg-green-500' :
                                        stage === 'LEAD' ? 'bg-blue-500' :
                                          stage === 'POTENTIAL' ? 'bg-yellow-500' : 'bg-red-500'
                                        }`} />
                                      {stage.charAt(0) + stage.slice(1).toLowerCase()}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="priority"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-600 dark:text-slate-400">Priority</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-white dark:bg-slate-950 focus:ring-primary">
                                  <SelectValue placeholder="Select priority" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Object.values(Priority).map((priority) => (
                                  <SelectItem key={priority} value={priority}>
                                    <div className="flex items-center gap-2">
                                      <AlertCircle className={`w-3.5 h-3.5 ${priority === 'HIGH' ? 'text-red-500' :
                                        priority === 'MEDIUM' ? 'text-yellow-500' : 'text-green-500'
                                        }`} />
                                      {priority.charAt(0) + priority.slice(1).toLowerCase()}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="moneyValue"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                              <IndianRupee className="w-3 h-3" /> Value
                            </FormLabel>
                            <FormControl>
                              <Input className="bg-white dark:bg-slate-950 focus-visible:ring-primary font-medium" type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="source"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                              <Building2 className="w-3 h-3" /> Source
                            </FormLabel>
                            <FormControl>
                              <Input className="bg-white dark:bg-slate-950 focus-visible:ring-primary" placeholder="e.g. LinkedIn" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Section 3: Extra */}
                  <div className="space-y-4 bg-slate-50/50 dark:bg-slate-900/30 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
                    <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-slate-800 dark:text-slate-200">
                      <Tag className="w-4 h-4 text-primary" />
                      <span>Additional Info</span>
                    </div>

                    <FormField
                      control={form.control}
                      name="tags"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                            <Tag className="w-3 h-3" /> Tags (Max 3)
                          </FormLabel>
                          <FormControl>
                            <div className="space-y-2">
                              {field.value.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {field.value.map((tag: string, index: number) => (
                                    <Badge key={index} variant="secondary" className="px-2 py-1 flex items-center gap-1 text-xs">
                                      {tag}
                                      <button
                                        type="button"
                                        className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                                        onClick={() => {
                                          const newTags = [...field.value];
                                          newTags.splice(index, 1);
                                          field.onChange(newTags);
                                        }}
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </Badge>
                                  ))}
                                </div>
                              )}
                              <Input
                                placeholder={field.value.length >= 3 ? "Maximum tags reached" : "Type a tag and press Enter or Comma..."}
                                value={tagInput}
                                disabled={field.value.length >= 3}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ',') {
                                    e.preventDefault();
                                    const newTag = tagInput.trim();
                                    if (newTag && field.value.length < 3 && !field.value.includes(newTag)) {
                                      field.onChange([...field.value, newTag]);
                                      setTagInput("");
                                    }
                                  }
                                }}
                                className="bg-white dark:bg-slate-950 focus-visible:ring-primary"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                            <AlignLeft className="w-3 h-3" /> General Notes
                          </FormLabel>
                          <FormControl>
                            <textarea
                              className="flex min-h-[80px] w-full rounded-xl border border-slate-200 bg-white dark:bg-slate-950 dark:border-slate-800 px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                              placeholder="General info about this contact..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ) : activeTab === "timeline" ? (
                /* Timeline View */
                <div className="space-y-6">
                  {/* Quick Log Input */}
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                      {[ActivityType.NOTE, ActivityType.CALL, ActivityType.EMAIL, ActivityType.MEETING].map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setActivityType(type)}
                          className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0",
                            activityType === type
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-primary/50"
                          )}
                        >
                          {type === ActivityType.NOTE && <MessageSquare className="w-3 h-3" />}
                          {type === ActivityType.CALL && <Phone className="w-3 h-3" />}
                          {type === ActivityType.EMAIL && <Mail className="w-3 h-3" />}
                          {type === ActivityType.MEETING && <Calendar className="w-3 h-3" />}
                          {type.charAt(0) + type.slice(1).toLowerCase()}
                        </button>
                      ))}
                    </div>

                    <div className="relative">
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder={`Log a ${activityType.toLowerCase()}...`}
                        className="flex min-h-[60px] w-full rounded-xl border border-slate-200 bg-white dark:bg-slate-950 dark:border-slate-800 px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary transition-colors resize-none"
                      />
                      <Button
                        type="button"
                        size="sm"
                        disabled={!newComment.trim() || isLogging}
                        onClick={handleLogActivity}
                        className="absolute bottom-2 right-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3"
                      >
                        {isLogging ? "Logging..." : "Log"}
                      </Button>
                    </div>
                  </div>

                  {/* Timeline Render */}
                  <div className="px-2">
                    <ActivityTimeline activities={activities} />
                  </div>
                </div>

              ) : (

                <div className="space-y-6">

                  {/* Relationship Insights */}
                  <div className="bg-slate-50 dark:bg-slate-900/30 p-5 rounded-2xl border">

                    <h3 className="text-lg font-semibold mb-4">
                      Relationship Insights
                    </h3>


                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm text-slate-500">
                          Relationship Score
                        </p>

                        <p className="text-3xl font-bold">
                          {calculateRelationshipScore(contact)} / 100
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-slate-500">
                          Relationship Health
                        </p>

                        <p className="text-2xl font-bold">
                          {getRelationshipHealth(
                            calculateRelationshipScore(contact)
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">
                          Follow Up Count
                        </p>

                        <p className="text-3xl font-bold">
                          {contact?.followUpCount ?? 0}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-slate-500">
                          Last Contact
                        </p>

                        <p className="text-3xl font-bold">
                          {contact?.lastContactedAt
                            ? formatDistanceToNow(
                              new Date(contact.lastContactedAt),
                              { addSuffix: true }
                            )
                            : "Never"}
                        </p>
                      </div>

                    </div>

                  </div>

                  {/* Suggested Action */}
                  <div className="bg-primary/5 p-5 rounded-2xl border">

                    <h3 className="text-lg font-semibold mb-2 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Lightbulb className="w-5 h-5 text-yellow-500" />
                        Suggested Action
                      </div>
                      {contact && (
                        <Button type="button" size="sm" variant="outline" onClick={() => setIsCreatingTask(!isCreatingTask)}>
                          {isCreatingTask ? "Cancel" : "Create Task"}
                        </Button>
                      )}
                    </h3>

                    <p className="text-slate-700 dark:text-slate-300">
                      {getSuggestedAction(contact)}
                    </p>
                    
                    {isCreatingTask && (
                      <div className="mt-4 pt-4 border-t border-primary/10 space-y-3">
                        <div className="grid gap-2">
                          <label className="text-xs font-semibold text-slate-500">Add to Project</label>
                          <Select value={taskProjectId} onValueChange={setTaskProjectId}>
                            <SelectTrigger className="bg-white dark:bg-slate-950">
                              <SelectValue placeholder="Select a project">
                                {projects.find((p) => p.id === taskProjectId)?.name || "Select a project"}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {projects.map((p) => (
                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                              ))}
                              {projects.length === 0 && (
                                <SelectItem value="none" disabled>No projects found</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button type="button" onClick={handleCreateTask} disabled={isSubmittingTask || !taskProjectId || taskProjectId === "none"} className="w-full">
                          {isSubmittingTask ? "Creating..." : "Confirm Task"}
                        </Button>
                      </div>
                    )}
                  </div>

                </div>

              )}
            </form>
          </Form>
        </div>

        {/* Enhanced Footer */}
        <div className="p-6 border-t bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-sm z-10 flex justify-end gap-3 shrink-0">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800">
            <X className="w-4 h-4 mr-2" /> {activeTab === "profile" ? "Cancel" : "Close"}
          </Button>
          {activeTab === "profile" && (
            <Button
              form="contact-form"
              type="submit"
              disabled={form.formState.isSubmitting}
              className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-500/20"
            >
              <Save className="w-4 h-4 mr-2" />
              {form.formState.isSubmitting ? "Saving..." : isEdit ? "Save Changes" : "Create Contact"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
