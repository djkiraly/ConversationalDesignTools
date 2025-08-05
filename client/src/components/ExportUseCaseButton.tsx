import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { UseCase } from "@shared/schema";
import { exportUseCaseToWord } from "@/lib/useCaseWordGenerator";

interface ExportUseCaseButtonProps {
  useCase: UseCase;
  variant?: "default" | "outline" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

const ExportUseCaseButton: React.FC<ExportUseCaseButtonProps> = ({ 
  useCase, 
  variant = "outline", 
  size = "default",
  className = ""
}) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!useCase) {
      toast({
        title: "Export Failed",
        description: "No use case data available to export.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsExporting(true);
      toast({
        title: "Preparing Export",
        description: "Generating Word document...",
        duration: 3000
      });

      await exportUseCaseToWord(useCase);

      toast({
        title: "Export Complete",
        description: "Use case exported as Word document successfully.",
        duration: 3000
      });
    } catch (error) {
      console.error("Failed to export use case:", error);
      
      // Enhanced error message to help with debugging
      let errorMessage = "There was an error exporting the use case.";
      
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
      variant={variant}
      size={size}
      onClick={handleExport}
      disabled={isExporting}
      className={className}
    >
      <FileText className="h-4 w-4 mr-2" />
      {isExporting ? "Exporting..." : "Export to Word"}
    </Button>
  );
};

export default ExportUseCaseButton;