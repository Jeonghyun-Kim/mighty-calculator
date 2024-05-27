import bcrypt from 'bcrypt';
import { serialize } from 'cookie';
import Joi from 'joi';

import { COOKIE_KEY_ACCESS_TOKEN, defaultCookieOptions } from '@defines/cookie';
import { createError } from '@defines/errors';
import { ACCESS_TOKEN_EXPIRES_IN } from '@defines/token';
import { verifySession } from '@lib/server/verify-session';
import { signToken } from '@utils/jsonwebtoken';
import { connectMongo } from '@utils/mongodb/connect';
import { withErrorHandler } from '@utils/with-error-handler';

import type { NextApiRequest, NextApiResponse } from 'next';
import type { User } from 'types/user';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'GET') {
    const { userId } = verifySession(req, res);

    return res.json({ userId });
  }

  if (req.method === 'POST') {
    const authSchema = Joi.object({
      email: Joi.string().label('email').required(),
      password: Joi.string().label('password').min(8).max(30).required(),
    });

    const { email, password } = (await authSchema.validateAsync(req.body)) as Pick<
      User,
      'email' | 'password'
    >;

    const { db } = await connectMongo();
    const exUser = await db.collection<User>('user').findOne({ email });

    if (!exUser) return res.status(401).json(createError('NO_SUCH_USER'));

    if (!(await bcrypt.compare(password, exUser.password))) {
      return res.status(401).json(createError('WRONG_PASSWORD'));
    }

    if (!exUser.approvedAt) return res.status(401).json(createError('UNAPPROVED_USER'));

    const accessToken = signToken({ userId: exUser._id }, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
    res.setHeader('Set-Cookie', [
      serialize(COOKIE_KEY_ACCESS_TOKEN, accessToken, defaultCookieOptions),
    ]);

    return res.json({ accessToken });
  }
};

export default withErrorHandler(handler);
