const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface LoginCredentials {
  email: string;
  password: string;
}

export const adminLogin = async (
  credentials: LoginCredentials
): Promise<{ token: string; adminInfo: any }> => {
  if (!API_URL) {
    throw new Error('NEXT_PUBLIC_API_URL not defined');
  }

  const response = await fetch(`${API_URL}/admin/admin-log-in`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Login failed');
  }

  return {
    token: data.token,
    adminInfo: data.adminInfo || { email: credentials.email },
  };
};
