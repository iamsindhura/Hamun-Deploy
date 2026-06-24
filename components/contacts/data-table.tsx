"use client";

import * as React from "react";
import {
 ColumnDef,
 ColumnFiltersState,
 SortingState,
 VisibilityState,
 flexRender,
 getCoreRowModel,
 getFilteredRowModel,
 getPaginationRowModel,
 getSortedRowModel,
 useReactTable,
} from "@tanstack/react-table";
import {
 ArrowUpDown,
 ChevronDown,
 MoreHorizontal,
 MessageSquare,
 Trash2,
 Edit,
 ExternalLink,
 Archive,
 ArchiveRestore
} from "lucide-react";
import { cn } from "@/lib/utils";

import { Button, buttonVariants } from "@/components/ui/button";
import {
 DropdownMenu,
 DropdownMenuCheckboxItem,
 DropdownMenuContent,
 DropdownMenuGroup,
 DropdownMenuItem,
 DropdownMenuLabel,
 DropdownMenuSeparator,
 DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
 Table,
 TableBody,
 TableCell,
 TableHead,
 TableHeader,
 TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Stage, Priority } from "@prisma/client";
import { logContact, toggleArchive } from "@/app/actions/contacts";
import { toast } from "sonner";
import { format } from "date-fns";

export interface Contact {
 id: string;
 name: string;
 email: string | null;
 phone: string | null;

 company?: string | null;
 linkedin?: string | null;
 contactType?: string | null;
 relationshipScore?: number;
 interests?: string[];

 stage: Stage;
 moneyValue: number | any;
 priority: Priority;
 source: string | null;
 followUpCount: number;
 lastContactedAt: Date | null;
 lastUpdated: Date;
 isArchived: boolean;
 createdAt: Date;
}

interface DataTableProps {
 data: Contact[];
 onEdit: (contact: Contact) => void;
}

export function DataTable({ data, onEdit }: DataTableProps) {
 const [sorting, setSorting] = React.useState<SortingState>([]);
 const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
 const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
 const [rowSelection, setRowSelection] = React.useState({});
 const [globalFilter, setGlobalFilter] = React.useState("");

 const columns: ColumnDef<Contact>[] = [
 {
 accessorKey: "name",
 header: ({ column }) => {
 return (
 <Button
 variant="ghost"
 onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
 >
 Name
 <ArrowUpDown className="ml-2 h-4 w-4" />
 </Button>
 );
 },
 cell: ({ row }) => {
 const contact = row.original;
 return (
 <button
 onClick={() => onEdit(contact)}
 className="font-semibold text-purple-600 hover:text-purple-700 hover:underline px-4 transition-all"
 >
 {row.getValue("name")}
 </button>
 );
 },
 },
 {
 accessorKey: "contactType",
 header: "Type",
 cell: ({ row }) => (
 <Badge variant="outline">
 {row.original.contactType || "OTHER"}
 </Badge>
 ),
 },
 {
 accessorKey: "company",
 header: "Company",
 cell: ({ row }) => (
 <div>{row.original.company || "-"}</div>
 ),
 },
 {
 accessorKey: "stage",
 header: "Stage",
 cell: ({ row }) => {
 const stage = row.getValue("stage") as Stage;
 return (
 <Badge
 variant={
 stage === "CUSTOMER"
 ? "default"
 : stage === "LEAD"
 ? "outline"
 : stage === "POTENTIAL"
 ? "secondary"
 : "destructive"
 }
 >
 {stage}
 </Badge>
 );
 },
 },
 {
 accessorKey: "priority",
 header: "Priority",
 cell: ({ row }) => {
 const priority = row.getValue("priority") as Priority;
 return (
 <Badge
 className={
 priority === "HIGH"
 ? "bg-red-100 text-red-700 border-red-200"
 : priority === "MEDIUM"
 ? "bg-yellow-100 text-yellow-700 border-yellow-200"
 : "bg-green-100 text-green-700 border-green-200"
 }
 >
 {priority}
 </Badge>
 );
 },
 },
 {
 accessorKey: "moneyValue",

 header: ({ column }) => (
 <Button
 variant="ghost"
 className="p-0 h-auto font-medium"
 onClick={() =>
 column.toggleSorting(column.getIsSorted() === "asc")
 }
 >
 Value (₹)
 <ArrowUpDown className="ml-2 h-4 w-4" />
 </Button>
 ),

 cell: ({ row }) => {
 const amount = parseFloat(row.getValue("moneyValue"));

 const formatted = new Intl.NumberFormat("en-IN", {
 style: "currency",
 currency: "INR",
 minimumFractionDigits: 0,
 maximumFractionDigits: 0,
 }).format(amount);

 return (
 <div className="font-medium">
 {formatted}
 </div>
 );
 },
 },
 {
 accessorKey: "lastUpdated",
 header: "Last Updated",
 cell: ({ row }) => {
 const date = row.getValue("lastUpdated") as Date;
 return <div>{format(new Date(date), "MMM d, yyyy")}</div>;
 },
 },
 {
 id: "actions",
 enableHiding: false,
 cell: ({ row }) => {
 const contact = row.original;

 const handleWhatsApp = async () => {
 if (!contact.phone) {
 toast.error("No phone number provided");
 return;
 }
 const cleanPhone = contact.phone.replace(/\D/g, "");
 const text = encodeURIComponent("Hi, following up on our conversation.");
 window.open(`https://wa.me/${cleanPhone}?text=${text}`, "_blank");
 await logContact(contact.id);
 };

 const handleArchive = async () => {
 const res = await toggleArchive(contact.id);
 if (res.success) {
 toast.success(contact.isArchived ? "Contact restored" : "Contact archived");
 } else {
 toast.error("Failed to update status");
 }
 };

 return (
 <div className="flex items-center gap-2">
 <Button
 variant="ghost"
 size="icon"
 onClick={handleWhatsApp}
 title="WhatsApp"
 className="h-8 w-8 text-green-600 hover:bg-green-50"
 >
 <MessageSquare className="h-4 w-4" />
 </Button>
 <Button
 variant="ghost"
 size="icon"
 onClick={handleArchive}
 title={contact.isArchived ? "Restore" : "Archive"}
 className={cn("h-8 w-8", contact.isArchived ? "text-blue-600 hover:bg-blue-50" : "text-slate-600 hover:bg-slate-50")}
 >
 {contact.isArchived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
 </Button>
 </div>
 );
 },
 },
 ];

 const table = useReactTable({
 data,
 columns,
 onSortingChange: setSorting,
 onColumnFiltersChange: setColumnFilters,
 onGlobalFilterChange: setGlobalFilter,
 globalFilterFn: (row, columnId, filterValue) => {
 const search = filterValue.toLowerCase();
 const name = (row.original.name || "").toLowerCase();
 const email = (row.original.email || "").toLowerCase();
 const phone = (row.original.phone || "").toLowerCase();
 return name.includes(search) || email.includes(search) || phone.includes(search);
 },
 getCoreRowModel: getCoreRowModel(),
 getPaginationRowModel: getPaginationRowModel(),
 getSortedRowModel: getSortedRowModel(),
 getFilteredRowModel: getFilteredRowModel(),
 onColumnVisibilityChange: setColumnVisibility,
 onRowSelectionChange: setRowSelection,
 state: {
 sorting,
 columnFilters,
 globalFilter,
 columnVisibility,
 rowSelection,
 },
 });

 return (
 <div className="w-full">
 <div className="flex flex-col sm:flex-row items-stretch sm:items-center py-4 gap-4">
 <Input
 placeholder="Filter by name, email or phone..."
 value={globalFilter ?? ""}
 onChange={(event) => setGlobalFilter(event.target.value)}
 className="w-full sm:max-w-sm"
 />
 <DropdownMenu>
 <DropdownMenuTrigger className={cn(buttonVariants({ variant: "outline" }), "sm:ml-auto")}>
 Columns <ChevronDown className="ml-2 h-4 w-4" />
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end">
 {table
 .getAllColumns()
 .filter((column) => column.getCanHide())
 .map((column) => {
 return (
 <DropdownMenuCheckboxItem
 key={column.id}
 className="capitalize"
 checked={column.getIsVisible()}
 onCheckedChange={(value) => column.toggleVisibility(!!value)}
 >
 {column.id}
 </DropdownMenuCheckboxItem>
 );
 })}
 </DropdownMenuContent>
 </DropdownMenu>
 </div>
 <div className="rounded-md border overflow-x-auto w-full">
 <Table>
 <TableHeader>
 {table.getHeaderGroups().map((headerGroup) => (
 <TableRow key={headerGroup.id}>
 {headerGroup.headers.map((header) => {
 return (
 <TableHead key={header.id}>
 {header.isPlaceholder
 ? null
 : flexRender(
 header.column.columnDef.header,
 header.getContext()
 )}
 </TableHead>
 );
 })}
 </TableRow>
 ))}
 </TableHeader>
 <TableBody>
 {table.getRowModel().rows?.length ? (
 table.getRowModel().rows.map((row) => (
 <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
 {row.getVisibleCells().map((cell) => (
 <TableCell key={cell.id}>
 {flexRender(cell.column.columnDef.cell, cell.getContext())}
 </TableCell>
 ))}
 </TableRow>
 ))
 ) : (
 <TableRow>
 <TableCell colSpan={columns.length} className="h-24 text-center">
 No contacts found.
 </TableCell>
 </TableRow>
 )}
 </TableBody>
 </Table>
 </div>
 <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
 <div className="text-sm text-muted-foreground text-center sm:text-left">
 {table.getFilteredSelectedRowModel().rows.length} of{" "}
 {table.getFilteredRowModel().rows.length} row(s) selected.
 </div>
 <div className="space-x-2 shrink-0">
 <Button
 variant="outline"
 size="sm"
 onClick={() => table.previousPage()}
 disabled={!table.getCanPreviousPage()}
 >
 Previous
 </Button>
 <Button
 variant="outline"
 size="sm"
 onClick={() => table.nextPage()}
 disabled={!table.getCanNextPage()}
 >
 Next
 </Button>
 </div>
 </div>
 </div>
 );
}
