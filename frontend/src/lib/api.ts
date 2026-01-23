import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://gather-zxaa.onrender.com/api/v1';

console.log('🌐 API Base URL:', API_BASE_URL);

export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    console.log('Request data:', config.data);

    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('gather_token');
        if (token) {
            config.headers.Authorization = token;
        }
    }
    return config;
}, (error) => {
    console.error('❌ Request error:', error);
    return Promise.reject(error);
});

// Add response interceptor for logging
api.interceptors.response.use(
    (response) => {
        console.log(`✅ API Response: ${response.status}`, response.data);
        return response;
    },
    (error) => {
        console.error('❌ API Error:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });
        return Promise.reject(error);
    }
);

// Auth API
export const authApi = {
    signup: (username: string, email: string, password: string) =>
        api.post('/signup', { username, email, password }),

    signin: (email: string, password: string) =>
        api.post('/signin', { email, password }),
};

// Content API
export const contentApi = {
    getAll: () => api.get('/content'),

    add: (data: { type: string; link: string; title: string; tags: string[] }) =>
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
