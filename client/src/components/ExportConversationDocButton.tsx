import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import html2canvas from 'html2canvas';
import { Document, Packer, Paragraph, TextRun, ImageRun, HeadingLevel, Table, TableRow, TableCell, BorderStyle, WidthType, AlignmentType } from 'docx';

interface ExportConversationDocButtonProps {
  title: string;
  metadata: {
    agentPersona?: string;
    customerName?: string;
    workflowIntent?: string;
    notes?: string;
    summary?: string;
  };
  conversationFlow: string;
  flowRef: React.RefObject<HTMLDivElement>;
  disabled?: boolean;
}

export default function ExportConversationDocButton({
  title,
  metadata,
  conversationFlow,
  flowRef,
  disabled = false
}: ExportConversationDocButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!flowRef.current) return;
    
    try {
      setIsExporting(true);
      toast({
        title: "Preparing Export",
        description: "Generating Word document, please wait...",
        duration: 2000
      });
      
      const flowElement = flowRef.current.querySelector('.react-flow');
      
      if (!flowElement) {
        throw new Error("Could not find flow element to export");
      }
      
      // First fit the view to see all nodes
      const reactFlowInstance = (flowRef.current as any).__reactFlowInstance;
      if (reactFlowInstance) {
        reactFlowInstance.fitView({ padding: 0.2 });
      }
      
      // Capture the flow as an image
      const canvas = await html2canvas(flowElement as HTMLElement, {
        backgroundColor: '#fff',
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
      });
      
      const imageDataUrl = canvas.toDataURL('image/png');
      const imageData = imageDataUrl.replace('data:image/png;base64,', '');
      
      // Create document sections
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [
              new Paragraph({
                text: title,
                heading: HeadingLevel.TITLE,
                spacing: {
                  after: 200,
                  before: 200
                }
              }),
              
              // Metadata Section
              new Paragraph({
                text: "Conversation Information",
                heading: HeadingLevel.HEADING_1,
                spacing: {
                  after: 200,
                  before: 400
                }
              }),
              
              // Create a table for metadata
              new Table({
                width: {
                  size: 100,
                  type: WidthType.PERCENTAGE,
                },
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 1, color: "#CCCCCC" },
                  bottom: { style: BorderStyle.SINGLE, size: 1, color: "#CCCCCC" },
                  left: { style: BorderStyle.SINGLE, size: 1, color: "#CCCCCC" },
                  right: { style: BorderStyle.SINGLE, size: 1, color: "#CCCCCC" },
                  insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "#CCCCCC" },
                  insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "#CCCCCC" },
                },
                rows: [
                  // Customer Name row
                  ...(metadata.customerName ? [new TableRow({
                    children: [
                      new TableCell({
                        width: {
                          size: 30,
                          type: WidthType.PERCENTAGE,
                        },
                        children: [new Paragraph("Customer Name")],
                        shading: {
                          fill: "F2F2F2",
                        },
                      }),
                      new TableCell({
                        width: {
                          size: 70,
                          type: WidthType.PERCENTAGE,
                        },
                        children: [new Paragraph(metadata.customerName || "")],
                      }),
                    ],
                  })] : []),
                  
                  // Agent Persona row
                  ...(metadata.agentPersona ? [new TableRow({
                    children: [
                      new TableCell({
                        width: {
                          size: 30,
                          type: WidthType.PERCENTAGE,
                        },
                        children: [new Paragraph("Agent Persona")],
                        shading: {
                          fill: "F2F2F2",
                        },
                      }),
                      new TableCell({
                        width: {
                          size: 70,
                          type: WidthType.PERCENTAGE,
                        },
                        children: [new Paragraph(metadata.agentPersona || "")],
                      }),
                    ],
                  })] : []),
                  
                  // Intent row
                  ...(metadata.workflowIntent ? [new TableRow({
                    children: [
                      new TableCell({
                        width: {
                          size: 30,
                          type: WidthType.PERCENTAGE,
                        },
                        children: [new Paragraph("Workflow Intent")],
                        shading: {
                          fill: "F2F2F2",
                        },
                      }),
                      new TableCell({
                        width: {
                          size: 70,
                          type: WidthType.PERCENTAGE,
                        },
                        children: [new Paragraph(metadata.workflowIntent || "")],
                      }),
                    ],
                  })] : []),
                  
                  // Notes row
                  ...(metadata.notes ? [new TableRow({
                    children: [
                      new TableCell({
                        width: {
                          size: 30,
                          type: WidthType.PERCENTAGE,
                        },
                        children: [new Paragraph("Notes")],
                        shading: {
                          fill: "F2F2F2",
                        },
                      }),
                      new TableCell({
                        width: {
                          size: 70,
                          type: WidthType.PERCENTAGE,
                        },
                        children: [new Paragraph(metadata.notes || "")],
                      }),
                    ],
                  })] : []),
                ],
              }),
              
              // Summary Section (if available)
              ...(metadata.summary ? [
                new Paragraph({
                  text: "Summary",
                  heading: HeadingLevel.HEADING_1,
                  spacing: {
                    after: 200,
                    before: 400
                  }
                }),
                new Paragraph({
                  text: metadata.summary || "",
                  spacing: {
                    after: 200
                  }
                })
              ] : []),
              
              // Conversation Flow Section
              new Paragraph({
                text: "Conversational Flow",
                heading: HeadingLevel.HEADING_1,
                spacing: {
                  after: 200,
                  before: 400
                }
              }),
              new Paragraph({
                text: conversationFlow || "No conversation flow provided",
                spacing: {
                  after: 400
                }
              }),
              
              // Flow Diagram Section
              new Paragraph({
                text: "Flow Diagram",
                heading: HeadingLevel.HEADING_1,
                spacing: {
                  after: 200,
                  before: 400
                }
              }),
              new Paragraph({
                children: [
                  new ImageRun({
                    data: imageData,
                    transformation: {
                      width: 550,
                      height: 350,
                    },
                    type: 'png',
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: {
                  after: 200
                }
              }),
            ].filter(Boolean),
          },
        ],
      });
      
      // Generate and download the document
      const buffer = await Packer.toBlob(doc);
      const url = window.URL.createObjectURL(buffer);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title.replace(/\s+/g, '_')}_conversation_document.docx`;
      link.click();
      
      toast({
        title: "Export Complete",
        description: "Word document exported successfully.",
        duration: 3000
      });
    } catch (error) {
      console.error("Failed to export document:", error);
      
      // Enhanced error message to help with debugging
      let errorMessage = "There was an error exporting the document.";
      
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
          <FileText className="h-4 w-4" />
          Export Doc
        </>
      )}
    </Button>
  );
}