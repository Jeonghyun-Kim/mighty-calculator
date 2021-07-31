import type { NextApiRequest, NextApiResponse } from 'next';
import Joi from 'joi';
import { ObjectId } from 'mongodb';

import { withErrorHandler } from '@utils/with-error-handler';
import { verifyAdminKey } from '@lib/verify-admin-key';
import { connectMongo } from '@utils/connect-mongo';
import { createError } from '@defines/errors';

import { User } from 'types/user';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'GET') {
    verifyAdminKey(req, res);

    const { db } = await connectMongo();
    const users = await db
      .collection<User>('user')
      .find({ approvedAt: null }, { projection: { password: 0 } })
      .sort({ createdAt: -1 })
      .toArray();

    return res.json({ users });
  }

  if (req.method === 'POST') {
    verifyAdminKey(req, res);

    const schema = Joi.object({ userId: Joi.string().label('userId').hex().length(24).required() });
    const { userId } = await schema.validateAsync(req.query);

    const { db } = await connectMongo();
    const user = await db.collection<User>('user').findOne({ _id: new ObjectId(userId) });

    if (!user) return res.status(404).json(createError('NO_SUCH_USER'));

    if (user.approvedAt) {
      return res.status(304).end();
    }

    await db
      .collection<User>('user')
      .updateOne({ _id: user._id }, { $set: { approvedAt: new Date() } });

    return res.status(204).end();
  }
};

export default withErrorHandler(handler);
