import { ObjectId } from 'mongodb';

import { createError } from '@defines/errors';

import { connectMongo } from '@utils/mongodb/connect';

import { User, UserInfo } from 'types/user';

import type { NextApiResponse } from 'next';

export async function getUserInfoById(res: NextApiResponse, userId: OurId) {
  const { db } = await connectMongo();

  const user = await db
    .collection<User>('user')
    .findOne<UserInfo>(
      { _id: new ObjectId(userId), approvedAt: { $ne: null } },
      { projection: { _id: 1, name: 1, displayName: 1, email: 1, profileUrl: 1, activatedAt: 1 } },
    );

  if (!user) {
    res.status(404);
    throw createError('NO_SUCH_USER');
  }

  return user;
}
