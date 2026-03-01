"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, FileText, Share2, MessageCircle } from "lucide-react";
import { toast } from "sonner";

interface ExportButtonsProps {
  onExportExcel?: () => void;
  onExportPDF?: () => void;
  onShare?: () => void;
  /** Custom text for WhatsApp message. Falls back to page title + URL. */
  whatsappText?: string;
  label?: string;
}

export function ExportButtons({
  onExportExcel,
  onExportPDF,
  onShare,
  whatsappText,
  label = "Export",
}: ExportButtonsProps) {
  const handleExcel = () => {
    if (onExportExcel) {
      onExportExcel();
      toast.success("Excel file downloaded");
    }
  };

  const handlePDF = () => {
    if (onExportPDF) {
      onExportPDF();
      toast.success("PDF file downloaded");
    } else {
      window.print();
    }
  };

  const handleShare = () => {
    if (onShare) {
      onShare();
    } else if (navigator.share) {
      navigator.share({
        title: document.title,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard");
    }
  };

  const handleWhatsAppShare = () => {
    const text = whatsappText || `${document.title}\n${window.location.href}`;
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, "_blank", "noopener,noreferrer");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 border-border-primary">
          <Download className="h-3.5 w-3.5" />
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-bg-card border-border-primary">
        {onExportExcel && (
          <DropdownMenuItem onClick={handleExcel} className="gap-2 cursor-pointer">
            <FileSpreadsheet className="h-4 w-4 text-success" />
            Export as Excel
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={handlePDF} className="gap-2 cursor-pointer">
          <FileText className="h-4 w-4 text-danger" />
          Export as PDF
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleShare} className="gap-2 cursor-pointer">
          <Share2 className="h-4 w-4 text-info" />
          Share Link
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleWhatsAppShare} className="gap-2 cursor-pointer">
          <MessageCircle className="h-4 w-4 text-success" />
          Share via WhatsApp
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
