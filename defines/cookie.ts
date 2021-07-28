export const COOKIE_KEY_ACCESS_TOKEN = 'kay.accessToken';
export const COOKIE_KEY_REDIRECT_URL = 'kay.redirectUrl';

export const defaultCookieOptions = {
  path: '/',
  sameSite: 'lax',
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
} as const;
