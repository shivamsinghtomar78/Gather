export interface User {
    id: string;
    username: string;
    email: string;
    displayName?: string;
    bio?: string;
    profilePicUrl?: string;
    isEmailVerified?: boolean;
    createdAt: string;
}

export type ContentType = 'tweet' | 'youtube' | 'document' | 'link';

export interface Content {
    id: string;
    type: ContentType;
    title: string;
    link?: string;
    imageUrl?: string;
    description?: string;
    isPublic?: boolean;
    createdAt?: string;
    userId?: string;
}

export interface SocketContentEvent {
    id: string;
    title: string;
    type: ContentType;
}

export interface SocketDeleteEvent {
    contentId: string;
}
