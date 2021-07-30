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
        { projection: { _id: 1, name: 1, displayName: 1, email: 1, profileUrl: 1 } },
      );

    if (!user) throw new Error('Cannot find user.');

    return res.json(user);
  }

  if (req.method === 'POST') {
    const userSchema = Joi.object({
      name: Joi.string().min(3).max(10).required(),
      displayName: Joi.string().min(3).max(20),
      email: Joi.string().email().required(),
      password: Joi.string().min(8).max(30).required(),
    }).prefs({ errors: { label: 'key' } });

    const { name, displayName, email, password } = (await userSchema.validateAsync(
      req.body,
    )) as Pick<User, 'name' | 'displayName' | 'email' | 'password'>;

    const { db } = await connectMongo();
    const exUser = await db.collection<User>('user').findOne({ email });

    if (exUser) {
      if (exUser.approvedAt) return res.status(400).json(createError('USER_ALREADY_EXISTS'));

      return res.status(304).end();
    }

    await db.collection<User>('user').insertOne({
      name,
      displayName: displayName || '',
      email,
      profileUrl: null,
      password: await bcrypt.hash(password, SALT_ROUND),
      createdAt: new Date(),
      updatedAt: new Date(),
      approvedAt: null,
    });

    return res.status(201).end();
  }

  if (req.method === 'PATCH') {
    const { userId } = verifySession(req, res);

    const bodySchema = Joi.object({
      displayName: Joi.string().label('displayName').min(2).max(20).required(),
    });

    const { displayName } = (await bodySchema.validateAsync(req.body)) as { displayName: string };

    const { db } = await connectMongo();
    await db
      .collection<User>('user')
      .updateOne({ _id: userId }, { $set: { displayName, updatedAt: new Date() } });

    return res.status(204).end();
  }
};

export default withErrorHandler(handler);
