import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Map, Settings, Home as HomeIcon, ArrowRight, Database, BarChart3, FileText, FolderTree, ClipboardList, MessageSquare, Bot } from 'lucide-react';
import { fetchAppStatistics, AppStatistics } from '../lib/api';

// Define the structure for application pages
interface AppPage {
  id: string;
  title: string;
  description: string;
  icon: JSX.Element;
  path: string;
  color: string;
}

export default function HomePage() {
  // Fetch app statistics
  const { data: statistics, isLoading: isStatsLoading, error: statsError } = useQuery({
    queryKey: ['/api/statistics'],
    queryFn: () => fetchAppStatistics(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });
  
  // Define the list of application pages
  const appPages: AppPage[] = [
    {
      id: 'action-plan',
      title: 'Action Plan',
      description: 'Build a tailored Agentic AI deployment plan with emphasis on conversational automation and operational impact',
      icon: <ClipboardList className="h-6 w-6" />,
      path: '/action-plan',
      color: 'bg-purple-50 text-purple-700 border-purple-200'
    },
    {
      id: 'agent-journey',
      title: 'Agent Journey',
      description: 'Define how AI agents interpret inputs, apply guardrails, access systems, and manage escalations',
      icon: <Bot className="h-6 w-6" />,
      path: '/agent-journeys',
      color: 'bg-teal-50 text-teal-700 border-teal-200'
    },
    {
      id: 'happy-path',
      title: 'Happy Path',
      description: 'View and manage AI-powered conversation flows that guide users through optimal interaction paths',
      icon: <CheckCircle2 className="h-6 w-6" />,
      path: '/happy-path',
      color: 'bg-green-50 text-green-700 border-green-200'
    },
    {
      id: 'customer-journey',
      title: 'Customer and User Journey',
      description: 'Design and visualize customer and user interaction workflows with interactive flow diagrams',
      icon: <Map className="h-6 w-6" />,
      path: '/customer-journey',
      color: 'bg-blue-50 text-blue-700 border-blue-200'
    },
    {
      id: 'use-case',
      title: 'Use Cases',
      description: 'Define and manage detailed use cases for your AI agents with problem statements, solutions, and key requirements',
      icon: <MessageSquare className="h-6 w-6" />,
      path: '/use-case',
      color: 'bg-amber-50 text-amber-700 border-amber-200'
    },
    {
      id: 'settings',
      title: 'Settings',
      description: 'Configure application settings and AI behavior',
      icon: <Settings className="h-6 w-6" />,
      path: '/settings',
      color: 'bg-slate-50 text-slate-700 border-slate-200'
    }
  ];
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-8">
        <HomeIcon className="h-8 w-8 mr-3 text-primary" />
        <h1 className="text-3xl font-bold">Home</h1>
      </div>
      
      <p className="text-lg text-muted-foreground mb-8">
        Welcome to the AI Conversation Designer. This application helps you create, visualize, and manage customer interactions and conversation flows.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {appPages.map((page) => (
          <Card key={page.id} className={`shadow-md border-2 ${page.color} hover:shadow-lg transition-all`}>
            <CardHeader>
              <div className="flex items-center">
                {page.icon}
                <CardTitle className="ml-2">{page.title}</CardTitle>
              </div>
              <CardDescription>{page.description}</CardDescription>
            </CardHeader>
            <CardFooter>
              <Link href={page.path}>
                <Button className="w-full flex justify-between items-center">
                  Go to {page.title}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
      
      <div className="mt-12 p-6 bg-muted rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Getting Started</h2>
        <p className="mb-4">
          This application provides tools to design and implement AI-driven conversational solutions:
        </p>
        <ul className="list-disc pl-6 space-y-2 mb-6">
          <li>Build <strong>Action Plans</strong> to develop tailored AI deployment strategies</li>
          <li>Create <strong>Agent Journeys</strong> to define how AI agents interpret inputs, apply guardrails, and manage interactions</li>
          <li>Define <strong>Use Cases</strong> with comprehensive details including problem statements, solutions, and requirements</li>
          <li>Use <strong>Happy Path</strong> to define the optimal conversation flows for your AI agents</li>
          <li>Create a <strong>Customer and User Journey</strong> map to visualize the end-to-end user experience</li>
          <li>Configure AI behavior and system settings in the <strong>Settings</strong> page</li>
        </ul>
      </div>
      
      {/* App Statistics Section */}
      <div className="mt-12">
        <div className="flex items-center mb-4">
          <BarChart3 className="h-6 w-6 mr-2 text-primary" />
          <h2 className="text-xl font-semibold">Application Statistics</h2>
        </div>
        
        {isStatsLoading ? (
          <div className="p-6 bg-muted rounded-lg">
            <div className="space-y-4">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        ) : statsError ? (
          <div className="p-6 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg">
            <p>Unable to load application statistics. Please try again later.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* App Metrics Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Application Metrics
                </CardTitle>
                <CardDescription>
                  Current state of your conversation designs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Action Plans</span>
                      <Badge variant="outline">{statistics?.actionPlanCount || 0}</Badge>
                    </div>
                    <Progress value={statistics?.actionPlanCount ? Math.min(statistics.actionPlanCount * 10, 100) : 0} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Use Cases</span>
                      <Badge variant="outline">{statistics?.useCaseCount || 0}</Badge>
                    </div>
                    <Progress value={statistics?.useCaseCount ? Math.min(statistics.useCaseCount * 10, 100) : 0} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Customer and User Journeys</span>
                      <Badge variant="outline">{statistics?.customerJourneyCount || 0}</Badge>
                    </div>
                    <Progress value={statistics?.customerJourneyCount ? Math.min(statistics.customerJourneyCount * 10, 100) : 0} className="h-2" />
                  </div>
                  
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-xs text-muted-foreground">
                      Last updated: {statistics ? new Date(statistics.timestamp).toLocaleTimeString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* File System Stats Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <FolderTree className="h-5 w-5 mr-2" />
                  File System
                </CardTitle>
                <CardDescription>
                  Total files: {statistics?.fileSystem?.totalFiles || 0} ({statistics?.fileSystem?.totalSizeMB?.toFixed(2) || 0} MB)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {statistics?.fileSystem?.byType && statistics.fileSystem.byType.map((fileType) => (
                    <div key={fileType.extension}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium flex items-center">
                          <FileText className="h-3 w-3 mr-1" />
                          {fileType.extension || 'unknown'}
                        </span>
                        <Badge variant="outline">{fileType.count} files</Badge>
                      </div>
                      <div className="flex items-center">
                        <Progress 
                          value={fileType.count / (statistics?.fileSystem?.totalFiles || 1) * 100} 
                          className="h-2 flex-grow" 
                        />
                        <span className="text-xs text-muted-foreground ml-2 min-w-[45px] text-right">
                          {fileType.sizeMB.toFixed(1)} MB
                        </span>
                      </div>
                    </div>
                  ))}
                  {!statistics?.fileSystem?.byType && (
                    <div className="py-4 text-center text-muted-foreground">
                      No file system data available
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-xs text-muted-foreground">
                      File types distribution
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Database Stats Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Database className="h-5 w-5 mr-2" />
                  Database Statistics
                </CardTitle>
                <CardDescription>
                  Database size: {statistics?.database?.totalSizeMB?.toFixed(2) || 0} MB
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableCaption>
                    Total tables: {statistics?.database?.tableCount || 0}, 
                    Total records: {statistics?.database?.totalRowCount || 0}
                  </TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Table</TableHead>
                      <TableHead className="text-right">Size (MB)</TableHead>
                      <TableHead className="text-right">Records</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {statistics?.database?.tables && statistics.database.tables.map((table) => (
                      <TableRow key={table.name}>
                        <TableCell className="font-medium">{table.name}</TableCell>
                        <TableCell className="text-right">{table.sizeMB.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{table.rowCount}</TableCell>
                      </TableRow>
                    ))}
                    {(!statistics?.database?.tables || statistics.database.tables.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                          No database tables found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}