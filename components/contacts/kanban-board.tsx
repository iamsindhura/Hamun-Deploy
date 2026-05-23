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
    </DndContext>
  );
}

function KanbanColumn({ id, title, contacts }: { id: string, title: string, contacts: KanbanContact[] }) {
  return (
    <div className="flex w-80 shrink-0 flex-col gap-4 rounded-lg bg-slate-50 p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-700">{title}</h3>
        <Badge variant="outline" className="bg-white">
          {contacts.length}
        </Badge>
      </div>
      <SortableContext items={contacts.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-1 flex-col gap-3">
          {contacts.map((contact) => (
            <KanbanCard key={contact.id} contact={contact} />
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

function KanbanCard({ contact, isOverlay }: { contact: KanbanContact; isOverlay?: boolean }) {
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
        "cursor-grab active:cursor-grabbing",
        isDragging && "opacity-30",
        isOverlay && "rotate-3 scale-105 shadow-xl"
      )}
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
