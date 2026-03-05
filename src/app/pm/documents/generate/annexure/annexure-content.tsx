"use client";

import { useState } from "react";
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
import { ArrowLeft, Download, Save, Plus, Trash2, ChevronDown, ChevronRight, Loader2, FileSpreadsheet, Search, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { FlatAnnexurePDF } from "@/lib/pdf/flat-annexure";
import { downloadPDF } from "@/lib/pdf/download";
import { createDocument } from "@/lib/actions";
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
  owner_id: string;
  owner_name: string;
  tenant_name: string;
  security_deposit: number;
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

  const selectedFlat = flats.find((f) => f.id === selectedFlatId);

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

  const handleExportExcel = () => {
    if (!selectedFlat) return;
    try {
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
      toast.success("Excel downloaded successfully");
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
      toast.success("PDF downloaded successfully");
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
