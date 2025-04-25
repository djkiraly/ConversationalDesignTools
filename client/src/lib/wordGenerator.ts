import { Document, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, AlignmentType, BorderStyle, WidthType, HeightRule, ShadingType, Packer } from 'docx';
import { ActionPlan } from './api';

// Helper function to convert array of strings to readable list
const formatListItems = (items: string[]): string => {
  if (!items || items.length === 0) return 'None';
  
  return items.map(item => {
    // Convert kebab case to readable text
    return item.split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }).join(', ');
};

// Format a section with content
const createSection = (title: string, content: string): Paragraph[] => {
  return [
    new Paragraph({
      text: title,
      heading: HeadingLevel.HEADING_2,
      spacing: {
        after: 120
      }
    }),
    new Paragraph({
      text: content,
      spacing: {
        after: 240
      }
    })
  ];
};

// Function to calculate ROI metrics
const calculateROIMetrics = (actionPlan: ActionPlan) => {
  // Default values if we don't have real calculations
  return {
    csat: {
      current: 3.5,
      projected: 4.5
    },
    avgResponseTime: {
      current: 15.0,
      projected: 2.5
    },
    fteCost: {
      current: 20000,
      projected: 12000
    },
    operationalCost: {
      current: 30000,
      projected: 22000
    },
    firstContactResolution: {
      current: 0.65,
      projected: 0.90
    },
    annualSavings: 192000
  };
};

// Create an ROI table
const createROITable = (actionPlan: ActionPlan): Table => {
  const roi = calculateROIMetrics(actionPlan);
  
  return new Table({
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
      left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
      right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
    },
    rows: [
      new TableRow({
        tableHeader: true,
        height: {
          value: 400,
          rule: HeightRule.EXACT,
        },
        children: [
          new TableCell({
            shading: {
              fill: "F2F2F2",
              type: ShadingType.CLEAR,
            },
            width: {
              size: 50,
              type: WidthType.PERCENTAGE,
            },
            children: [new Paragraph({ text: "Metric", alignment: AlignmentType.CENTER })],
          }),
          new TableCell({
            shading: {
              fill: "F2F2F2",
              type: ShadingType.CLEAR,
            },
            width: {
              size: 25,
              type: WidthType.PERCENTAGE,
            },
            children: [new Paragraph({ text: "Current", alignment: AlignmentType.CENTER })],
          }),
          new TableCell({
            shading: {
              fill: "F2F2F2",
              type: ShadingType.CLEAR,
            },
            width: {
              size: 25,
              type: WidthType.PERCENTAGE,
            },
            children: [new Paragraph({ text: "Projected", alignment: AlignmentType.CENTER })],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph("Customer Satisfaction Score")],
          }),
          new TableCell({
            children: [new Paragraph({ text: `${roi.csat.current.toFixed(1)}/5.0`, alignment: AlignmentType.RIGHT })],
          }),
          new TableCell({
            children: [new Paragraph({ text: `${roi.csat.projected.toFixed(1)}/5.0`, alignment: AlignmentType.RIGHT })],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph("Average Response Time")],
          }),
          new TableCell({
            children: [new Paragraph({ text: `${roi.avgResponseTime.current.toFixed(1)} min`, alignment: AlignmentType.RIGHT })],
          }),
          new TableCell({
            children: [new Paragraph({ text: `${roi.avgResponseTime.projected.toFixed(1)} min`, alignment: AlignmentType.RIGHT })],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph("Monthly FTE Cost")],
          }),
          new TableCell({
            children: [new Paragraph({ text: `$${roi.fteCost.current.toLocaleString()}`, alignment: AlignmentType.RIGHT })],
          }),
          new TableCell({
            children: [new Paragraph({ text: `$${roi.fteCost.projected.toLocaleString()}`, alignment: AlignmentType.RIGHT })],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph("Monthly Operational Cost")],
          }),
          new TableCell({
            children: [new Paragraph({ text: `$${roi.operationalCost.current.toLocaleString()}`, alignment: AlignmentType.RIGHT })],
          }),
          new TableCell({
            children: [new Paragraph({ text: `$${roi.operationalCost.projected.toLocaleString()}`, alignment: AlignmentType.RIGHT })],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph("First Contact Resolution")],
          }),
          new TableCell({
            children: [new Paragraph({ text: `${(roi.firstContactResolution.current * 100).toFixed(1)}%`, alignment: AlignmentType.RIGHT })],
          }),
          new TableCell({
            children: [new Paragraph({ text: `${(roi.firstContactResolution.projected * 100).toFixed(1)}%`, alignment: AlignmentType.RIGHT })],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            shading: {
              fill: "F2F2F2",
              type: ShadingType.CLEAR,
            },
            children: [new Paragraph({
              text: "Annual Savings",
              children: [
                new TextRun({
                  text: "Annual Savings",
                  bold: true
                })
              ]
            })],
          }),
          new TableCell({
            children: [new Paragraph("")],
          }),
          new TableCell({
            shading: {
              fill: "F2F2F2",
              type: ShadingType.CLEAR,
            },
            children: [new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                new TextRun({
                  text: `$${roi.annualSavings.toLocaleString()}`,
                  bold: true
                })
              ]
            })],
          }),
        ],
      }),
    ],
  });
};

// Generate a complete Word document for an action plan
export const generateActionPlanDocument = (actionPlan: ActionPlan): Document => {
  // Format variables for better display
  const primaryChannel = actionPlan.primaryChannel ? 
    actionPlan.primaryChannel.split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ') : 'Not specified';
      
  const interactionVolume = actionPlan.interactionVolume ? 
    actionPlan.interactionVolume.replace('-', ' to ') : 'Not specified';
    
  const challengeMap: Record<string, string> = {
    'wait-times': 'Long wait times',
    'inconsistent-service': 'Inconsistent service',
    'lack-of-data': 'Lack of customer data',
    'high-cost': 'High cost of service',
    'agent-turnover': 'High agent turnover',
    'complexity': 'Complex customer issues'
  };
  
  const biggestChallenge = actionPlan.biggestChallenge ? 
    (challengeMap[actionPlan.biggestChallenge] || actionPlan.biggestChallenge) : 'Not specified';
    
  const autonomyMap: Record<string, string> = {
    'assistive': 'Assistive (Human-led)',
    'collaborative': 'Collaborative (Human-AI partnership)',
    'supervised': 'Supervised Autonomy',
    'fully-autonomous': 'Fully Autonomous'
  };
  
  const autonomyLevel = actionPlan.autonomyLevel ? 
    (autonomyMap[actionPlan.autonomyLevel] || actionPlan.autonomyLevel) : 'Not specified';
    
  // Get current date formatted
  const today = new Date();
  const formattedDate = `${today.toLocaleDateString()} ${today.toLocaleTimeString()}`;
  
  // Create document
  return new Document({
    title: actionPlan.title,
    description: "AI Deployment Action Plan",
    styles: {
      paragraphStyles: [
        {
          id: "Normal",
          name: "Normal",
          run: {
            size: 24,
            font: "Calibri",
          },
          paragraph: {
            spacing: {
              line: 276,
            },
          },
        },
        {
          id: "Heading1",
          name: "Heading 1",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: {
            size: 36,
            bold: true,
            color: "2F5496",
          },
          paragraph: {
            spacing: {
              before: 360,
              after: 240,
            },
          },
        },
        {
          id: "Heading2",
          name: "Heading 2",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: {
            size: 28,
            bold: true,
            color: "2F5496",
          },
          paragraph: {
            spacing: {
              before: 320,
              after: 200,
            },
          },
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1000,
              right: 1000,
              bottom: 1000,
              left: 1000,
            },
          },
        },
        children: [
          // Cover page
          new Paragraph({
            text: actionPlan.title,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: {
              after: 400
            }
          }),
          new Paragraph({
            text: "Agentic AI Deployment Action Plan",
            alignment: AlignmentType.CENTER,
            spacing: {
              after: 800
            }
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `Generated: ${formattedDate}`,
                italics: true,
              }),
            ],
            spacing: {
              after: 1200
            }
          }),
          new Paragraph({
            text: "EXECUTIVE SUMMARY",
            heading: HeadingLevel.HEADING_1,
            spacing: {
              after: 200
            }
          }),
          new Paragraph({
            text: `This action plan outlines a comprehensive strategy for implementing Agentic AI solutions for ${actionPlan.industry || 'your industry'} with a focus on ${primaryChannel} as the primary customer interaction channel. With a monthly volume of ${interactionVolume} interactions, this plan addresses the key challenge of ${biggestChallenge} through strategic AI deployment.`,
            spacing: {
              after: 240
            }
          }),
          new Paragraph({
            text: `The proposed solution will utilize a ${autonomyLevel} approach to maximize efficiency while ensuring appropriate oversight. Implementation will focus on: ${formatListItems(actionPlan.aiGoals)}.`,
            spacing: {
              after: 240
            }
          }),
          
          new Paragraph({
            text: "BUSINESS DISCOVERY",
            heading: HeadingLevel.HEADING_1
          }),
          ...createSection("Industry", actionPlan.industry || "Not specified"),
          ...createSection("Primary Channel", primaryChannel),
          ...createSection("Monthly Interaction Volume", interactionVolume),
          ...createSection("Current Automation Status", actionPlan.currentAutomation === "yes" ? "Currently using automation" : "No automation currently in use"),
          
          new Paragraph({
            text: "PAIN POINT ASSESSMENT",
            heading: HeadingLevel.HEADING_1
          }),
          ...createSection("Biggest Challenge", biggestChallenge),
          ...createSection("Repetitive Processes", actionPlan.repetitiveProcesses || "Not specified"),
          
          new Paragraph({
            text: "AI AGENT GOALS",
            heading: HeadingLevel.HEADING_1
          }),
          ...createSection("Target Capabilities", formatListItems(actionPlan.aiGoals)),
          ...createSection("Autonomy Level", autonomyLevel),
          
          new Paragraph({
            text: "SYSTEMS & INTEGRATION READINESS",
            heading: HeadingLevel.HEADING_1
          }),
          ...createSection("Current Platforms", actionPlan.currentPlatforms || "None specified"),
          ...createSection("Team Readiness", actionPlan.teamComfort === "yes" ? "Team is comfortable with AI" : "Team needs AI training"),
          ...createSection("API Availability", actionPlan.apisAvailable === "yes" ? "APIs are available" : "APIs need to be developed"),
          
          new Paragraph({
            text: "SUCCESS METRICS & ROI PROJECTION",
            heading: HeadingLevel.HEADING_1
          }),
          ...createSection("Key Success Metrics", formatListItems(actionPlan.successMetrics)),
          new Paragraph({
            text: "Return on Investment Projection",
            heading: HeadingLevel.HEADING_2,
            spacing: {
              after: 120
            }
          }),
          createROITable(actionPlan),
          
          new Paragraph({
            text: "IMPLEMENTATION TIMELINE",
            heading: HeadingLevel.HEADING_1
          }),
          ...createSection("Phase 1: Discovery & Planning", "Weeks 1-2\nStakeholder interviews, requirements gathering, and technical assessment."),
          ...createSection("Phase 2: Design & Development", "Weeks 3-6\nAI model training, conversation flow design, and integration development."),
          ...createSection("Phase 3: Testing & Refinement", "Weeks 7-8\nQA testing, user acceptance testing, and performance optimization."),
          ...createSection("Phase 4: Deployment & Training", "Weeks 9-10\nProduction deployment, staff training, and documentation."),
          ...createSection("Phase 5: Monitoring & Optimization", "Ongoing\nPerformance monitoring, analytics review, and continuous improvement."),
        ],
      },
    ],
  });
};

// Function to generate and download the document
export const exportActionPlanToWord = async (actionPlan: ActionPlan): Promise<void> => {
  if (!actionPlan) {
    throw new Error("Action plan is required for export");
  }
  
  try {
    const doc = generateActionPlanDocument(actionPlan);
    
    // Create a blob from the document
    const blob = await doc.save();
    
    // Create a download link and trigger the download
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${actionPlan.title.replace(/\s+/g, '_')}_Action_Plan.docx`;
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