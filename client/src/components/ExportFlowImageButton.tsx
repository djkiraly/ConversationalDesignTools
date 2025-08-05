import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Image } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import html2canvas from 'html2canvas';
import { toPng } from 'html-to-image';

interface ExportFlowImageButtonProps {
  title: string;
  flowRef: React.RefObject<HTMLDivElement>;
  disabled?: boolean;
}

export default function ExportFlowImageButton({
  title,
  flowRef,
  disabled = false
}: ExportFlowImageButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!flowRef.current) return;
    
    try {
      setIsExporting(true);
      toast({
        title: "Preparing Export",
        description: "Generating PNG image...",
        duration: 2000
      });
      
      const flowElement = flowRef.current.querySelector('.react-flow');
      
      if (!flowElement) {
        throw new Error("Could not find flow element to export");
      }
      
      // First fit the view to see all nodes
      const reactFlowInstance = (flowRef.current as any).__reactFlowInstance;
      if (reactFlowInstance) {
        // Using fitView from the reactFlowInstance directly
        reactFlowInstance.fitView({ padding: 0.2 });
      }
      
      // Capture the flow as an image
      const dataUrl = await toPng(flowElement as HTMLElement, { 
        cacheBust: true,
        quality: 1,
        width: flowElement.clientWidth * 2,
        height: flowElement.clientHeight * 2,
        style: {
          transform: 'scale(2)',
          transformOrigin: 'top left'
        }
      });
      
      // Create a temporary link and trigger the download
      const link = document.createElement('a');
      link.download = `${title.replace(/\s+/g, '_')}_flow.png`;
      link.href = dataUrl;
      link.click();
      
      toast({
        title: "Export Complete",
        description: "Flow diagram exported as PNG successfully.",
        duration: 3000
      });
    } catch (error) {
      console.error("Failed to export flow image:", error);
      
      // Enhanced error message to help with debugging
      let errorMessage = "There was an error exporting the flow diagram.";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      toast({
        title: "Export Failed",
        description: errorMessage,
        variant: "destructive",
        duration: 5000
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
          <Image className="h-4 w-4" />
          Export PNG
        </>
      )}
    </Button>
  );
}