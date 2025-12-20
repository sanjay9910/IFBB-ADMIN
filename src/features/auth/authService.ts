const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface LoginResponse {
  message: string;
  token: string;
  adminInfo?: any;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

// Admin login API call
export const adminLogin = async (credentials: LoginCredentials): Promise<{ token: string; adminInfo: any }> => {
  try {
    const url = `${API_URL}/admin/admin-log-in`;
    
    console.log('🔵 API_URL:', API_URL);
    console.log('🔵 Full URL:', url);
    console.log('🔵 Credentials:', credentials);

    if (!API_URL) {
      throw new Error('❌ NEXT_PUBLIC_API_URL is not defined in .env.local');
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    console.log('🔵 Response Status:', response.status);
    console.log('🔵 Content-Type:', response.headers.get('content-type'));

    // Get response text first
    const responseText = await response.text();
    console.log('🔵 Response Text (first 500 chars):', responseText.substring(0, 500));

    // Check if response is valid JSON
    if (!response.ok) {
      console.error('❌ API Error Status:', response.status);
      
      // Try to parse as JSON
      try {
        const errorData = JSON.parse(responseText);
        throw new Error(errorData.message || `Error: ${response.status}`);
      } catch (e) {
        // If not JSON, return generic error with status
        throw new Error(`API Error ${response.status}: ${response.statusText}`);
      }
    }

    // Parse successful response
    let data: LoginResponse;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ JSON Parse Error:', parseError);
      console.error('❌ Response was:', responseText.substring(0, 200));
      throw new Error('Server returned invalid JSON. Check console logs.');
    }

    console.log('✅ Login Success!', data);

    // Return token + admin info
    return {
      token: data.token,
      adminInfo: {
        email: credentials.email,
      },
    };
  } catch (error: any) {
    console.error('❌ Login Error:', error.message);
    throw new Error(error.message || 'Network error - Check console');
  }
};