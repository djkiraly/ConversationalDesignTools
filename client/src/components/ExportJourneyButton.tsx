import React from 'react';
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ExportJourneyButtonProps {
  title: string;
  metadata: {
    customerName: string;
    workflowIntent: string;
    notes: string;
    summary?: string;
  };
  nodes: any[];
  edges: any[];
  flowRef: React.RefObject<HTMLDivElement>;
  disabled?: boolean;
}

export default function ExportJourneyButton({
  title,
  metadata,
  nodes,
  edges,
  flowRef,
  disabled = false
}: ExportJourneyButtonProps) {
  const [isExporting, setIsExporting] = React.useState(false);

  const handleExport = async () => {
    if (!flowRef.current) return;
    
    try {
      setIsExporting(true);
      toast({
        title: "Preparing Export",
        description: "Generating PDF document...",
        duration: 3000
      });
      
      // Create a new PDF document
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Set title
      pdf.setFontSize(18);
      pdf.text(title, 20, 20);
      
      // Set customer information
      pdf.setFontSize(12);
      if (metadata.customerName) {
        pdf.text(`Customer: ${metadata.customerName}`, 20, 30);
      }
      
      // Add date
      const currentDate = new Date().toLocaleDateString();
      pdf.text(`Generated: ${currentDate}`, 20, 38);
      
      let yPosition = 48;
      
      // Add workflow intent/description
      if (metadata.workflowIntent) {
        pdf.setFontSize(14);
        pdf.text("Journey Description", 20, yPosition);
        pdf.setFontSize(10);
        
        // Split text into multiple lines to fit the page width
        const splitWorkflowIntent = pdf.splitTextToSize(metadata.workflowIntent, 170);
        pdf.text(splitWorkflowIntent, 20, yPosition + 8);
        
        yPosition += 8 + (splitWorkflowIntent.length * 5);
      }
      
      // Add notes
      if (metadata.notes && metadata.notes !== metadata.workflowIntent) {
        pdf.setFontSize(14);
        pdf.text("Notes", 20, yPosition + 10);
        pdf.setFontSize(10);
        
        // Split text into multiple lines to fit the page width
        const splitNotes = pdf.splitTextToSize(metadata.notes, 170);
        pdf.text(splitNotes, 20, yPosition + 18);
        
        yPosition += 18 + (splitNotes.length * 5);
      }
      
      // Add summary
      if (metadata.summary) {
        pdf.setFontSize(14);
        pdf.text("Journey Summary", 20, yPosition + 10);
        pdf.setFontSize(10);
        
        // Split text into multiple lines to fit the page width
        const splitSummary = pdf.splitTextToSize(metadata.summary, 170);
        pdf.text(splitSummary, 20, yPosition + 18);
        
        yPosition += 18 + (splitSummary.length * 5);
      }
      
      // Add flow stats
      pdf.setFontSize(14);
      pdf.text(`Journey Flow (${nodes.length} nodes, ${edges.length} connections)`, 20, yPosition + 10);
      
      // Create a new page for the flow
      pdf.addPage();
      
      // Capture flow as image
      if (flowRef.current) {
        const flowElement = flowRef.current.querySelector('.react-flow');
        if (flowElement) {
          // Use html2canvas to capture the flow as an image
          const canvas = await html2canvas(flowElement as HTMLElement, {
            backgroundColor: '#ffffff',
            scale: 2 // Higher quality
          });
          
          // Calculate dimensions to fit it on the page
          const imgData = canvas.toDataURL('image/png');
          const imgProps = pdf.getImageProperties(imgData);
          const pdfWidth = pdf.internal.pageSize.getWidth() - 40;
          const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
          
          // Add the image to the PDF
          pdf.addImage(imgData, 'PNG', 20, 20, pdfWidth, pdfHeight);
        }
      }
      
      // Save the PDF
      pdf.save(`${title.replace(/\s+/g, '_')}_Journey.pdf`);
      
      toast({
        title: "Export Complete",
        description: "Journey exported as PDF successfully.",
        duration: 3000
      });
    } catch (error) {
      console.error("Failed to export journey:", error);
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "There was an error exporting the journey.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={disabled || isExporting}
      className="gap-1"
    >
      {isExporting ? (
        <>
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          Exporting...
        </>
      ) : (
        <>
          <Download className="h-4 w-4" />
          Export
        </>
      )}
    </Button>
  );
}