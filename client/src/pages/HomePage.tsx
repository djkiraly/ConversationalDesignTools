import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Map, Settings, Home as HomeIcon, ArrowRight } from 'lucide-react';

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
  // Define the list of application pages
  const appPages: AppPage[] = [
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
      title: 'Customer Journey',
      description: 'Design and visualize customer interaction workflows with interactive flow diagrams',
      icon: <Map className="h-6 w-6" />,
      path: '/customer-journey',
      color: 'bg-blue-50 text-blue-700 border-blue-200'
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
          This application provides tools to design conversational flows and customer journeys:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Use <strong>Happy Path</strong> to define the optimal conversation flows for your AI agents</li>
          <li>Create a <strong>Customer Journey</strong> map to visualize the end-to-end user experience</li>
          <li>Configure AI behavior and system settings in the <strong>Settings</strong> page</li>
        </ul>
      </div>
    </div>
  );
}