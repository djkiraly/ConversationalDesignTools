import React from 'react';
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import html2canvas from 'html2canvas';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, ImageRun, AlignmentType } from 'docx';

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

  const captureFlowImage = async (): Promise<Uint8Array | null> => {
    if (!flowRef.current) return null;
    
    const flowElement = flowRef.current.querySelector('.react-flow');
    if (!flowElement) return null;
    
    try {
      // First fit the view to see all nodes
      const reactFlowInstance = (flowRef.current as any).__reactFlowInstance;
      if (reactFlowInstance) {
        // Using fitView from the reactFlowInstance directly
        reactFlowInstance.fitView({ padding: 0.2 });
      }
      
      // Capture the flow as an image
      const canvas = await html2canvas(flowElement as HTMLElement, {
        backgroundColor: '#ffffff',
        scale: 2, // Higher quality
        width: flowElement.clientWidth,
        height: flowElement.clientHeight,
        useCORS: true,
      });
      
      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob!);
        }, 'image/png', 1);
      });
      
      // Convert blob to base64
      const base64Image = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      
      // Extract the actual base64 data without the data URL prefix
      const base64Data = base64Image.split(',')[1];
      
      // Convert base64 to byte array
      return Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    } catch (error) {
      console.error("Failed to capture flow image:", error);
      return null;
    }
  };

  const handleExport = async () => {
    if (!flowRef.current) return;
    
    try {
      setIsExporting(true);
      toast({
        title: "Preparing Export",
        description: "Generating Word document...",
        duration: 3000
      });
      
      // Capture the flow diagram as an image
      const flowImageData = await captureFlowImage();
      
      // Document sections
      const sections = [];
      
      // Main content section
      const mainSection = {
        children: [
          // Document title
          new Paragraph({
            text: title,
            heading: HeadingLevel.HEADING_1,
            thematicBreak: true,
            spacing: { after: 300 },
          }),
          
          // Customer information
          new Paragraph({
            children: [
              new TextRun({
                text: metadata.customerName ? `Customer: ${metadata.customerName}` : "",
                bold: true,
              }),
            ],
            spacing: { after: 200 },
          }),
          
          // Generation date
          new Paragraph({
            children: [
              new TextRun({
                text: `Generated: ${new Date().toLocaleDateString()}`,
                italics: true,
              }),
            ],
            spacing: { after: 400 },
          }),
        ],
      };
      
      // Add Journey Description if available
      if (metadata.workflowIntent) {
        mainSection.children.push(
          new Paragraph({
            text: "Journey Description",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 200 },
          }),
          new Paragraph({
            text: metadata.workflowIntent,
            spacing: { after: 300 },
          })
        );
      }
      
      // Add Notes if available and different from description
      if (metadata.notes && metadata.notes !== metadata.workflowIntent) {
        mainSection.children.push(
          new Paragraph({
            text: "Notes",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 200 },
          }),
          new Paragraph({
            text: metadata.notes,
            spacing: { after: 300 },
          })
        );
      }
      
      // Add Summary if available
      if (metadata.summary) {
        mainSection.children.push(
          new Paragraph({
            text: "Journey Summary",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 200 },
          }),
          new Paragraph({
            text: metadata.summary,
            spacing: { after: 300 },
          })
        );
      }
      
      // Add Journey Flow Stats
      mainSection.children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Journey Flow (${nodes.length} nodes, ${edges.length} connections)`,
              bold: true,
              size: 28,
            }),
          ],
          spacing: { before: 400, after: 200 },
          pageBreakBefore: true,
        })
      );
      
      // Add the flow visualization image if available
      if (flowImageData) {
        mainSection.children.push(
          new Paragraph({
            text: "Flow Visualization",
            heading: HeadingLevel.HEADING_2,
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [
              new ImageRun({
                data: flowImageData,
                transformation: {
                  width: 550,
                  height: 350,
                },
                type: "png",
              }),
            ],
            alignment: AlignmentType.CENTER,
          })
        );
      } else {
        // Add a message if image capture failed
        mainSection.children.push(
          new Paragraph({
            text: "Flow Visualization",
            heading: HeadingLevel.HEADING_2,
            spacing: { after: 200 },
          }),
          new Paragraph({
            text: "Flow diagram image could not be captured.",
            spacing: { before: 200 },
          })
        );
      }
      
      // Add the main section
      sections.push(mainSection);
      
      // Create the document with all sections
      const doc = new Document({
        sections: sections,
      });
      
      // Generate and save the Word document
      const buffer = await Packer.toBuffer(doc);
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary link and trigger the download
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title.replace(/\s+/g, '_')}_Journey.docx`;
      link.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Export Complete",
        description: "Journey exported as Word document successfully.",
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