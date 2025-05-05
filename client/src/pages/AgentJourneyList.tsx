import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Bot, 
  Plus, 
  Search, 
  Trash2, 
  Loader2, 
  ArrowRight, 
  CalendarDays 
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { AgentJourney } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

const AgentJourneyList: React.FC = () => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'alphabetical'>('newest');
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  // Fetch all agent journeys
  const { 
    data: agentJourneys = [], 
    isLoading,
    error
  } = useQuery<AgentJourney[]>({
    queryKey: ['/api/agent-journeys'],
  });

  // Handle deleting an agent journey
  const deleteMutation = useMutation({
    mutationFn: (id: number) => {
      return apiRequest('/api/agent-journeys/' + id, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/agent-journeys'] });
      toast({
        title: 'Journey Deleted',
        description: 'The agent journey was successfully deleted.'
      });
      setConfirmDeleteId(null);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to delete journey: ${(error as Error).message}`,
        variant: 'destructive'
      });
    }
  });

  // Filter and sort journeys based on search term and sort order
  const filteredJourneys = agentJourneys
    .filter(journey => 
      journey.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (journey.agentName && journey.agentName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (journey.purpose && journey.purpose.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      if (sortOrder === 'newest') {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      } else if (sortOrder === 'oldest') {
        return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      } else { // alphabetical
        return a.title.localeCompare(b.title);
      }
    });

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    }).format(date);
  };

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                Error loading agent journeys: {(error as Error).message}
              </p>
            </div>
          </div>
        </div>
        <Button onClick={() => window.location.reload()}>Reload Page</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div className="mb-4 sm:mb-0">
          <h1 className="text-2xl font-bold flex items-center">
            <Bot className="mr-2 h-6 w-6" />
            Agent Journeys
          </h1>
          <p className="text-muted-foreground mt-1">
            Create and manage AI agent journey workflows
          </p>
        </div>
        <Button onClick={() => navigate('/agent-journey')}>
          <Plus className="mr-2 h-4 w-4" />
          Create New Journey
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search agent journeys..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select
          value={sortOrder}
          onValueChange={(value) => setSortOrder(value as 'newest' | 'oldest' | 'alphabetical')}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="alphabetical">Alphabetical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-lg">Loading journeys...</span>
        </div>
      ) : filteredJourneys.length === 0 ? (
        <div className="bg-background border rounded-lg p-12 text-center">
          <Bot className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-medium mb-2">No Agent Journeys Found</h3>
          {searchTerm ? (
            <p className="text-muted-foreground">
              No journeys match your search criteria. Try a different search term or create a new journey.
            </p>
          ) : (
            <p className="text-muted-foreground">
              You haven't created any agent journeys yet. Get started by creating your first journey.
            </p>
          )}
          <Button className="mt-4" onClick={() => navigate('/agent-journey')}>
            <Plus className="mr-2 h-4 w-4" />
            Create New Journey
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJourneys.map(journey => (
            <Card 
              key={journey.id}
              className="transition-all hover:shadow-md"
            >
              <CardHeader>
                <CardTitle className="truncate">{journey.title}</CardTitle>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <CalendarDays className="h-3 w-3 mr-1" />
                  <span>Updated: {formatDate(journey.updatedAt)}</span>
                </div>
              </CardHeader>

              <CardContent>
                <div className="mb-2">
                  <span className="font-medium">Agent: </span>
                  <span className="text-muted-foreground">{journey.agentName || 'Unnamed Agent'}</span>
                </div>
                {journey.purpose && (
                  <div className="text-sm text-muted-foreground line-clamp-3 mb-2">
                    {journey.purpose}
                  </div>
                )}
              </CardContent>

              <CardFooter className="flex justify-between">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setConfirmDeleteId(journey.id)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={() => navigate(`/agent-journey/${journey.id}`)}
                >
                  Edit
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={confirmDeleteId !== null} onOpenChange={() => setConfirmDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this agent journey? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button 
              variant="destructive" 
              onClick={() => confirmDeleteId && deleteMutation.mutate(confirmDeleteId)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && (
                <Loader2 size={16} className="mr-1 animate-spin" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AgentJourneyList;