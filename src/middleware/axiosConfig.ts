// Utility function for API calls with auto token injection
export const apiCall = async (
  url: string,
  options: RequestInit = {},
  token?: string
) => {
  // ✅ Type-safe headers object
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };

  // ✅ Add token if available
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // ✅ Error handling
  if (!response.ok) {
    let errorMessage = `API Error: ${response.status}`;

    try {
      const errorData = await response.json();
      if (errorData?.message) {
        errorMessage = errorData.message;
      }
    } catch (_) {
      // ignore JSON parse error
    }

    throw new Error(errorMessage);
  }

  return response.json();
};

// ================================
// Hook for getting token from localStorage
// (Client-side only)
// ================================
export const getTokenFromStorage = (): string | null => {
  if (typeof window === "undefined") return null;

  try {
    const persistedState = localStorage.getItem("persist:root");
    if (!persistedState) return null;

    const rootState = JSON.parse(persistedState);
    if (!rootState.auth) return null;

    const authState = JSON.parse(rootState.auth);
    return authState?.token ?? null;
  } catch (error) {
    console.error("Error reading token from storage:", error);
    return null;
  }
};
