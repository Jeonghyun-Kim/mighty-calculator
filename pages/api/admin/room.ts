import { getRoomByQuery } from '@utils/room';
import type { NextApiRequest, NextApiResponse } from 'next';
import { ObjectId } from 'mongodb';

import { compareId } from '@lib/server/compare-id';
import { getGamesByRoomId } from '@utils/game';
import { withErrorHandler } from '@utils/with-error-handler';
import { verifyAdminKey } from '@lib/server/verify-admin-key';
import { connectMongo } from '@utils/mongodb/connect';
import { createError } from '@defines/errors';
import { calcStatsByGame } from '@utils/game/calc-stats-by-game';

import { User } from 'types/user';
import { Room } from 'types/room';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'GET') {
    verifyAdminKey(req, res);

    const { db } = await connectMongo();
    const rooms = await db
      .collection<Room>('room')
      .find({ state: 'ended', approvedAt: null, deletedAt: null })
      .sort({ updatedAt: -1 })
      .toArray();

    return res.json({ rooms });
  }

  if (req.method === 'POST') {
    verifyAdminKey(req, res);

    const room = await getRoomByQuery(req, res);

    if (room.state !== 'ended') {
      return res.status(400).json(createError('ROOM_NOT_ENDED'));
    }

    if (room.approvedAt) {
      return res.status(304).end();
    }

    const updateQuery: { userId: ObjectId; updateCount: { [key: string]: number } }[] =
      room.participants.map((user) => ({
        userId: user._id as ObjectId,
        updateCount: {},
      }));

    // Calculate scores
    const games = await getGamesByRoomId(room._id);

    const updateStats = games.map(calcStatsByGame).flat();

    updateStats.forEach(({ userId, updateKeys }) => {
      const idx = updateQuery.findIndex(({ userId: _id }) => compareId(_id, userId));
      if (idx !== -1) {
        updateKeys.forEach((key) => {
          if (updateQuery[idx].updateCount[key]) updateQuery[idx].updateCount[key] += 1;
          else updateQuery[idx].updateCount[key] = 0;
        });
      }
    });

    const { db } = await connectMongo();

    await Promise.all(
      updateQuery.map(async ({ userId, updateCount }) => {
        await db
          .collection<User>('user')
          .updateOne({ _id: userId }, { $inc: updateCount, $set: { updatedAt: new Date() } });
      }),
    );

    await db
      .collection<Room>('room')
      .updateOne({ _id: room._id }, { $set: { approvedAt: new Date() } });

    return res.status(204).end();
  }

  if (req.method === 'DELETE') {
    const room = await getRoomByQuery(req, res);

    const { db } = await connectMongo();

    if (room.approvedAt) {
      return res.status(400).end();
    }

    await db
      .collection<Room>('room')
      .updateOne({ _id: room._id }, { $set: { deletedAt: new Date() } });

    return res.status(204).end();
  }
};

export default withErrorHandler(handler);
