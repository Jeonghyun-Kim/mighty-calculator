import type { NextApiRequest, NextApiResponse } from 'next';
import Joi from 'joi';
import { ObjectId } from 'mongodb';

import { compareId } from '@lib/server/compare-id';
import { calcStatsByGame, getGamesByRoomId } from '@utils/game';
import { withErrorHandler } from '@utils/with-error-handler';
import { verifyAdminKey } from '@lib/server/verify-admin-key';
import { connectMongo } from '@utils/connect-mongo';
import { createError } from '@defines/errors';

import { User } from 'types/user';
import { Room } from 'types/room';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'GET') {
    verifyAdminKey(req, res);

    const { db } = await connectMongo();
    const rooms = await db
      .collection<Room>('room')
      .find({ state: 'end', approvedAt: null })
      .sort({ updatedAt: -1 })
      .toArray();

    return res.json({ rooms });
  }

  if (req.method === 'POST') {
    verifyAdminKey(req, res);

    const schema = Joi.object({ roomId: Joi.string().label('roomId').hex().length(24).required() });
    const { roomId } = await schema.validateAsync(req.query);

    const { db } = await connectMongo();
    const room = await db.collection<Room>('room').findOne({ _id: new ObjectId(roomId) });

    if (!room) return res.status(404).json(createError('NO_SUCH_ROOM'));

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
};

export default withErrorHandler(handler);
