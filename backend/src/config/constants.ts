export const ACCESS_TOKEN_EXPIRY = '15m'; // Short-lived access token
export const REFRESH_TOKEN_EXPIRY_DAYS = 30; // Long-lived refresh token
export const SALT_ROUNDS = 12; // Increased from 10 for better security
export const JWT_SECRET = process.env.JWT_SECRET!;
