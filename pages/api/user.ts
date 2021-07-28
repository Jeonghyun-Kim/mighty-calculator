import type { NextApiRequest, NextApiResponse } from 'next';
import Joi from 'joi';
import bcrypt from 'bcrypt';
import { withErrorHandler } from '@utils/with-error-handler';
import { verifySession } from '@lib/verify-session';
import { connectMongo } from '@utils/connect-mongo';
import { createError } from '@defines/errors';
import { User, UserInfo } from 'types/user';
import { SALT_ROUND } from '@defines/bcrypt';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'GET') {
    const { userId } = verifySession(req, res, { renewSession: true });

    const { db } = await connectMongo();
    const user = await db
      .collection<User>('user')
      .findOne<UserInfo>(
        { _id: userId },
        { projection: { _id: 1, name: 1, email: 1, profileUrl: 1 } },
      );

    if (!user) throw new Error('Cannot find user.');

    return res.json(user);
  }

  if (req.method === 'POST') {
    const userSchema = Joi.object({
      name: Joi.string().label('name').min(3).max(10).required(),
      email: Joi.string().label('email').email().required(),
      password: Joi.string().label('password').min(8).max(30).required(),
    });

    const { name, email, password } = (await userSchema.validateAsync(req.body)) as Pick<
      User,
      'name' | 'email' | 'password'
    >;

    const { db } = await connectMongo();
    const exUser = await db.collection<User>('user').findOne({ email });

    if (exUser) {
      if (exUser.approvedAt) return res.status(400).json(createError('USER_ALREADY_EXISTS'));

      return res.status(304).end();
    }

    await db.collection<User>('user').insertOne({
      name,
      email,
      profileUrl: null,
      password: await bcrypt.hash(password, SALT_ROUND),
      createdAt: new Date(),
      updatedAt: new Date(),
      approvedAt: null,
    });

    return res.status(201).end();
  }
};

export default withErrorHandler(handler);
