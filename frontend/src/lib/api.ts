import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const isProd = process.env.NODE_ENV === 'production';
let API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ||
    (isProd ? 'https://gather-zxaa.onrender.com' : 'http://localhost:3000');

// Sanitize URL: Remove trailing slash and any /api/v1 suffix to prevent duplication
API_BASE_URL = API_BASE_URL.replace(/\/$/, '').replace(/\/api\/v1$/, '');

console.log(`🌐 API Mode: ${isProd ? 'Production' : 'Development'}`);
console.log('🌐 API Base URL (sanitized):', API_BASE_URL);
console.log('🌐 Full baseURL:', `${API_BASE_URL}/api/v1`);

export const api = axios.create({
    baseURL: `${API_BASE_URL}/api/v1`,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Token storage keys
const ACCESS_TOKEN_KEY = 'gather_token';
const REFRESH_TOKEN_KEY = 'gather_refresh_token';

// Token refresh state
let isRefreshing = false;
let failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: unknown) => void;
}> = [];

// Process queued requests after token refresh
const processQueue = (error: unknown, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else if (token) {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// Helper functions for token management
export const tokenManager = {
    getAccessToken: (): string | null => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem(ACCESS_TOKEN_KEY);
        }
        return null;
    },

    getRefreshToken: (): string | null => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem(REFRESH_TOKEN_KEY);
        }
        return null;
    },

    setTokens: (accessToken: string, refreshToken: string) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
            localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
        }
    },

    clearTokens: () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem(ACCESS_TOKEN_KEY);
            localStorage.removeItem(REFRESH_TOKEN_KEY);
        }
    },

    isAuthenticated: (): boolean => {
        return !!tokenManager.getAccessToken();
    }
};

// Cross-tab synchronization
if (typeof window !== 'undefined') {
    window.addEventListener('storage', (event) => {
        // If token was removed in another tab, redirect to signin
        if (event.key === ACCESS_TOKEN_KEY && !event.newValue) {
            console.log('🔄 Auth: Access token cleared in another tab. Redirecting to auth.');
            window.location.href = '/auth';
        }
        // If token was added/changed in another tab, we can optionally reload or just let the next request handle it
        if (event.key === ACCESS_TOKEN_KEY && event.newValue) {
            console.log('🔄 Auth: Access token updated in another tab.');
        }
    });
}

// Add auth token to requests with Bearer prefix
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);

    if (typeof window !== 'undefined') {
        const token = tokenManager.getAccessToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
}, (error) => {
    console.error('❌ Request error:', error);
    return Promise.reject(error);
});

// Response interceptor with automatic token refresh
api.interceptors.response.use(
    (response) => {
        console.log(`✅ API Response: ${response.status}`);
        return response;
    },
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        console.error('❌ API Error:', {
            message: error.message,
            response: (error.response?.data as Record<string, unknown>),
            status: error.response?.status
        });

        // Handle token expiration
        if (error.response?.status === 401 && !originalRequest._retry) {
            const errorData = error.response?.data as { code?: string };

            // Check if it's a token expired error
            if (errorData?.code === 'TOKEN_EXPIRED') {
                if (isRefreshing) {
                    // Wait for token refresh to complete
                    return new Promise((resolve, reject) => {
                        failedQueue.push({ resolve, reject });
                    }).then((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return api(originalRequest);
                    }).catch((err) => {
                        return Promise.reject(err);
                    });
                }

                originalRequest._retry = true;
                isRefreshing = true;

                const refreshToken = tokenManager.getRefreshToken();

                if (!refreshToken) {
                    // No refresh token, redirect to login
                    tokenManager.clearTokens();
                    if (typeof window !== 'undefined') {
                        window.location.href = '/auth/signin';
                    }
                    return Promise.reject(error);
                }

                try {
                    // Try to refresh the token
                    const response = await axios.post(`${API_BASE_URL}/refresh`, {
                        refreshToken
                    });

                    const { accessToken, refreshToken: newRefreshToken } = response.data;

                    tokenManager.setTokens(accessToken, newRefreshToken);

                    // Update authorization header for all pending requests
                    processQueue(null, accessToken);

                    // Retry the original request
                    originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                    return api(originalRequest);
                } catch (refreshError) {
                    // Refresh failed, redirect to login
                    processQueue(refreshError, null);
                    tokenManager.clearTokens();

                    if (typeof window !== 'undefined') {
                        window.location.href = '/auth/signin';
                    }
                    return Promise.reject(refreshError);
                } finally {
                    isRefreshing = false;
                }
            }
        }

        return Promise.reject(error);
    }
);

// Auth API
export const authApi = {
    signup: (username: string, email: string, password: string) =>
        api.post('/signup', { username, email, password }),

    signin: async (email: string, password: string) => {
        const response = await api.post('/signin', { email, password });

        // Store both tokens
        if (response.data.accessToken && response.data.refreshToken) {
            tokenManager.setTokens(response.data.accessToken, response.data.refreshToken);
        }

        return response;
    },

    refresh: (refreshToken: string) =>
        api.post('/refresh', { refreshToken }),

    logout: async () => {
        const refreshToken = tokenManager.getRefreshToken();
        try {
            await api.post('/logout', { refreshToken });
        } finally {
            tokenManager.clearTokens();
        }
    },

    logoutAll: async () => {
        try {
            await api.post('/logout-all');
        } finally {
            tokenManager.clearTokens();
        }
    },

    getSessions: () =>
        api.get('/sessions'),

    revokeSession: (sessionId: number) =>
        api.delete(`/sessions/${sessionId}`),

    getMe: () =>
        api.get('/me'),

    verifyEmail: (token: string) =>
        api.post('/verify-email', { token }),

    resendVerification: (email: string) =>
        api.post('/resend-verification', { email }),

    forgotPassword: (email: string) =>
        api.post('/forgot-password', { email }),

    resetPassword: (token: string, newPassword: string) =>
        api.post('/reset-password', { token, newPassword }),
};

// Content API
export const contentApi = {
    getAll: () => api.get('/content'),

    add: (data: { type: string; link?: string; title: string; description?: string; imageUrl?: string; tags: string[] }) =>
        api.post('/content', data),

    delete: (contentId: string) =>
        api.delete('/content', { data: { contentId } }),
};

// Brain API
export const brainApi = {
    share: (share: boolean) =>
        api.post('/brain/share', { share }),

    getShared: (shareLink: string) =>
        api.get(`/brain/${shareLink}`),
};

// Search API
export const searchApi = {
    search: (query: string, type?: string) =>
        api.post('/search', { query, type: type || 'all' }),
};
