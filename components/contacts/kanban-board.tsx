"use client";

import React, { useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects,
  DropAnimation,
  useDroppable,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Stage, Priority } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, MessageSquare, Phone } from "lucide-react";
import { changeStage, logContact } from "@/app/actions/contacts";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ContactSheet } from "./contact-sheet";

interface KanbanContact {
  id: string;
  name: string;
  moneyValue: number;
  priority: Priority;
  phone: string | null;
  stage: Stage;
}

interface KanbanBoardProps {
  initialData: KanbanContact[];
}

const STAGES: Stage[] = ["LEAD", "POTENTIAL", "CUSTOMER", "REJECTED"];

export function KanbanBoard({ initialData }: KanbanBoardProps) {
  const [contacts, setContacts] = useState(initialData);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedContact, setSelectedContact] = useState<KanbanContact | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  React.useEffect(() => {
    setContacts(initialData);
  }, [initialData]);

  const handleCardClick = (contact: KanbanContact) => {
    setSelectedContact(contact);
    setIsSheetOpen(true);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeContact = contacts.find((c) => c.id === active.id);
    const overId = over.id as string;

    // Check if dropped over a column (stage) or another card
    let newStage: Stage | null = null;
    if (STAGES.includes(overId as Stage)) {
      newStage = overId as Stage;
    } else {
      const overContact = contacts.find((c) => c.id === overId);
      if (overContact) newStage = overContact.stage;
    }

    if (activeContact && newStage && activeContact.stage !== newStage) {
      // Optimistic UI update
      setContacts((prev) =>
        prev.map((c) => (c.id === active.id ? { ...c, stage: newStage! } : c))
      );

      const res = await changeStage(active.id as string, newStage);
      if (!res.success) {
        toast.error("Failed to update stage");
        // Rollback on error
        setContacts(initialData);
      } else {
        toast.success(`Moved to ${newStage}`);
      }
    }

    setActiveId(null);
  };

  const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: "0.5",
        },
      },
    }),
  };

  return (
    <DndContext
      id="contacts-dnd-context"
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full gap-4 overflow-x-auto pb-4">
        {STAGES.map((stage) => (
          <KanbanColumn
            key={stage}
            id={stage}
            title={stage}
            contacts={contacts.filter((c) => c.stage === stage)}
            onCardClick={handleCardClick}
          />
        ))}
      </div>
      <DragOverlay dropAnimation={dropAnimation}>
        {activeId ? (
          <KanbanCard
            contact={contacts.find((c) => c.id === activeId)!}
            isOverlay
          />
        ) : null}
      </DragOverlay>

      <ContactSheet 
        open={isSheetOpen} 
        onOpenChange={setIsSheetOpen} 
        contact={selectedContact}
        initialTab="timeline"
      />
    </DndContext>
  );
}

const STAGE_COLORS: Record<string, { bg: string, border: string, text: string }> = {
  LEAD: { bg: "bg-blue-50/80", border: "border-t-blue-500", text: "text-blue-700" },
  POTENTIAL: { bg: "bg-amber-50/80", border: "border-t-amber-500", text: "text-amber-800" },
  CUSTOMER: { bg: "bg-emerald-50/80", border: "border-t-emerald-500", text: "text-emerald-700" },
  REJECTED: { bg: "bg-rose-50/80", border: "border-t-rose-500", text: "text-rose-700" },
};

function KanbanColumn({ id, title, contacts, onCardClick }: { id: string, title: string, contacts: KanbanContact[], onCardClick: (c: KanbanContact) => void }) {
  const colors = STAGE_COLORS[id] || { bg: "bg-slate-50", border: "border-t-slate-500", text: "text-slate-700" };
  const { setNodeRef } = useDroppable({ id });

  return (
    <div 
      ref={setNodeRef}
      className={cn("flex w-80 shrink-0 flex-col gap-4 rounded-xl border-t-[4px] p-4 shadow-sm", colors.bg, colors.border)}
    >
      <div className="flex items-center justify-between">
        <h3 className={cn("font-bold tracking-wide", colors.text)}>{title}</h3>
        <Badge variant="outline" className={cn("bg-white shadow-sm font-semibold", colors.text)}>
          {contacts.length}
        </Badge>
      </div>
      <SortableContext items={contacts.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-1 flex-col gap-3">
          {contacts.map((contact) => (
            <KanbanCard key={contact.id} contact={contact} onClick={() => onCardClick(contact)} />
          ))}
          {contacts.length === 0 && (
            <div className="flex h-24 items-center justify-center rounded-lg border-2 border-dashed border-slate-200 text-sm text-slate-400">
              Drop here
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

function KanbanCard({ contact, isOverlay, onClick }: { contact: KanbanContact; isOverlay?: boolean, onClick?: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: contact.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const handleWhatsApp = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!contact.phone) {
      toast.error("No phone number");
      return;
    }
    const cleanPhone = contact.phone.replace(/\D/g, "");
    window.open(`https://wa.me/${cleanPhone}`, "_blank");
    await logContact(contact.id);
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow",
        isDragging && "opacity-30",
        isOverlay && "rotate-3 scale-105 shadow-xl"
      )}
      onClick={onClick}
      {...attributes}
      {...listeners}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="font-semibold">{contact.name}</p>
            <p className="text-sm font-medium text-slate-500">
              ₹{new Intl.NumberFormat("en-IN").format(contact.moneyValue)}
            </p>
          </div>
          <Badge
            className={cn(
              "text-[10px] px-1.5 py-0",
              contact.priority === "HIGH"
                ? "bg-red-100 text-red-700"
                : contact.priority === "MEDIUM"
                ? "bg-yellow-100 text-yellow-700"
                : "bg-green-100 text-green-700"
            )}
          >
            {contact.priority}
          </Badge>
        </div>
        <div className="mt-4 flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-green-600 hover:bg-green-50 hover:text-green-700"
            onClick={handleWhatsApp}
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
