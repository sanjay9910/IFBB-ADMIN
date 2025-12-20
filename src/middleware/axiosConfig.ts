// Utility function for API calls with auto token injection
export const apiCall = async (
  url: string,
  options: RequestInit = {},
  token?: string
) => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add token if available
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `API Error: ${response.status}`);
  }

  return response.json();
};

// Hook for getting token from localStorage (Client-side only)
export const getTokenFromStorage = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const persistedState = localStorage.getItem('persist:root');
    if (!persistedState) return null;
    
    const state = JSON.parse(persistedState);
    const authState = JSON.parse(state.auth);
    return authState.token || null;
  } catch (error) {
    console.error('Error reading token from storage:', error);
    return null;
  }
};