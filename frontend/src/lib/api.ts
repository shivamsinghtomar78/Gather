import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('gather_token');
        if (token) {
            config.headers.Authorization = token;
        }
    }
    return config;
});

// Auth API
export const authApi = {
    signup: (username: string, password: string) =>
        api.post('/signup', { username, password }),

    signin: (username: string, password: string) =>
        api.post('/signin', { username, password }),
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
