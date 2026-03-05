"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { ArrowLeft, Download, Save, Plus, Trash2, ChevronDown, ChevronRight, Loader2, FileSpreadsheet, Search, X, CheckCircle2, AlertTriangle, Undo2, User, Phone, Mail, Building, Calendar, IndianRupee } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { FlatAnnexurePDF } from "@/lib/pdf/flat-annexure";
import { downloadPDF } from "@/lib/pdf/download";
import { createDocument, fetchRentPaymentsForFlat, exitTenant, reactivateTenant } from "@/lib/actions";
import type { RentPaymentSummary } from "@/lib/actions";
import { exportToExcel } from "@/lib/excel/export";
import { SortableList } from "@/components/shared/sortable-list";

const CONDITIONS = ["Good", "Fair", "Poor", "Damaged", "Missing", "New"];

interface AnnexureItem {
  id: string;
  description: string;
  quantity: number;
  condition: string;
}

interface AnnexureRoom {
  id: string;
  name: string;
  items: AnnexureItem[];
  expanded: boolean;
}

function getDefaultRooms(): AnnexureRoom[] {
  return [
    {
      id: "r1",
      name: "I). Hall & Balcony",
      expanded: true,
      items: [
        { id: "i1", description: "Key for Main Door", quantity: 2, condition: "Good" },
        { id: "i2", description: "Foyer Unit", quantity: 1, condition: "Good" },
        { id: "i3", description: "TV Unit", quantity: 1, condition: "Good" },
        { id: "i4", description: "Curtain Rods", quantity: 3, condition: "Good" },
        { id: "i5", description: "Fans", quantity: 2, condition: "Good" },
        { id: "i6", description: "Lights (LED)", quantity: 4, condition: "Good" },
        { id: "i7", description: "Balcony Door Lock", quantity: 1, condition: "Good" },
      ],
    },
    {
      id: "r2",
      name: "II). Kitchen",
      expanded: false,
      items: [
        { id: "i8", description: "Chimney", quantity: 1, condition: "Good" },
        { id: "i9", description: "Hob / Gas Stove", quantity: 1, condition: "Good" },
        { id: "i10", description: "Kitchen Sink", quantity: 1, condition: "Good" },
        { id: "i11", description: "Water Purifier", quantity: 1, condition: "Good" },
        { id: "i12", description: "Exhaust Fan", quantity: 1, condition: "Good" },
        { id: "i13", description: "Cabinet Handles", quantity: 8, condition: "Good" },
      ],
    },
    {
      id: "r3",
      name: "III). Master Bedroom & Washroom",
      expanded: false,
      items: [
        { id: "i14", description: "Wardrobe", quantity: 1, condition: "Good" },
        { id: "i15", description: "AC with Remote", quantity: 1, condition: "Good" },
        { id: "i16", description: "Geyser", quantity: 1, condition: "Good" },
        { id: "i17", description: "Fan", quantity: 1, condition: "Good" },
        { id: "i18", description: "Curtain Rod", quantity: 1, condition: "Good" },
        { id: "i19", description: "Mirror", quantity: 1, condition: "Good" },
        { id: "i20", description: "Shower Head", quantity: 1, condition: "Good" },
        { id: "i21", description: "Towel Rod", quantity: 1, condition: "Good" },
      ],
    },
    {
      id: "r4",
      name: "IV). Bedroom 2 & Washroom",
      expanded: false,
      items: [
        { id: "i22", description: "Wardrobe", quantity: 1, condition: "Good" },
        { id: "i23", description: "AC with Remote", quantity: 1, condition: "Good" },
        { id: "i24", description: "Geyser", quantity: 1, condition: "Good" },
        { id: "i25", description: "Fan", quantity: 1, condition: "Good" },
        { id: "i26", description: "Curtain Rod", quantity: 1, condition: "Good" },
        { id: "i27", description: "Mirror", quantity: 1, condition: "Good" },
        { id: "i28", description: "Shower Head", quantity: 1, condition: "Good" },
      ],
    },
    {
      id: "r5",
      name: "V). Bedroom 3 & Common Washroom",
      expanded: false,
      items: [
        { id: "i29", description: "Wardrobe", quantity: 1, condition: "Good" },
        { id: "i30", description: "AC with Remote", quantity: 1, condition: "Good" },
        { id: "i31", description: "Fan", quantity: 1, condition: "Good" },
        { id: "i32", description: "Curtain Rod", quantity: 1, condition: "Good" },
        { id: "i33", description: "Geyser (Common WR)", quantity: 1, condition: "Good" },
        { id: "i34", description: "Mirror (Common WR)", quantity: 1, condition: "Good" },
      ],
    },
  ];
}

interface Deduction {
  id: string;
  description: string;
  amount: number;
}

interface FlatOption {
  id: string;
  flat_number: string;
  bhk_type: string;
  carpet_area_sft: number | null;
  owner_id: string;
  owner_name: string;
  tenant_id: string;
  tenant_name: string;
  tenant_phone: string | null;
  tenant_email: string | null;
  tenant_type: string | null;
  occupation_type: string | null;
  company_name: string | null;
  business_name: string | null;
  family_member_count: number | null;
  bachelor_occupant_count: number | null;
  bachelor_gender: string | null;
  lease_start_date: string | null;
  lease_end_date: string | null;
  security_deposit: number;
  monthly_rent: number;
  monthly_maintenance: number;
  monthly_inclusive_rent: number;
}

interface AnnexureContentProps {
  flats: FlatOption[];
}

export function AnnexureContent({ flats }: AnnexureContentProps) {
  const router = useRouter();
  const [selectedFlatId, setSelectedFlatId] = useState("");
  const [flatSearch, setFlatSearch] = useState("");
  const [showFlatDropdown, setShowFlatDropdown] = useState(false);
  const [annexureType, setAnnexureType] = useState<"move_in" | "move_out">("move_out");
  const [annexureDate, setAnnexureDate] = useState(new Date().toISOString().split("T")[0]);
  const [rooms, setRooms] = useState<AnnexureRoom[]>(getDefaultRooms);
  const [saving, setSaving] = useState(false);

  const [deductions, setDeductions] = useState<Deduction[]>([
    { id: "d1", description: "Paint Touchups", amount: 4000 },
    { id: "d2", description: "Deep Cleaning", amount: 3000 },
    { id: "d3", description: "3 AC Servicing", amount: 1800 },
    { id: "d4", description: "Chimney Servicing", amount: 700 },
    { id: "d5", description: "3 Geyser Servicing", amount: 2100 },
  ]);

  const [bankDetails, setBankDetails] = useState({
    account_holder: "",
    bank_name: "",
    account_number: "",
    ifsc: "",
  });

  const [rentPayments, setRentPayments] = useState<RentPaymentSummary[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [exitingTenant, setExitingTenant] = useState(false);
  const [exitCompleted, setExitCompleted] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [undoing, setUndoing] = useState(false);

  const selectedFlat = flats.find((f) => f.id === selectedFlatId);

  // Fetch rent payments when a flat is selected
  useEffect(() => {
    if (!selectedFlatId) {
      setRentPayments([]);
      return;
    }
    setLoadingPayments(true);
    fetchRentPaymentsForFlat(selectedFlatId)
      .then((result) => {
        if (result.success && result.data) {
          setRentPayments(result.data);
        } else if (!result.success) {
          console.error("Failed to fetch rent payments:", result.error);
          toast.error(result.error ?? "Failed to load rent payments");
        }
      })
      .catch((err) => {
        console.error("Rent payments fetch error:", err);
        toast.error("Failed to load rent payments");
      })
      .finally(() => setLoadingPayments(false));
  }, [selectedFlatId]);

  const toggleRoom = (roomId: string) => {
    setRooms((prev) =>
      prev.map((r) => (r.id === roomId ? { ...r, expanded: !r.expanded } : r))
    );
  };

  const updateItem = (roomId: string, itemId: string, field: keyof AnnexureItem, value: string | number) => {
    setRooms((prev) =>
      prev.map((r) =>
        r.id === roomId
          ? {
              ...r,
              items: r.items.map((i) =>
                i.id === itemId ? { ...i, [field]: value } : i
              ),
            }
          : r
      )
    );
  };

  const addItem = (roomId: string) => {
    setRooms((prev) =>
      prev.map((r) =>
        r.id === roomId
          ? {
              ...r,
              items: [
                ...r.items,
                { id: Date.now().toString(), description: "", quantity: 1, condition: "Good" },
              ],
            }
          : r
      )
    );
  };

  const removeItem = (roomId: string, itemId: string) => {
    setRooms((prev) =>
      prev.map((r) =>
        r.id === roomId
          ? { ...r, items: r.items.filter((i) => i.id !== itemId) }
          : r
      )
    );
  };

  const reorderRoomItems = (roomId: string, newItems: AnnexureItem[]) => {
    setRooms((prev) =>
      prev.map((r) => (r.id === roomId ? { ...r, items: newItems } : r))
    );
  };

  const addDeduction = () => {
    setDeductions((prev) => [
      ...prev,
      { id: Date.now().toString(), description: "", amount: 0 },
    ]);
  };

  const removeDeduction = (id: string) => {
    setDeductions((prev) => prev.filter((d) => d.id !== id));
  };

  const updateDeduction = (id: string, field: "description" | "amount", value: string | number) => {
    setDeductions((prev) =>
      prev.map((d) => (d.id === id ? { ...d, [field]: value } : d))
    );
  };

  const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
  const refundAmount = (selectedFlat?.security_deposit || 0) - totalDeductions;
  const totalItems = rooms.reduce((sum, r) => sum + r.items.length, 0);

  const handleExportExcel = async () => {
    if (!selectedFlat) return;
    try {
      // Sheet 1: Room inventory
      const excelData = rooms.flatMap((room) =>
        room.items.map((item) => ({
          room_name: room.name,
          description: item.description,
          quantity: item.quantity,
          condition_move_in: annexureType === "move_in" ? item.condition : "",
          condition_move_out: annexureType === "move_out" ? item.condition : "",
          remarks: "",
        }))
      );

      exportToExcel(excelData, [
        { key: "room_name", label: "Room Name" },
        { key: "description", label: "Item Description" },
        { key: "quantity", label: "Quantity" },
        { key: "condition_move_in", label: "Condition (Move-in)" },
        { key: "condition_move_out", label: "Condition (Move-out)" },
        { key: "remarks", label: "Remarks" },
      ], {
        filename: `flat-annexure-${selectedFlat.flat_number}`,
        sheetName: "Flat Annexure",
      });

      // Sheet 2: Rent payments (separate file for move-out)
      if (annexureType === "move_out" && rentPayments.length > 0) {
        const rentData = rentPayments.map((p, idx) => ({
          slNo: idx + 1,
          month: new Date(p.payment_month).toLocaleDateString("en-IN", { month: "short", year: "numeric" }),
          paid_on: new Date(p.payment_date).toLocaleDateString("en-IN"),
          amount: p.amount,
          method: p.payment_method.replace(/_/g, " "),
          status: p.payment_status,
        }));

        exportToExcel(rentData, [
          { key: "slNo", label: "S.No" },
          { key: "month", label: "Month" },
          { key: "paid_on", label: "Paid On" },
          { key: "amount", label: "Amount (₹)" },
          { key: "method", label: "Payment Method" },
          { key: "status", label: "Status" },
        ], {
          filename: `rent-payments-${selectedFlat.flat_number}`,
          sheetName: "Rent Payments",
        });
      }

      // Auto-save document record so it appears in the documents list
      const lineItems = rooms.map((room) => ({
        room_name: room.name,
        items: room.items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          condition: item.condition,
        })),
      }));
      const saveResult = await createDocument({
        document_type: "flat_annexure",
        owner_id: selectedFlat.owner_id,
        period_label: `${annexureType === "move_in" ? "Move-In" : "Move-Out"} - Flat ${selectedFlat.flat_number} - ${annexureDate}`,
        line_items: lineItems,
        grand_total: annexureType === "move_out" ? refundAmount : undefined,
      });

      if (saveResult.success) {
        toast.success("Excel downloaded and saved to documents");
      } else {
        console.error("Auto-save failed:", saveResult.error);
        toast.success("Excel downloaded");
        toast.error(`Failed to save to documents: ${saveResult.error}`);
      }
    } catch {
      toast.error("Failed to export Excel");
    }
  };

  const [generating, setGenerating] = useState(false);

  const handleGeneratePDF = async () => {
    if (!selectedFlat) return;
    setGenerating(true);
    try {
      const pdfRooms = rooms.map((room) => ({
        name: room.name,
        items: room.items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          condition: item.condition,
        })),
      }));
      const pdfDeductions = deductions
        .filter((d) => d.amount > 0)
        .map((d) => ({
          description: d.description,
          amount: d.amount,
        }));
      const pdfRentPayments = annexureType === "move_out" && rentPayments.length > 0
        ? rentPayments.map((p) => ({
            month: new Date(p.payment_month).toLocaleDateString("en-IN", { month: "short", year: "numeric" }),
            paidOn: new Date(p.payment_date).toLocaleDateString("en-IN"),
            amount: p.amount,
            method: p.payment_method.replace(/_/g, " "),
            status: p.payment_status,
          }))
        : undefined;
      await downloadPDF(
        FlatAnnexurePDF({
          flatNo: selectedFlat.flat_number,
          ownerName: selectedFlat.owner_name,
          tenantName: selectedFlat.tenant_name,
          moveOutDate: annexureDate,
          rooms: pdfRooms,
          securityDeposit: selectedFlat.security_deposit,
          deductions: pdfDeductions,
          totalDeductions,
          refundAmount,
          rentPayments: pdfRentPayments,
          tenantBankDetails: bankDetails.account_number
            ? {
                name: bankDetails.account_holder,
                bank: bankDetails.bank_name,
                accountNo: bankDetails.account_number,
                ifsc: bankDetails.ifsc,
              }
            : undefined,
        }),
        `flat-annexure-${selectedFlat.flat_number}`
      );

      // Auto-save document record so it appears in the documents list
      const lineItems = rooms.map((room) => ({
        room_name: room.name,
        items: room.items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          condition: item.condition,
        })),
      }));
      const saveResult = await createDocument({
        document_type: "flat_annexure",
        owner_id: selectedFlat.owner_id,
        period_label: `${annexureType === "move_in" ? "Move-In" : "Move-Out"} - Flat ${selectedFlat.flat_number} - ${annexureDate}`,
        line_items: lineItems,
        grand_total: annexureType === "move_out" ? refundAmount : undefined,
      });

      if (saveResult.success) {
        toast.success("PDF downloaded and saved to documents");
      } else {
        console.error("Auto-save failed:", saveResult.error);
        toast.success("PDF downloaded");
        toast.error(`Failed to save to documents: ${saveResult.error}`);
      }
    } catch {
      toast.error("Failed to generate PDF");
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!selectedFlat) return;
    setSaving(true);
    try {
      const lineItems = rooms.map((room) => ({
        room_name: room.name,
        items: room.items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          condition: item.condition,
        })),
      }));

      const result = await createDocument({
        document_type: "flat_annexure",
        owner_id: selectedFlat.owner_id,
        period_label: `${annexureType === "move_in" ? "Move-In" : "Move-Out"} - ${annexureDate}`,
        line_items: lineItems,
        grand_total: annexureType === "move_out" ? refundAmount : undefined,
      });

      if (result.success) {
        toast.success("Flat annexure saved as draft");
        router.push("/pm/documents");
      } else {
        toast.error(result.error ?? "Failed to save");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteExit = async () => {
    if (!selectedFlat) return;
    setExitingTenant(true);
    setShowExitConfirm(false);
    try {
      // Step 1: Auto-save the annexure document FIRST so work is never lost
      const lineItems = rooms.map((room) => ({
        room_name: room.name,
        items: room.items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          condition: item.condition,
        })),
      }));
      const saveResult = await createDocument({
        document_type: "flat_annexure",
        owner_id: selectedFlat.owner_id,
        period_label: `Move-Out - Flat ${selectedFlat.flat_number} - ${annexureDate}`,
        line_items: lineItems,
        grand_total: refundAmount,
      });
      if (saveResult.success) {
        toast.success("Annexure saved to documents");
      } else {
        console.error("Auto-save failed:", saveResult.error);
        toast.error(`Failed to save annexure: ${saveResult.error}`);
      }

      // Step 2: Exit the tenant and mark flat as vacant
      const result = await exitTenant(selectedFlat.tenant_id, {
        exit_date: annexureDate,
        exit_reason: "Move-out annexure generated",
      });
      if (result.success) {
        setExitCompleted(true);
        toast.success(`Tenant exit completed — Flat ${selectedFlat.flat_number} is now vacant`);
      } else {
        toast.error(result.error ?? "Failed to complete tenant exit");
      }
    } catch {
      toast.error("Failed to complete tenant exit");
    } finally {
      setExitingTenant(false);
    }
  };

  const handleUndoExit = async () => {
    if (!selectedFlat) return;
    setUndoing(true);
    try {
      const result = await reactivateTenant(selectedFlat.tenant_id);
      if (result.success) {
        setExitCompleted(false);
        toast.success(`Undo successful — Flat ${selectedFlat.flat_number} is occupied again`);
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to undo tenant exit");
      }
    } catch {
      toast.error("Failed to undo tenant exit");
    } finally {
      setUndoing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/pm/documents/generate")}
          className="text-text-secondary hover:text-text-primary"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-h2 text-text-primary">Flat Annexure</h2>
          <p className="text-body-sm text-text-secondary">
            Room-by-room inventory checklist with deposit calculation
          </p>
        </div>
      </div>

      {/* Configuration */}
      <div className="bg-bg-card border border-border-primary rounded-lg p-6 mb-6 space-y-4">
        <h3 className="text-h3 text-text-primary">Annexure Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-text-secondary">Flat</Label>
            {!selectedFlatId ? (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <Input
                  value={flatSearch}
                  onChange={(e) => {
                    setFlatSearch(e.target.value);
                    setShowFlatDropdown(true);
                  }}
                  onFocus={() => setShowFlatDropdown(true)}
                  placeholder="Search flat number or tenant..."
                  className="pl-9 bg-bg-page border-border-primary"
                />
                {showFlatDropdown && (
                  <div className="absolute z-10 top-full mt-1 w-full bg-bg-card border border-border-primary rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {flats
                      .filter(
                        (f) =>
                          !flatSearch ||
                          f.flat_number.toLowerCase().includes(flatSearch.toLowerCase()) ||
                          f.tenant_name.toLowerCase().includes(flatSearch.toLowerCase())
                      )
                      .map((flat) => (
                        <button
                          key={flat.id}
                          type="button"
                          onClick={() => {
                            setSelectedFlatId(flat.id);
                            setFlatSearch("");
                            setShowFlatDropdown(false);
                            setBankDetails((prev) => ({
                              ...prev,
                              account_holder: flat.tenant_name,
                            }));
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-bg-hover transition-colors border-b border-border-primary last:border-0"
                        >
                          <span className="text-body-sm text-text-primary font-mono font-semibold">
                            Flat {flat.flat_number}
                          </span>
                          <span className="text-body-sm text-text-secondary ml-2">
                            · {flat.tenant_name}
                          </span>
                        </button>
                      ))}
                    {flats.filter(
                      (f) =>
                        !flatSearch ||
                        f.flat_number.toLowerCase().includes(flatSearch.toLowerCase()) ||
                        f.tenant_name.toLowerCase().includes(flatSearch.toLowerCase())
                    ).length === 0 && (
                      <p className="px-4 py-3 text-body-sm text-text-muted">No flats found</p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 bg-bg-elevated rounded-lg">
                <div>
                  <span className="text-body-sm text-text-primary font-mono font-bold">
                    Flat {flats.find((f) => f.id === selectedFlatId)?.flat_number}
                  </span>
                  <span className="text-body-sm text-text-secondary ml-2">
                    · {flats.find((f) => f.id === selectedFlatId)?.tenant_name}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedFlatId("")}
                  className="text-text-muted h-8 w-8"
                  aria-label="Clear flat selection"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-text-secondary">Type</Label>
            <Select value={annexureType} onValueChange={(v) => setAnnexureType(v as "move_in" | "move_out")}>
              <SelectTrigger className="bg-bg-page border-border-primary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="move_in">Move-In</SelectItem>
                <SelectItem value="move_out">Move-Out</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-text-secondary">Date</Label>
            <Input
              type="date"
              value={annexureDate}
              onChange={(e) => setAnnexureDate(e.target.value)}
              className="bg-bg-page border-border-primary"
            />
          </div>
        </div>

        {selectedFlat && (
          <div className="flex flex-wrap gap-4 pt-2 text-caption text-text-secondary">
            <span>Owner: <span className="text-text-primary font-medium">{selectedFlat.owner_name}</span></span>
            <span>BHK: <span className="text-text-primary font-medium">{selectedFlat.bhk_type}</span></span>
            <span>Deposit: <span className="text-accent font-medium">₹{selectedFlat.security_deposit.toLocaleString("en-IN")}</span></span>
            <span>Items: <span className="text-text-primary font-medium">{totalItems}</span></span>
          </div>
        )}
      </div>

      {/* Room-by-Room Inventory */}
      {selectedFlatId && (
        <div className="space-y-3 mb-6">
          {rooms.map((room) => (
            <div key={room.id} className="bg-bg-card border border-border-primary rounded-lg overflow-hidden">
              <button
                onClick={() => toggleRoom(room.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-bg-hover transition-colors"
              >
                <div className="flex items-center gap-2">
                  {room.expanded ? (
                    <ChevronDown className="h-4 w-4 text-text-muted" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-text-muted" />
                  )}
                  <h4 className="text-body-sm text-text-primary font-semibold">{room.name}</h4>
                </div>
                <span className="text-caption text-text-muted">{room.items.length} items</span>
              </button>

              {room.expanded && (
                <div className="border-t border-border-primary px-4 pb-4">
                  <div className="grid grid-cols-[auto_1fr_5rem_8rem_auto] gap-x-2 text-caption mt-2 mb-1 px-7">
                    <span className="text-text-muted font-semibold py-1.5">#</span>
                    <span className="text-text-muted font-semibold py-1.5">Description</span>
                    <span className="text-text-muted font-semibold py-1.5 text-center">Qty</span>
                    <span className="text-text-muted font-semibold py-1.5 text-center">Condition</span>
                    <span className="w-7" />
                  </div>
                  <div className="space-y-1">
                    <SortableList
                      items={room.items}
                      onReorder={(newItems) => reorderRoomItems(room.id, newItems)}
                      renderItem={(item, idx) => (
                        <div className="grid grid-cols-[auto_1fr_5rem_8rem_auto] gap-x-2 items-center">
                          <span className="text-caption text-text-muted w-4">{idx + 1}</span>
                          <Input
                            value={item.description}
                            onChange={(e) => updateItem(room.id, item.id, "description", e.target.value)}
                            className="h-8 text-caption bg-bg-page border-border-primary"
                          />
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(room.id, item.id, "quantity", parseInt(e.target.value) || 0)}
                            className="h-8 text-caption text-center bg-bg-page border-border-primary"
                          />
                          <Select
                            value={item.condition}
                            onValueChange={(v) => updateItem(room.id, item.id, "condition", v)}
                          >
                            <SelectTrigger className="h-8 text-caption bg-bg-page border-border-primary">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {CONDITIONS.map((c) => (
                                <SelectItem key={c} value={c}>{c}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-text-muted hover:text-danger"
                            onClick={() => removeItem(room.id, item.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => addItem(room.id)}
                    className="mt-2 text-text-muted hover:text-accent text-caption"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Add Item
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Rent Payment History (Move-Out only) */}
      {selectedFlatId && annexureType === "move_out" && (
        <div className="bg-bg-card border border-border-primary rounded-lg p-6 mb-6 space-y-4">
          <h3 className="text-h3 text-text-primary">Rent Payment History</h3>
          {loadingPayments ? (
            <div className="flex items-center gap-2 text-text-secondary">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-body-sm">Loading payments...</span>
            </div>
          ) : rentPayments.length === 0 ? (
            <p className="text-body-sm text-text-muted">No rent payments found for this flat.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-caption">
                <thead>
                  <tr className="border-b border-border-primary">
                    <th className="text-left py-2 px-3 text-text-muted font-semibold">#</th>
                    <th className="text-left py-2 px-3 text-text-muted font-semibold">Month</th>
                    <th className="text-left py-2 px-3 text-text-muted font-semibold">Paid On</th>
                    <th className="text-right py-2 px-3 text-text-muted font-semibold">Amount</th>
                    <th className="text-left py-2 px-3 text-text-muted font-semibold">Method</th>
                    <th className="text-left py-2 px-3 text-text-muted font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rentPayments.map((p, idx) => (
                    <tr key={p.id} className="border-b border-border-subtle hover:bg-bg-hover">
                      <td className="py-2 px-3 text-text-muted">{idx + 1}</td>
                      <td className="py-2 px-3 text-text-primary">
                        {new Date(p.payment_month).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                      </td>
                      <td className="py-2 px-3 text-text-secondary">
                        {new Date(p.payment_date).toLocaleDateString("en-IN")}
                      </td>
                      <td className="py-2 px-3 text-text-primary text-right font-medium">
                        ₹{p.amount.toLocaleString("en-IN")}
                      </td>
                      <td className="py-2 px-3 text-text-secondary capitalize">{p.payment_method.replace(/_/g, " ")}</td>
                      <td className="py-2 px-3 text-text-secondary capitalize">{p.payment_status}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-border-primary">
                    <td colSpan={3} className="py-2 px-3 text-text-primary font-semibold">Total ({rentPayments.length} payments)</td>
                    <td className="py-2 px-3 text-right text-accent font-bold">
                      ₹{rentPayments.reduce((sum, p) => sum + p.amount, 0).toLocaleString("en-IN")}
                    </td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Deposit Calculation (Move-Out only) */}
      {selectedFlatId && annexureType === "move_out" && (
        <div className="bg-bg-card border border-border-primary rounded-lg p-6 mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-h3 text-text-primary">Deposit Calculation</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={addDeduction}
              className="border-border-primary text-text-secondary"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Deduction
            </Button>
          </div>

          <div className="space-y-2">
            <SortableList
              items={deductions}
              onReorder={setDeductions}
              renderItem={(d) => (
                <div className="flex items-center gap-3">
                  <Input
                    value={d.description}
                    onChange={(e) => updateDeduction(d.id, "description", e.target.value)}
                    placeholder="Description"
                    className="flex-1 bg-bg-page border-border-primary"
                  />
                  <Input
                    type="number"
                    value={d.amount || ""}
                    onChange={(e) => updateDeduction(d.id, "amount", parseFloat(e.target.value) || 0)}
                    placeholder="Amount"
                    className="w-32 bg-bg-page border-border-primary"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeDeduction(d.id)}
                    className="text-text-muted hover:text-danger shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            />
          </div>

          {/* Summary */}
          <div className="pt-4 border-t border-border-primary space-y-2">
            <div className="flex justify-between text-body-sm">
              <span className="text-text-secondary">Security Deposit</span>
              <span className="text-text-primary font-medium">
                ₹{(selectedFlat?.security_deposit || 0).toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex justify-between text-body-sm">
              <span className="text-text-secondary">Pending Works (Total Deductions)</span>
              <span className="text-danger font-medium">- ₹{totalDeductions.toLocaleString("en-IN")}</span>
            </div>
            {deductions.filter((d) => d.amount > 0).map((d) => (
              <div key={d.id} className="flex justify-between text-caption pl-4">
                <span className="text-text-muted">- {d.description}</span>
                <span className="text-text-secondary">₹{d.amount.toLocaleString("en-IN")}</span>
              </div>
            ))}
            <div className="flex justify-between text-body font-semibold pt-2 border-t border-border-primary">
              <span className="text-text-primary">Total Refund Amount</span>
              <span className={cn(refundAmount >= 0 ? "text-success" : "text-danger")}>
                ₹{refundAmount.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          {/* Tenant Bank Details */}
          <div className="pt-4 border-t border-border-primary space-y-3">
            <h4 className="text-body-sm text-text-primary font-semibold">Tenant Bank Details (for refund)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-caption text-text-secondary">Account Holder</Label>
                <Input
                  value={bankDetails.account_holder}
                  onChange={(e) => setBankDetails({ ...bankDetails, account_holder: e.target.value })}
                  className="bg-bg-page border-border-primary"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-caption text-text-secondary">Bank Name</Label>
                <Input
                  value={bankDetails.bank_name}
                  onChange={(e) => setBankDetails({ ...bankDetails, bank_name: e.target.value })}
                  placeholder="e.g., HDFC Bank"
                  className="bg-bg-page border-border-primary"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-caption text-text-secondary">Account Number</Label>
                <Input
                  value={bankDetails.account_number}
                  onChange={(e) => setBankDetails({ ...bankDetails, account_number: e.target.value })}
                  className="bg-bg-page border-border-primary"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-caption text-text-secondary">IFSC Code</Label>
                <Input
                  value={bankDetails.ifsc}
                  onChange={(e) => setBankDetails({ ...bankDetails, ifsc: e.target.value })}
                  className="bg-bg-page border-border-primary"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tenant Details (Move-In only) */}
      {selectedFlatId && annexureType === "move_in" && selectedFlat && (
        <div className="bg-bg-card border border-border-primary rounded-lg p-6 mb-6 space-y-4">
          <h3 className="text-h3 text-text-primary flex items-center gap-2">
            <User className="h-5 w-5 text-accent" />
            Tenant Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-caption text-text-muted">Tenant Name</p>
              <p className="text-body-sm text-text-primary font-medium">{selectedFlat.tenant_name}</p>
            </div>
            {selectedFlat.tenant_phone && (
              <div className="space-y-1">
                <p className="text-caption text-text-muted flex items-center gap-1"><Phone className="h-3 w-3" /> Phone</p>
                <p className="text-body-sm text-text-primary">{selectedFlat.tenant_phone}</p>
              </div>
            )}
            {selectedFlat.tenant_email && (
              <div className="space-y-1">
                <p className="text-caption text-text-muted flex items-center gap-1"><Mail className="h-3 w-3" /> Email</p>
                <p className="text-body-sm text-text-primary">{selectedFlat.tenant_email}</p>
              </div>
            )}
            {selectedFlat.tenant_type && (
              <div className="space-y-1">
                <p className="text-caption text-text-muted">Tenant Type</p>
                <p className="text-body-sm text-text-primary capitalize">{selectedFlat.tenant_type}</p>
              </div>
            )}
            {selectedFlat.occupation_type && (
              <div className="space-y-1">
                <p className="text-caption text-text-muted flex items-center gap-1"><Building className="h-3 w-3" /> Occupation</p>
                <p className="text-body-sm text-text-primary capitalize">
                  {selectedFlat.occupation_type.replace(/_/g, " ")}
                  {selectedFlat.company_name ? ` — ${selectedFlat.company_name}` : ""}
                  {selectedFlat.business_name ? ` — ${selectedFlat.business_name}` : ""}
                </p>
              </div>
            )}
            {selectedFlat.tenant_type === "family" && selectedFlat.family_member_count && (
              <div className="space-y-1">
                <p className="text-caption text-text-muted">Family Members</p>
                <p className="text-body-sm text-text-primary">{selectedFlat.family_member_count}</p>
              </div>
            )}
            {selectedFlat.tenant_type === "bachelor" && (
              <>
                {selectedFlat.bachelor_occupant_count && (
                  <div className="space-y-1">
                    <p className="text-caption text-text-muted">Occupants</p>
                    <p className="text-body-sm text-text-primary">
                      {selectedFlat.bachelor_occupant_count}
                      {selectedFlat.bachelor_gender ? ` (${selectedFlat.bachelor_gender})` : ""}
                    </p>
                  </div>
                )}
              </>
            )}
            {selectedFlat.lease_start_date && (
              <div className="space-y-1">
                <p className="text-caption text-text-muted flex items-center gap-1"><Calendar className="h-3 w-3" /> Lease Start</p>
                <p className="text-body-sm text-text-primary">
                  {new Date(selectedFlat.lease_start_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
            )}
            {selectedFlat.lease_end_date && (
              <div className="space-y-1">
                <p className="text-caption text-text-muted flex items-center gap-1"><Calendar className="h-3 w-3" /> Lease End</p>
                <p className="text-body-sm text-text-primary">
                  {new Date(selectedFlat.lease_end_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
            )}
            <div className="space-y-1">
              <p className="text-caption text-text-muted flex items-center gap-1"><IndianRupee className="h-3 w-3" /> Monthly Rent</p>
              <p className="text-body-sm text-text-primary font-medium">
                ₹{selectedFlat.monthly_rent.toLocaleString("en-IN")}
                {selectedFlat.monthly_maintenance > 0 && (
                  <span className="text-text-secondary font-normal"> + ₹{selectedFlat.monthly_maintenance.toLocaleString("en-IN")} maint.</span>
                )}
              </p>
            </div>
            {selectedFlat.monthly_inclusive_rent > 0 && (
              <div className="space-y-1">
                <p className="text-caption text-text-muted">Inclusive Rent</p>
                <p className="text-body-sm text-accent font-medium">₹{selectedFlat.monthly_inclusive_rent.toLocaleString("en-IN")}</p>
              </div>
            )}
            <div className="space-y-1">
              <p className="text-caption text-text-muted">Security Deposit</p>
              <p className="text-body-sm text-text-primary font-medium">₹{selectedFlat.security_deposit.toLocaleString("en-IN")}</p>
            </div>
            {selectedFlat.carpet_area_sft && (
              <div className="space-y-1">
                <p className="text-caption text-text-muted">Carpet Area</p>
                <p className="text-body-sm text-text-primary">{selectedFlat.carpet_area_sft} sq.ft.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Complete Exit Banner (Move-Out only) */}
      {selectedFlatId && annexureType === "move_out" && !exitCompleted && (
        <div className="bg-warning/10 border border-warning/30 rounded-lg px-4 py-3 mb-6 flex items-start sm:items-center justify-between gap-3 flex-col sm:flex-row">
          <div>
            <p className="text-body-sm text-text-primary font-medium">
              Mark flat as vacant?
            </p>
            <p className="text-caption text-text-secondary">
              This will exit the tenant, mark Flat {selectedFlat?.flat_number} as vacant, and notify the owner.
            </p>
          </div>
          <Button
            onClick={() => setShowExitConfirm(true)}
            disabled={exitingTenant}
            className="bg-accent hover:bg-accent-light text-white shrink-0"
          >
            {exitingTenant ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4 mr-2" />
            )}
            {exitingTenant ? "Processing..." : "Complete Exit & Mark Vacant"}
          </Button>
        </div>
      )}

      {selectedFlatId && annexureType === "move_out" && exitCompleted && (
        <div className="bg-success/10 border border-success/30 rounded-lg px-4 py-3 mb-6 flex items-start sm:items-center justify-between gap-3 flex-col sm:flex-row">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
            <p className="text-body-sm text-success font-medium">
              Tenant exit completed — Flat {selectedFlat?.flat_number} is now vacant
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleUndoExit}
            disabled={undoing}
            className="border-warning text-warning hover:bg-warning/10 shrink-0"
          >
            {undoing ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <Undo2 className="h-4 w-4 mr-1.5" />
            )}
            {undoing ? "Undoing..." : "Undo Exit"}
          </Button>
        </div>
      )}

      {/* Exit Confirmation Dialog */}
      <Dialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-warning">
              <AlertTriangle className="h-5 w-5" />
              Confirm Tenant Exit
            </DialogTitle>
            <DialogDescription>
              Please verify you have selected the correct flat before proceeding.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <div className="bg-bg-elevated rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-body-sm">
                <span className="text-text-secondary">Flat</span>
                <span className="text-text-primary font-mono font-bold">{selectedFlat?.flat_number}</span>
              </div>
              <div className="flex justify-between text-body-sm">
                <span className="text-text-secondary">Tenant</span>
                <span className="text-text-primary font-medium">{selectedFlat?.tenant_name}</span>
              </div>
              <div className="flex justify-between text-body-sm">
                <span className="text-text-secondary">Exit Date</span>
                <span className="text-text-primary">{new Date(annexureDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
              </div>
              <div className="flex justify-between text-body-sm">
                <span className="text-text-secondary">Owner</span>
                <span className="text-text-primary">{selectedFlat?.owner_name}</span>
              </div>
            </div>
            <p className="text-caption text-text-secondary">
              This will deactivate the tenant and mark the flat as vacant. The owner will be notified. You can undo this action afterwards if needed.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExitConfirm(false)}>Cancel</Button>
            <Button onClick={handleCompleteExit} disabled={exitingTenant} className="bg-accent hover:bg-accent-light text-white">
              {exitingTenant ? "Processing..." : "Confirm Exit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Actions */}
      {selectedFlatId && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => router.push("/pm/documents/generate")}
            className="border-border-primary text-text-secondary"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleExportExcel}
              className="border-border-primary text-text-secondary"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
            <Button
              variant="outline"
              onClick={handleGeneratePDF}
              disabled={generating}
              className="border-border-primary text-text-secondary"
            >
              {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
              {generating ? "Generating..." : "Generate PDF"}
            </Button>
            <Button
              onClick={handleSaveDraft}
              disabled={saving}
              className="bg-accent hover:bg-accent-light text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save as Draft"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
