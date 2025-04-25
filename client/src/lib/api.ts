// API service for making requests to the backend
import { queryClient } from './queryClient';

export interface APIResponse<T> {
  data?: T;
  error?: string;
}

export async function apiRequest<T = any>(
  url: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
  body?: any
): Promise<APIResponse<T>> {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const options: RequestInit = {
      method,
      headers,
    };

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    
    if (!response.ok) {
      if (response.status === 404) {
        return { error: `Not found: ${url}` };
      }

      let errorText: string;
      try {
        const errorJson = await response.json();
        errorText = errorJson.error || `Request failed with status ${response.status}`;
      } catch (e) {
        errorText = `Request failed with status ${response.status}`;
      }
      
      return { error: errorText };
    }

    // For DELETE requests, we might not have any data to return
    if (method === 'DELETE' && response.status === 204) {
      return {};
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    return { error: (error as Error).message || 'An unknown error occurred' };
  }
}

// Customer Journey-specific API functions
export interface CustomerJourney {
  id: number;
  title: string;
  customerName?: string;
  workflowIntent?: string;
  notes?: string;
  summary?: string;
  nodes: any[];
  edges: any[];
  createdAt: string;
  updatedAt: string;
}

export async function fetchAllCustomerJourneys(): Promise<CustomerJourney[]> {
  const response = await apiRequest<CustomerJourney[]>('/api/customer-journeys');
  if (response.error) {
    throw new Error(response.error);
  }
  return response.data || [];
}

// Alias for fetchAllCustomerJourneys for better naming consistency
export const getCustomerJourneys = fetchAllCustomerJourneys;

export async function fetchCustomerJourney(id: number): Promise<CustomerJourney> {
  const response = await apiRequest<CustomerJourney>(`/api/customer-journeys/${id}`);
  if (response.error) {
    throw new Error(response.error);
  }
  if (!response.data) {
    throw new Error(`Customer journey with id ${id} not found`);
  }
  return response.data;
}

export async function createCustomerJourney(journey: Omit<CustomerJourney, 'id' | 'createdAt' | 'updatedAt'>): Promise<CustomerJourney> {
  const response = await apiRequest<CustomerJourney>('/api/customer-journeys', 'POST', journey);
  if (response.error) {
    throw new Error(response.error);
  }
  if (!response.data) {
    throw new Error('Failed to create customer journey');
  }
  
  queryClient.invalidateQueries({ queryKey: ['/api/customer-journeys'] });
  return response.data;
}

export async function updateCustomerJourney(id: number, journey: Partial<Omit<CustomerJourney, 'id' | 'createdAt' | 'updatedAt'>>): Promise<CustomerJourney> {
  const response = await apiRequest<CustomerJourney>(`/api/customer-journeys/${id}`, 'PUT', journey);
  if (response.error) {
    throw new Error(response.error);
  }
  if (!response.data) {
    throw new Error(`Failed to update customer journey with id ${id}`);
  }
  
  queryClient.invalidateQueries({ queryKey: ['/api/customer-journeys'] });
  queryClient.invalidateQueries({ queryKey: ['/api/customer-journeys', id] });
  return response.data;
}

export async function deleteCustomerJourney(id: number): Promise<void> {
  const response = await apiRequest(`/api/customer-journeys/${id}`, 'DELETE');
  if (response.error) {
    throw new Error(response.error);
  }
  
  queryClient.invalidateQueries({ queryKey: ['/api/customer-journeys'] });
}

export async function deleteAllCustomerJourneys(): Promise<void> {
  // Fetch all journeys first
  const journeys = await fetchAllCustomerJourneys();
  
  // Delete each journey
  for (const journey of journeys) {
    await deleteCustomerJourney(journey.id);
  }
  
  queryClient.invalidateQueries({ queryKey: ['/api/customer-journeys'] });
}

// Generate a summary for a customer journey using AI
export async function generateJourneySummary(journeyId: number): Promise<CustomerJourney> {
  const response = await apiRequest<{ success: boolean; journey: CustomerJourney }>(
    `/api/customer-journeys/${journeyId}/generate-summary`,
    'POST'
  );
  
  if (response.error) {
    throw new Error(response.error);
  }
  
  if (!response.data || !response.data.success) {
    throw new Error('Failed to generate journey summary');
  }
  
  // Invalidate queries to refresh data
  queryClient.invalidateQueries({ queryKey: ['/api/customer-journeys'] });
  queryClient.invalidateQueries({ queryKey: ['/api/customer-journeys', journeyId] });
  
  return response.data.journey;
}

// Generate a customer journey using AI
export interface GeneratedJourney {
  nodes: any[];
  edges: any[];
}

export async function generateAIJourney(description: string): Promise<GeneratedJourney> {
  const response = await apiRequest<{ success: boolean; journey: GeneratedJourney }>(
    '/api/generate-ai-journey',
    'POST',
    { description }
  );
  
  if (response.error) {
    throw new Error(response.error);
  }
  
  if (!response.data || !response.data.success) {
    throw new Error('Failed to generate AI journey');
  }
  
  return response.data.journey;
}

// Customer API
export interface Customer {
  id: number;
  companyName: string;
  companyWebsite: string | null;
  primaryContactName: string;
  primaryContactEmail: string | null;
  primaryContactPhone: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function fetchAllCustomers(): Promise<Customer[]> {
  const response = await apiRequest<Customer[]>('/api/customers');
  if (response.error) {
    throw new Error(response.error);
  }
  return response.data || [];
}

export async function fetchCustomer(id: number): Promise<Customer> {
  const response = await apiRequest<Customer>(`/api/customers/${id}`);
  if (response.error) {
    throw new Error(response.error);
  }
  if (!response.data) {
    throw new Error(`Customer with id ${id} not found`);
  }
  return response.data;
}

// Action Plan API
export interface ActionPlan {
  id: number;
  title: string;
  status: string;
  customerId: number | null;
  industry: string | null;
  primaryChannel: string | null;
  interactionVolume: string | null;
  currentAutomation: string | null;
  biggestChallenge: string | null;
  repetitiveProcesses: string | null;
  aiGoals: string[];
  goalDetails: Record<string, string>;
  autonomyLevel: string | null;
  currentPlatforms: string | null;
  teamComfort: string | null;
  apisAvailable: string | null;
  successMetrics: string[];
  createdAt: string;
  updatedAt: string;
}

export async function fetchAllActionPlans(): Promise<ActionPlan[]> {
  const response = await apiRequest<ActionPlan[]>('/api/action-plans');
  if (response.error) {
    throw new Error(response.error);
  }
  return response.data || [];
}

export async function fetchActionPlan(id: number): Promise<ActionPlan> {
  const response = await apiRequest<ActionPlan>(`/api/action-plans/${id}`);
  if (response.error) {
    throw new Error(response.error);
  }
  if (!response.data) {
    throw new Error(`Action plan with id ${id} not found`);
  }
  return response.data;
}

export async function createActionPlan(actionPlan: Omit<ActionPlan, 'id' | 'createdAt' | 'updatedAt'>): Promise<ActionPlan> {
  const response = await apiRequest<ActionPlan>('/api/action-plans', 'POST', actionPlan);
  if (response.error) {
    throw new Error(response.error);
  }
  if (!response.data) {
    throw new Error('Failed to create action plan');
  }
  
  queryClient.invalidateQueries({ queryKey: ['/api/action-plans'] });
  return response.data;
}

export async function updateActionPlan(id: number, actionPlan: Partial<Omit<ActionPlan, 'id' | 'createdAt' | 'updatedAt'>>): Promise<ActionPlan> {
  const response = await apiRequest<ActionPlan>(`/api/action-plans/${id}`, 'PUT', actionPlan);
  if (response.error) {
    throw new Error(response.error);
  }
  if (!response.data) {
    throw new Error(`Failed to update action plan with id ${id}`);
  }
  
  queryClient.invalidateQueries({ queryKey: ['/api/action-plans'] });
  queryClient.invalidateQueries({ queryKey: ['/api/action-plans', id] });
  return response.data;
}

export async function deleteActionPlan(id: number): Promise<void> {
  const response = await apiRequest(`/api/action-plans/${id}`, 'DELETE');
  if (response.error) {
    throw new Error(response.error);
  }
  
  queryClient.invalidateQueries({ queryKey: ['/api/action-plans'] });
}

// Use Case API
export interface UseCase {
  id: number;
  title: string;
  description: string | null;
  customer: string | null;
  
  // New fields for properly defining and scoping the use case
  problemStatement: string | null;
  proposedSolution: string | null;
  keyObjectives: string | null;
  requiredDataInputs: string | null;
  expectedOutputs: string | null;
  keyStakeholders: string | null;
  scope: string | null;
  potentialRisks: string | null;
  estimatedImpact: string | null;
  
  conversationFlow: string;
  nodePositions: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function fetchAllUseCases(): Promise<UseCase[]> {
  const response = await apiRequest<UseCase[]>('/api/use-cases');
  if (response.error) {
    throw new Error(response.error);
  }
  return response.data || [];
}

export async function fetchUseCase(id: number): Promise<UseCase> {
  const response = await apiRequest<UseCase>(`/api/use-cases/${id}`);
  if (response.error) {
    throw new Error(response.error);
  }
  if (!response.data) {
    throw new Error(`Use case with id ${id} not found`);
  }
  return response.data;
}

export async function createUseCase(useCase: Omit<UseCase, 'id' | 'createdAt' | 'updatedAt'>): Promise<UseCase> {
  const response = await apiRequest<UseCase>('/api/use-cases', 'POST', useCase);
  if (response.error) {
    throw new Error(response.error);
  }
  if (!response.data) {
    throw new Error('Failed to create use case');
  }
  
  queryClient.invalidateQueries({ queryKey: ['/api/use-cases'] });
  return response.data;
}

export async function updateUseCase(id: number, useCase: Partial<Omit<UseCase, 'id' | 'createdAt' | 'updatedAt'>>): Promise<UseCase> {
  // Use PATCH for partial updates instead of PUT which replaces the entire resource
  const response = await apiRequest<UseCase>(`/api/use-cases/${id}`, 'PATCH', useCase);
  if (response.error) {
    throw new Error(response.error);
  }
  if (!response.data) {
    throw new Error(`Failed to update use case with id ${id}`);
  }
  
  queryClient.invalidateQueries({ queryKey: ['/api/use-cases'] });
  queryClient.invalidateQueries({ queryKey: ['/api/use-cases', id] });
  return response.data;
}

export async function deleteUseCase(id: number): Promise<void> {
  const response = await apiRequest(`/api/use-cases/${id}`, 'DELETE');
  if (response.error) {
    throw new Error(response.error);
  }
  
  queryClient.invalidateQueries({ queryKey: ['/api/use-cases'] });
}

// Generate AI suggestions for use case fields
export interface UseCaseDetailsSuggestions {
  problemStatement: string;
  proposedSolution: string;
  keyObjectives: string;
  requiredDataInputs: string;
  expectedOutputs: string;
  keyStakeholders: string;
  scope: string;
  potentialRisks: string;
  estimatedImpact: string;
}

export async function generateUseCaseDetails(id: number): Promise<UseCaseDetailsSuggestions> {
  const response = await apiRequest<{ success: boolean; suggestions: UseCaseDetailsSuggestions }>(
    `/api/use-cases/${id}/generate-details`,
    'POST'
  );
  
  if (response.error) {
    throw new Error(response.error);
  }
  
  if (!response.data || !response.data.success || !response.data.suggestions) {
    throw new Error('Failed to generate use case details');
  }
  
  return response.data.suggestions;
}

// App Statistics API
export interface AppStatistics {
  useCaseCount: number;
  customerJourneyCount: number;
  actionPlanCount: number;
  database: {
    totalSizeMB: number;
    tables: {
      name: string;
      sizeMB: number;
      rowCount: number;
    }[];
    tableCount: number;
    totalRowCount: number;
  };
  fileSystem: {
    totalFiles: number;
    totalSizeMB: number;
    byType: {
      extension: string;
      count: number;
      sizeMB: number;
    }[];
  };
  timestamp: string;
}

export async function fetchAppStatistics(): Promise<AppStatistics> {
  const response = await apiRequest<AppStatistics>('/api/statistics');
  
  if (response.error) {
    throw new Error(response.error);
  }
  
  if (!response.data) {
    throw new Error('Failed to retrieve application statistics');
  }
  
  return response.data;
}

// AI Suggestions API
export interface AIActionPlanSuggestions {
  success: boolean;
  suggestions: string;
}

export async function generateActionPlanSuggestions(planId: number): Promise<string> {
  const response = await apiRequest<AIActionPlanSuggestions>(
    `/api/action-plans/${planId}/suggestions`,
    'POST'
  );
  
  if (response.error) {
    throw new Error(response.error);
  }
  
  if (!response.data || !response.data.success) {
    throw new Error('Failed to generate suggestions');
  }
  
  return response.data.suggestions;
}