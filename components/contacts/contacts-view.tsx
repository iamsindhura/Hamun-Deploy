"use client";

import { useState } from "react";
import { DataTable, Contact } from "./data-table";
import { ContactSheet } from "./contact-sheet";
import { Button } from "@/components/ui/button";
import { Plus, Archive, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContactsViewProps {
  initialData: Contact[];
}

export function ContactsView({ initialData }: ContactsViewProps) {
  const [open, setOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | undefined>();
  const [view, setView] = useState<"active" | "archived">("active");

  const handleAdd = () => {
    setEditingContact(undefined);
    setOpen(true);
  };

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
    setOpen(true);
  };

  const filteredData = initialData.filter(c => 
    view === "active" ? !c.isArchived : c.isArchived
  );

  return (
    <div className="flex-1 space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Contacts</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manage your customer database and interaction history.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setView("active")}
              className={cn(
                "flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
                view === "active" 
                  ? "bg-white dark:bg-slate-800 text-purple-600 shadow-sm" 
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              <Users className="w-4 h-4" />
              Active
            </button>
            <button
              onClick={() => setView("archived")}
              className={cn(
                "flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
                view === "archived" 
                  ? "bg-white dark:bg-slate-800 text-purple-600 shadow-sm" 
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              <Archive className="w-4 h-4" />
              Archived
            </button>
          </div>

          <Button onClick={handleAdd} className="bg-purple-600 hover:bg-purple-700 rounded-xl">
            <Plus className="mr-2 h-4 w-4" /> Add Contact
          </Button>
        </div>
      </div>
      
      <DataTable data={filteredData} onEdit={handleEdit} />
      
      <ContactSheet 
        open={open} 
        onOpenChange={setOpen} 
        contact={editingContact} 
      />
    </div>
  );
}
