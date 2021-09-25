import { ObjectId } from 'mongodb';

import { isBrowser } from '@utils/is-browser';
import { connectMongo } from '@utils/mongodb/connect';

import { User, UserInfo } from 'types/user';

export async function getUsersByIds(userIds: (OurId | undefined | null)[]) {
  if (isBrowser()) throw new Error('Cannot run getUsersByIds is browser env.');

  const { db } = await connectMongo();

  // TODO: ObjectId validation?

  const userObjectIds = userIds
    .filter((userId): userId is OurId => Boolean(userId))
    .map((userId) => new ObjectId(userId));

  const users = await db
    .collection<User>('user')
    .aggregate([
      {
        $match: { _id: { $in: userObjectIds }, approvedAt: { $ne: null } },
      },
      {
        $addFields: {
          __order: { $indexOfArray: [userObjectIds, '$_id'] },
        },
      },
      {
        $sort: { __order: 1 },
      },
      {
        $project: { _id: 1, name: 1, displayName: 1, email: 1, profileUrl: 1, activatedAt: 1 },
      },
    ])
    .toArray<UserInfo>();

  return users;
}
