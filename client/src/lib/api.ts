// API service for making requests to the backend
import { queryClient } from './queryClient';

export interface APIResponse<T> {
  data?: T;
  error?: string;
}

export async function apiRequest<T = any>(
  url: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
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