import { serialize } from 'cookie';
import { ObjectId } from 'mongodb';

import {
  COOKIE_KEY_ACCESS_TOKEN,
  COOKIE_KEY_REDIRECT_URL,
  defaultCookieOptions,
} from '@defines/cookie';
import { createError } from '@defines/errors';
import { ACCESS_TOKEN_EXPIRES_IN } from '@defines/token';

import { signToken, verifyToken } from '@utils/jsonwebtoken';

import type { NextApiRequest, NextApiResponse } from 'next';

interface VerifySessionOptions {
  renewSession?: boolean;
}
export function verifySession(
  req: NextApiRequest,
  res: NextApiResponse,
  options?: VerifySessionOptions,
) {
  const accessToken = req.cookies[COOKIE_KEY_ACCESS_TOKEN];

  if (!accessToken) {
    res.status(401);
    throw createError('TOKEN_EMPTY');
  }

  try {
    const { userId } = verifyToken(accessToken) as { userId: string };

    if (options?.renewSession) {
      const newAccessToken = signToken({ userId }, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
      res.setHeader('Set-Cookie', [
        serialize(COOKIE_KEY_ACCESS_TOKEN, newAccessToken, defaultCookieOptions),
      ]);
    }

    return { userId: new ObjectId(userId) };
  } catch (err) {
    res.status(401);
    if (err.code === 'AE001') {
      // FIXME: Redirect to session-expired page?
      res.setHeader('Set-Cookie', `${COOKIE_KEY_REDIRECT_URL}=${req.headers.referer ?? '/'}`);
    }

    throw err;
  }
}
