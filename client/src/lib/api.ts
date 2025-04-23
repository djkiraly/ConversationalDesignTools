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
export async function generateJourneySummary(
  journeyTitle: string,
  customerName: string,
  workflowIntent: string,
  nodes: { stepType: string; title: string; description: string }[]
): Promise<string> {
  const response = await apiRequest<{ success: boolean; summary: string }>(
    `/api/generate-journey-summary`,
    'POST',
    { journeyTitle, customerName, workflowIntent, nodes }
  );
  
  if (response.error) {
    throw new Error(response.error);
  }
  
  if (!response.data || !response.data.success) {
    throw new Error('Failed to generate journey summary');
  }
  
  return response.data.summary;
}

// Generate a customer journey using AI
export interface GeneratedJourney {
  nodes: any[];
  edges: any[];
  summary?: string;
}

export interface GenerateJourneyRequest {
  title: string;
  customerName: string;
  intent: string;
}

export async function generateAIJourney(request: GenerateJourneyRequest): Promise<GeneratedJourney> {
  const response = await apiRequest<{ success: boolean; journey: GeneratedJourney; error?: string }>(
    '/api/generate-ai-journey',
    'POST',
    request
  );
  
  if (response.error) {
    throw new Error(response.error);
  }
  
  if (!response.data || !response.data.success) {
    throw new Error(response.data?.error || 'Failed to generate AI journey');
  }
  
  return response.data.journey;
}

// App Statistics API
export interface AppStatistics {
  useCaseCount: number;
  customerJourneyCount: number;
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

// Customer API functions
export interface Customer {
  id: number;
  companyName: string;
  companyWebsite?: string;
  primaryContactName: string;
  primaryContactPhone?: string;
  primaryContactEmail: string;
  createdAt: string;
  updatedAt: string;
}

export async function getAllCustomers(): Promise<Customer[]> {
  const response = await apiRequest<Customer[]>('/api/customers');
  if (response.error) {
    throw new Error(response.error);
  }
  return response.data || [];
}

export async function getCustomer(id: number): Promise<Customer> {
  const response = await apiRequest<Customer>(`/api/customers/${id}`);
  if (response.error) {
    throw new Error(response.error);
  }
  if (!response.data) {
    throw new Error(`Customer with id ${id} not found`);
  }
  return response.data;
}

export async function createCustomer(customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer> {
  const response = await apiRequest<Customer>('/api/customers', 'POST', customer);
  if (response.error) {
    throw new Error(response.error);
  }
  if (!response.data) {
    throw new Error('Failed to create customer');
  }
  
  queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
  return response.data;
}

export async function updateCustomer(id: number, customer: Partial<Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Customer> {
  const response = await apiRequest<Customer>(`/api/customers/${id}`, 'PUT', customer);
  if (response.error) {
    throw new Error(response.error);
  }
  if (!response.data) {
    throw new Error(`Failed to update customer with id ${id}`);
  }
  
  queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
  queryClient.invalidateQueries({ queryKey: ['/api/customers', id] });
  return response.data;
}

export async function deleteCustomer(id: number): Promise<void> {
  const response = await apiRequest(`/api/customers/${id}`, 'DELETE');
  if (response.error) {
    throw new Error(response.error);
  }
  
  queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
}