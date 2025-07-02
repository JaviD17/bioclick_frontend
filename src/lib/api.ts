// Types matching your FastAPI models

// ===== TYPES =====
export interface User {
  id: number;
  username: string;
  email: string;
  full_name?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Link {
  id: number;
  title: string;
  url: string;
  description?: string;
  is_active: boolean;
  display_order: number;
  click_count: number;
  created_at: string;
  updated_at?: string;
  user_id: number;
  icon?: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}

export interface UserLogin {
  username: string;
  password: string;
}

export interface UserRegister {
  username: string;
  email: string;
  password: string;
  full_name?: string;
}

export interface LinkCreate {
  title: string;
  url: string;
  description?: string;
  is_active: boolean;
  display_order: number;
  icon?: string;
}

export interface LinkUpdate {
  title?: string;
  url?: string;
  description?: string;
  is_active?: boolean;
  display_order?: number;
  icon?: string;
}

export interface UserUpdate {
  email?: string;
  full_name?: string;
}

// ===== POST-AUTH =====
export interface PasswordChange {
  current_password: string;
  new_password: string;
}

export interface GeographicResponse {
  total_countries: number;
  top_countries: CountryStats[];
  city_breakdown: CityStats[];
  geographic_trends: Array<{ date: string; clicks: number }>;
}

export interface AnalyticsResponse {
  total_clicks: number;
  unique_visitors: number;
  daily_stats: Array<{ date: string; clicks: number }>;
  top_links: Array<{
    link_id: number;
    title: string;
    clicks: number;
    percentage: number;
  }>;
  device_stats: Array<{
    device_type: string;
    count: number;
    percentage: number;
  }>;
  growth_percentage: number;
}

export interface CountryStats {
  country_code: string;
  country_name: string;
  clicks: number;
  percentage: number;
  unique_visitors: number;
}

export interface CityStats {
  city: string;
  country_code: string;
  country_name: string;
  clicks: number;
  percentage: number;
}

// ===== PRE-AUTH =====
export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  new_password: string;
}

// ===== ENVIRONMENT CONFIGURATION =====
const getApiBaseUrl = (): string => {
  // Production URL
  if (import.meta.env.PROD) {
    return import.meta.env.VITE_API_BASE_URL || "https://your-api-domain.com";
  }

  // Development URL
  return import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
};

// ===== CONSTANTS =====
const DEFAULT_BASE_URL = getApiBaseUrl();
const TOKEN_KEY = "biotap_token" as const;

// ===== UTILITY FUNCTIONS =====
const isClientSide = (): boolean => typeof window !== "undefined";

const getStoredToken = (): string | null => {
  return isClientSide() ? localStorage.getItem(TOKEN_KEY) : null;
};

const setStoredToken = (token: string): void => {
  if (isClientSide()) {
    localStorage.setItem(TOKEN_KEY, token);
  }
};

const removeStoredToken = (): void => {
  if (isClientSide()) {
    localStorage.removeItem(TOKEN_KEY);
  }
};

// ===== API CLIENT CLASS =====
class ApiClient {
  private readonly baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = DEFAULT_BASE_URL) {
    this.baseUrl = baseUrl;
    this.token = getStoredToken();
  }

  // ===== PRIVATE METHODS =====
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const config: RequestInit = {
      headers: this.getHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);

      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = response.headers.get("Retry-After");
        throw new Error(
          `Rate limited. Please try again in ${retryAfter || 60} seconds.`
        );
      }

      // Handle authentication errors
      if (response.status === 401) {
        this.clearToken();
        throw new Error("Unauthorized. Please login again.");
      }

      if (!response.ok) {
        let errorMessage = `API Error: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch {
          errorMessage = (await response.text()) || errorMessage;
        }
        throw new Error(errorMessage);
      }

      // Handle empty responses
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return response.json();
      } else {
        return {} as T; // Return empty object for non-JSON responses
      }
    } catch (error) {
      // Network errors
      if (error instanceof Error) {
        throw new Error(
          "Network error. Please check your internet connection."
        );
      }
      throw error;
    }
  }

  // ===== TOKEN MANAGEMENT =====
  setToken(token: string): void {
    this.token = token;
    setStoredToken(token);
  }

  clearToken(): void {
    this.token = null;
    removeStoredToken();
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  // ===== AUTH METHODS =====
  async login(credentials: UserLogin): Promise<Token> {
    const formData = new FormData();
    formData.append("username", credentials.username);
    formData.append("password", credentials.password);

    try {
      const response = await fetch(`${this.baseUrl}/auth/login`, {
        method: "POST",
        body: formData,
      });

      if (response.status === 429) {
        throw new Error("Too many login attempts. Please try again later");
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Login failed: ${errorText}`);
      }

      const token = await response.json();
      this.setToken(token.access_token);
      return token;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes("fetdch")) {
        throw new Error("Unable to connect to server. Please try again");
      }
      throw error;
    }
  }

  async register(userData: UserRegister): Promise<User> {
    return this.request<User>(`/auth/register`, {
      method: "POST",
      body: JSON.stringify(userData),
    });
  }

  // ===== AUTH METHODS -- PASSWORD RESET METHODS =====
  async requestPasswordReset(email: string): Promise<{ message: string }> {
    return this.request<{ message: string }>("/auth/password-reset/request", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }

  async confirmPasswordReset(
    token: string,
    new_password: string
  ): Promise<{ message: string }> {
    return this.request<{ message: string }>("/auth/password-reset/confirm", {
      method: "POST",
      body: JSON.stringify({ token, new_password }),
    });
  }

  // ===== USER METHODS =====
  async getCurrentUser(): Promise<User> {
    return this.request<User>("/users/me");
  }

  async updateUser(userData: UserUpdate): Promise<User> {
    return this.request<User>("/users/me", {
      method: "PATCH",
      body: JSON.stringify(userData),
    });
  }

  async changePassword(
    passwordData: PasswordChange
  ): Promise<{ message: string }> {
    return this.request<{ message: string }>("/users/change-password", {
      method: "POST",
      body: JSON.stringify(passwordData),
    });
  }

  // ===== USER METHODS -- ACCOUNT DELETION METHOD =====
  async deleteAccount(): Promise<void> {
    return this.request<void>("/users/me", {
      method: "DELETE",
    });
  }

  // ===== ANALYTICS METHODS =====
  async getGeographicAnalytics(days: number = 30): Promise<GeographicResponse> {
    return this.request<GeographicResponse>(
      `/analytics/geographic?days=${days}`
    );
  }

  async getAnalytics(days: number = 30): Promise<AnalyticsResponse> {
    return this.request<AnalyticsResponse>(`/analytics/?days=${days}`);
  }

  // ===== LINK METHODS =====
  async getLinks(): Promise<Link[]> {
    return this.request<Link[]>("/links/");
  }

  async createLink(linkData: LinkCreate): Promise<Link> {
    return this.request<Link>("/links/", {
      method: "POST",
      body: JSON.stringify(linkData),
    });
  }

  async updateLink(id: number, linkData: LinkUpdate): Promise<Link> {
    return this.request<Link>(`/links/${id}`, {
      method: "PATCH",
      body: JSON.stringify(linkData),
    });
  }

  async deleteLink(id: number): Promise<void> {
    return this.request<void>(`/links/${id}`, {
      method: "DELETE",
    });
  }

  async getPublicLinks(username: string): Promise<Link[]> {
    return this.request<Link[]>(`/links/public/${username}`);
  }

  // ===== CLICK TRACKING =====
  getRedirectUrl(linkId: number): string {
    return `${this.baseUrl}/links/${linkId}/redirect`;
  }

  // For optimistic click tracking
  async trackClick(linkId: number): Promise<void> {
    try {
      await this.request<void>(`/links/${linkId}click`, {
        method: "POST",
      });
    } catch (error) {
      // Silently fail for click tracking to not interrupt user experience
      console.warn("Click tracking failed", error);
    }
  }

  // ===== REAL-TIME SYNC =====
  async refreshLinkStats(linkId: number): Promise<Link> {
    return this.request<Link>(`/links/${linkId}/stats`);
  }
}

// ===== SINGLETON INSTANCE =====
export const apiClient = new ApiClient();
