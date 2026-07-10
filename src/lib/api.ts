
function getDefaultApiBaseUrl() {
  if (typeof window === 'undefined') {
    return 'http://localhost:8000';
  }
  if (import.meta.env.PROD) {
    return `${window.location.origin}/api`;
  }
  return `${window.location.protocol}//${window.location.hostname}:8000`;
}

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || getDefaultApiBaseUrl();

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

let memoryToken: string | null = null;
let memoryRole: string | null = null;

export function getToken(): string | null {
  if (memoryToken) return memoryToken;
  try {
    const sessionToken = sessionStorage.getItem('token');
    if (sessionToken) {
      memoryToken = sessionToken;
      return sessionToken;
    }
  } catch (e) {
    // ignore
  }
  return null;
}

export function setToken(token: string | null) {
  memoryToken = token;
  try {
    if (token) {
      sessionStorage.setItem('token', token);
    } else {
      sessionStorage.removeItem('token');
    }
  } catch (e) {
    // ignore
  }
}

export function getRole(): string | null {
  if (memoryRole) return memoryRole;
  try {
    const sessionRole = sessionStorage.getItem('role');
    if (sessionRole) {
      memoryRole = sessionRole;
      return sessionRole;
    }
  } catch (e) {
    // ignore
  }
  return null;
}

export function setRole(role: string | null) {
  memoryRole = role;
  try {
    if (role) {
      sessionStorage.setItem('role', role);
    } else {
      sessionStorage.removeItem('role');
    }
  } catch (e) {
    // ignore
  }
}

export async function fetchApi<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  // The backend is tunneled via ngrok's free tier, which serves an HTML
  // interstitial warning page (no CORS headers) to requests that look like
  // they come from a browser. This header bypasses that page.
  headers.set('ngrok-skip-browser-warning', 'true');
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const isLoginRequest = path.replace(/^\/+/, '') === 'auth/login';
    if (response.status === 401 && !isLoginRequest) {
      setToken(null);
      setRole(null);
      window.location.href = '/login';
    }

    let errorMessage = 'An error occurred';
    try {
      const errorData = await response.json();
      if (errorData.detail) {
        if (typeof errorData.detail === 'string') {
          errorMessage = errorData.detail;
        } else if (Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail.map((d: any) => d.msg).join(', ');
        }
      } else if (errorData.message) {
        errorMessage = errorData.message;
      }
    } catch (e) {
      errorMessage = response.statusText;
    }
    throw new ApiError(errorMessage, response.status);
  }

  if (response.status === 204) {
    return {} as T;
  }

  // Handle CSV export streaming which shouldn't be parsed as JSON
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('text/csv')) {
    const blob = await response.blob();
    return blob as unknown as T;
  }

  return response.json();
}
