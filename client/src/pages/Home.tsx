import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { UseCase } from "@shared/schema";
import { parseConversationFlow, parseConversationFlowWithTypes } from "@/lib/parseConversation";

import Sidebar from "@/components/Sidebar";
import Editor from "@/components/Editor";
import FlowPreview from "@/components/FlowPreview";
import NewUseCaseModal from "@/components/NewUseCaseModal";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Home() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const [isNewUseCaseModalOpen, setIsNewUseCaseModalOpen] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  
  // Queries
  const { 
    data: useCases = [], 
    isLoading: isLoadingUseCases,
    error: useCasesError
  } = useQuery<UseCase[]>({
    queryKey: ['/api/use-cases'],
  });

  const { 
    data: activeUseCase,
    isLoading: isLoadingActiveUseCase
  } = useQuery<UseCase | null>({
    queryKey: ['/api/use-cases', params?.id],
    enabled: !!params?.id,
  });

  // Set default use case if none is selected
  useEffect(() => {
    if (!params?.id && useCases.length > 0 && !isLoadingUseCases) {
      setLocation(`/use-case/${useCases[0].id}`);
    }
  }, [params?.id, useCases, isLoadingUseCases, setLocation]);

  // Parse conversation flow for visualization with step type detection
  const parsedFlow = activeUseCase ? parseConversationFlowWithTypes(activeUseCase.conversationFlow) : { steps: [] };

  // Mutations
  const createUseCaseMutation = useMutation({
    mutationFn: async (useCase: { title: string; description?: string }) => {
      const response = await apiRequest('POST', '/api/use-cases', {
        ...useCase,
        conversationFlow: ''
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/use-cases'] });
      setLocation(`/use-case/${data.id}`);
      setIsNewUseCaseModalOpen(false);
      toast({
        title: "Use case created",
        description: "Your new use case has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error creating use case",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const updateUseCaseMutation = useMutation({
    mutationFn: async (useCase: Partial<UseCase> & { id: number }) => {
      const { id, ...data } = useCase;
      const response = await apiRequest('PUT', `/api/use-cases/${id}`, data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/use-cases'] });
      queryClient.invalidateQueries({ queryKey: ['/api/use-cases', data.id.toString()] });
      toast({
        title: "Changes saved",
        description: "Your changes have been saved successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error saving changes",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const deleteUseCaseMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/use-cases/${id}`);
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['/api/use-cases'] });
      if (useCases.length > 1) {
        const newActiveId = useCases.find(u => u.id !== id)?.id;
        if (newActiveId) {
          setLocation(`/use-case/${newActiveId}`);
        }
      } else {
        setLocation('/');
      }
      toast({
        title: "Use case deleted",
        description: "The use case has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error deleting use case",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleCreateUseCase = (data: { title: string; description?: string }) => {
    createUseCaseMutation.mutate(data);
  };

  const handleUpdateUseCase = (data: Partial<UseCase>) => {
    if (activeUseCase) {
      updateUseCaseMutation.mutate({ ...data, id: activeUseCase.id });
    }
  };

  const handleDeleteUseCase = (id: number) => {
    deleteUseCaseMutation.mutate(id);
  };

  if (useCasesError) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="max-w-md p-6 bg-white rounded-lg shadow-lg">
          <h2 className="text-xl font-bold text-red-600 mb-4">Error Loading Data</h2>
          <p className="text-gray-700 mb-4">{(useCasesError as Error).message}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-light"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-neutral-light text-neutral-dark">
      {/* Mobile sidebar toggle */}
      {isMobile && (
        <button 
          onClick={() => setShowMobileSidebar(!showMobileSidebar)}
          className="fixed bottom-4 left-4 z-30 bg-primary text-white p-3 rounded-full shadow-lg"
        >
          <i className="fas fa-bars"></i>
        </button>
      )}

      {/* Sidebar */}
      <Sidebar 
        useCases={useCases}
        activeUseCaseId={Number(params?.id)}
        isLoading={isLoadingUseCases}
        onNewUseCase={() => setIsNewUseCaseModalOpen(true)}
        onSelectUseCase={(id) => setLocation(`/use-case/${id}`)}
        onDeleteUseCase={handleDeleteUseCase}
        isMobile={isMobile}
        isVisible={!isMobile || showMobileSidebar}
        onClose={() => setShowMobileSidebar(false)}
      />

      {/* Main Content */}
      <div className={`flex-1 flex flex-col md:flex-row overflow-hidden ${showMobileSidebar && isMobile ? 'filter blur-sm' : ''}`}>
        {activeUseCase ? (
          <>
            <Editor 
              useCase={activeUseCase}
              isLoading={isLoadingActiveUseCase}
              onSave={handleUpdateUseCase}
            />
            <FlowPreview 
              useCase={activeUseCase}
              parsedFlow={parsedFlow}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            {isLoadingUseCases ? (
              <p className="text-lg">Loading use cases...</p>
            ) : useCases.length === 0 ? (
              <div className="text-center max-w-md p-6">
                <h2 className="text-2xl font-bold mb-4">Welcome to Happy Path Designer</h2>
                <p className="mb-6">Get started by creating your first conversational AI use case</p>
                <button 
                  onClick={() => setIsNewUseCaseModalOpen(true)}
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-light"
                >
                  Create First Use Case
                </button>
              </div>
            ) : (
              <p className="text-lg">Select a use case from the sidebar to get started</p>
            )}
          </div>
        )}
      </div>

      {/* New Use Case Modal */}
      <NewUseCaseModal 
        isOpen={isNewUseCaseModalOpen}
        onClose={() => setIsNewUseCaseModalOpen(false)}
        onSubmit={handleCreateUseCase}
      />
    </div>
  );
}
