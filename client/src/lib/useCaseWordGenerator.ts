import { UseCase } from "@shared/schema";
import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  HeadingLevel, 
  Table, 
  TableRow, 
  TableCell, 
  BorderStyle, 
  WidthType, 
  AlignmentType, 
  ShadingType 
} from 'docx';

// Generate the document based on the use case data
export const generateUseCaseDocument = (useCase: UseCase): Document => {
  // Format the current date
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Create document sections
  const sections = [
    {
      properties: {},
      children: [
        // Title and header
        new Paragraph({
          text: useCase.title,
          heading: HeadingLevel.HEADING_1,
          thematicBreak: true,
          spacing: { after: 300 },
        }),

        // Document metadata
        new Paragraph({
          children: [
            new TextRun({
              text: useCase.customer ? `Customer: ${useCase.customer}` : "",
              bold: true,
            }),
          ],
          spacing: { after: 200 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: `Generated: ${formattedDate}`,
              italics: true,
            }),
          ],
          spacing: { after: 400 },
        }),

        // Description
        ...(useCase.description ? [
          new Paragraph({
            text: "Description",
            heading: HeadingLevel.HEADING_2,
            spacing: { after: 200 },
          }),
          new Paragraph({
            text: useCase.description,
            spacing: { after: 400 },
          }),
        ] : []),

        // Problem Statement
        ...(useCase.problemStatement ? [
          new Paragraph({
            text: "Problem Statement",
            heading: HeadingLevel.HEADING_2,
            spacing: { after: 200 },
          }),
          new Paragraph({
            text: useCase.problemStatement,
            spacing: { after: 400 },
          }),
        ] : []),

        // Proposed AI Solution
        ...(useCase.proposedSolution ? [
          new Paragraph({
            text: "Proposed AI Solution",
            heading: HeadingLevel.HEADING_2,
            spacing: { after: 200 },
          }),
          new Paragraph({
            text: useCase.proposedSolution,
            spacing: { after: 400 },
          }),
        ] : []),

        // Key Objectives & Success Metrics
        ...(useCase.keyObjectives ? [
          new Paragraph({
            text: "Key Objectives & Success Metrics",
            heading: HeadingLevel.HEADING_2,
            spacing: { after: 200 },
          }),
          new Paragraph({
            text: useCase.keyObjectives,
            spacing: { after: 400 },
          }),
        ] : []),

        // Required Data Inputs
        ...(useCase.requiredDataInputs ? [
          new Paragraph({
            text: "Required Data Inputs",
            heading: HeadingLevel.HEADING_2,
            spacing: { after: 200 },
          }),
          new Paragraph({
            text: useCase.requiredDataInputs,
            spacing: { after: 400 },
          }),
        ] : []),

        // Expected Outputs & Actions
        ...(useCase.expectedOutputs ? [
          new Paragraph({
            text: "Expected Outputs & Actions",
            heading: HeadingLevel.HEADING_2,
            spacing: { after: 200 },
          }),
          new Paragraph({
            text: useCase.expectedOutputs,
            spacing: { after: 400 },
          }),
        ] : []),

        // Key Stakeholders
        ...(useCase.keyStakeholders ? [
          new Paragraph({
            text: "Key Stakeholders",
            heading: HeadingLevel.HEADING_2,
            spacing: { after: 200 },
          }),
          new Paragraph({
            text: useCase.keyStakeholders,
            spacing: { after: 400 },
          }),
        ] : []),

        // High-Level Scope
        ...(useCase.scope ? [
          new Paragraph({
            text: "High-Level Scope",
            heading: HeadingLevel.HEADING_2,
            spacing: { after: 200 },
          }),
          new Paragraph({
            text: useCase.scope,
            spacing: { after: 400 },
          }),
        ] : []),

        // Potential Risks & Dependencies
        ...(useCase.potentialRisks ? [
          new Paragraph({
            text: "Potential Risks & Dependencies",
            heading: HeadingLevel.HEADING_2,
            spacing: { after: 200 },
          }),
          new Paragraph({
            text: useCase.potentialRisks,
            spacing: { after: 400 },
          }),
        ] : []),

        // Estimated Impact/Value
        ...(useCase.estimatedImpact ? [
          new Paragraph({
            text: "Estimated Impact/Value",
            heading: HeadingLevel.HEADING_2,
            spacing: { after: 200 },
          }),
          new Paragraph({
            text: useCase.estimatedImpact,
            spacing: { after: 400 },
          }),
        ] : []),
        
        // Add summary table of use case details
        new Paragraph({
          text: "Use Case Summary",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 200 },
          pageBreakBefore: true,
        }),
        
        createSummaryTable(useCase),
      ],
    },
  ];

  // If conversation flow exists, add it as a separate section
  if (useCase.conversationFlow && useCase.conversationFlow.trim() !== "") {
    sections[0].children.push(
      new Paragraph({
        text: "Conversation Flow",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 200 },
        pageBreakBefore: true,
      }),
      ...formatConversationFlow(useCase.conversationFlow)
    );
  }

  // Create the document with all sections
  return new Document({
    sections: sections,
  });
};

// Format conversation flow into multiple paragraphs
const formatConversationFlow = (conversationFlow: string): Paragraph[] => {
  if (!conversationFlow) return [];

  // Try to parse JSON if it's valid JSON
  try {
    const flowObject = JSON.parse(conversationFlow);
    if (flowObject.steps && Array.isArray(flowObject.steps)) {
      // Handle structured conversation flow
      return flowObject.steps.flatMap((step: any, index: number) => {
        const paragraphs: Paragraph[] = [
          new Paragraph({
            text: `Step ${index + 1}${step.stepType ? ` - ${step.stepType}` : ""}`,
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 200, after: 100 },
          })
        ];

        if (step.messages && Array.isArray(step.messages)) {
          step.messages.forEach((message: any) => {
            paragraphs.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${message.role}: `,
                    bold: true,
                  }),
                  new TextRun({
                    text: message.text,
                  }),
                ],
                spacing: { after: 100 },
              })
            );
          });
        }

        return paragraphs;
      });
    }
  } catch (e) {
    // Not valid JSON, process as plain text
  }

  // Process plain text
  const lines = conversationFlow.split('\n');
  return lines.map(line => 
    new Paragraph({
      text: line,
      spacing: { after: 100 },
    })
  );
};

// Create a summary table for the use case
const createSummaryTable = (useCase: UseCase): Table => {
  return new Table({
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
    borders: {
      top: {
        style: BorderStyle.SINGLE,
        size: 1,
      },
      bottom: {
        style: BorderStyle.SINGLE,
        size: 1,
      },
      left: {
        style: BorderStyle.SINGLE,
        size: 1,
      },
      right: {
        style: BorderStyle.SINGLE,
        size: 1,
      },
      insideHorizontal: {
        style: BorderStyle.SINGLE,
        size: 1,
      },
      insideVertical: {
        style: BorderStyle.SINGLE,
        size: 1,
      },
    },
    rows: [
      // Header row
      new TableRow({
        tableHeader: true,
        children: [
          new TableCell({
            width: {
              size: 30,
              type: WidthType.PERCENTAGE,
            },
            shading: {
              type: ShadingType.SOLID,
              color: "D3D3D3",
            },
            children: [new Paragraph({ text: "Attribute", bold: true })],
          }),
          new TableCell({
            width: {
              size: 70,
              type: WidthType.PERCENTAGE,
            },
            shading: {
              type: ShadingType.SOLID,
              color: "D3D3D3",
            },
            children: [new Paragraph({ text: "Value", bold: true })],
          }),
        ],
      }),
      
      // Content rows
      ...createTableRow("Title", useCase.title),
      ...(useCase.customer ? createTableRow("Customer", useCase.customer) : []),
      ...(useCase.description ? createTableRow("Description", useCase.description) : []),
      ...(useCase.problemStatement ? createTableRow("Problem Statement", useCase.problemStatement) : []),
      ...(useCase.proposedSolution ? createTableRow("Proposed Solution", useCase.proposedSolution) : []),
      ...(useCase.keyObjectives ? createTableRow("Key Objectives", useCase.keyObjectives) : []),
      ...(useCase.requiredDataInputs ? createTableRow("Required Data Inputs", useCase.requiredDataInputs) : []),
      ...(useCase.expectedOutputs ? createTableRow("Expected Outputs", useCase.expectedOutputs) : []),
      ...(useCase.keyStakeholders ? createTableRow("Key Stakeholders", useCase.keyStakeholders) : []),
      ...(useCase.scope ? createTableRow("Scope", useCase.scope) : []),
      ...(useCase.potentialRisks ? createTableRow("Potential Risks", useCase.potentialRisks) : []),
      ...(useCase.estimatedImpact ? createTableRow("Estimated Impact", useCase.estimatedImpact) : []),
    ],
  });
};

// Helper to create table rows
const createTableRow = (attributeName: string, value: string): TableRow[] => {
  if (!value) return [];
  
  return [
    new TableRow({
      children: [
        new TableCell({
          width: {
            size: 30,
            type: WidthType.PERCENTAGE,
          },
          children: [new Paragraph({ text: attributeName, bold: true })],
        }),
        new TableCell({
          width: {
            size: 70,
            type: WidthType.PERCENTAGE,
          },
          children: [new Paragraph({ text: value })],
        }),
      ],
    }),
  ];
};

// Function to generate and download the document
export const exportUseCaseToWord = async (useCase: UseCase): Promise<void> => {
  if (!useCase) {
    throw new Error("Use case is required for export");
  }
  
  try {
    const doc = generateUseCaseDocument(useCase);
    
    // Create a blob from the document using Packer
    const blob = await Packer.toBlob(doc);
    
    // Create a download link and trigger the download
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${useCase.title.replace(/\s+/g, '_')}_Use_Case.docx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    return Promise.resolve();
  } catch (error) {
    console.error("Error generating Word document:", error);
    return Promise.reject(error);
  }
};