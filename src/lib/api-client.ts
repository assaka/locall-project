// Frontend API utility for authenticated requests
const API_BASE_URL = '';
const AUTH_TOKEN = 'demo-token';

interface ApiOptions extends RequestInit {
  params?: Record<string, string>;
}

export async function apiCall(endpoint: string, options: ApiOptions = {}) {
  const { params, ...fetchOptions } = options;
  
  // Build URL with query parameters
  let url = `${API_BASE_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }
  
  // Default headers
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${AUTH_TOKEN}`,
    ...fetchOptions.headers,
  };
  
  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API Error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}

// Convenience methods
export const api = {
  get: (endpoint: string, params?: Record<string, string>) => 
    apiCall(endpoint, { method: 'GET', params }),
    
  post: (endpoint: string, data?: any) => 
    apiCall(endpoint, { 
      method: 'POST', 
      body: data ? JSON.stringify(data) : undefined 
    }),
    
  put: (endpoint: string, data?: any) => 
    apiCall(endpoint, { 
      method: 'PUT', 
      body: data ? JSON.stringify(data) : undefined 
    }),
    
  patch: (endpoint: string, data?: any) => 
    apiCall(endpoint, { 
      method: 'PATCH', 
      body: data ? JSON.stringify(data) : undefined 
    }),
    
  delete: (endpoint: string, data?: any) => 
    apiCall(endpoint, { 
      method: 'DELETE', 
      body: data ? JSON.stringify(data) : undefined 
    }),
};
