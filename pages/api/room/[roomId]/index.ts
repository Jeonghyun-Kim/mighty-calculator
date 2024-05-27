import Joi, { ValidationError } from 'joi';

import { createError } from '@defines/errors';
import { isParticipant } from '@lib/is-participant';
import { isValidId } from '@lib/is-valid-id';
import { compareId } from '@lib/server/compare-id';
import { verifySession } from '@lib/server/verify-session';
import { connectMongo } from '@utils/mongodb/connect';
import { getRoomByQuery } from '@utils/room';
import { getUserInfoById } from '@utils/user';
import { withErrorHandler } from '@utils/with-error-handler';

import type { NextApiRequest, NextApiResponse } from 'next';
import type { Room } from 'types/room';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const room = await getRoomByQuery(req, res);

  if (req.method === 'GET') {
    verifySession(req, res);

    return res.json(room);
  }

  if (req.method === 'POST') {
    const { userId } = verifySession(req, res);

    if (room.state === 'ended') return res.status(304).end();

    if (!compareId(room.dealer._id, userId)) {
      return res.status(403).json(createError('NO_PERMISSION'));
    }

    // TODO: noti to admin?

    const { db } = await connectMongo();
    await db
      .collection<Room>('room')
      .updateOne({ _id: room._id }, { $set: { state: 'ended', updatedAt: new Date() } });

    return res.status(204).end();
  }

  if (req.method === 'PATCH') {
    const { userId } = verifySession(req, res);

    if (room.state === 'ended') return res.status(400).json(createError('ROOM_ENDED'));

    if (!compareId(room.dealer._id, userId)) {
      return res.status(403).json(createError('NO_PERMISSION'));
    }

    const { dealerId } = (await Joi.object({
      dealerId: Joi.string().hex().length(24).required(),
    }).validateAsync(req.body)) as { dealerId: string };

    if (!isValidId(dealerId) || !isParticipant(dealerId, room)) {
      throw new ValidationError('dealderId validation failed', [], '');
    }

    const dealer = await getUserInfoById(res, dealerId);

    const { db } = await connectMongo();

    await db
      .collection<Room>('room')
      .updateOne({ _id: room._id }, { $set: { dealer, updatedAt: new Date() } });

    return res.status(204).end();
  }

  if (req.method === 'DELETE') {
    const { userId } = verifySession(req, res);

    if (room.state === 'ended') return res.status(400).json(createError('ROOM_ENDED'));

    if (compareId(userId, room.dealer._id)) {
      return res.status(403).json(createError('NO_PERMISSION'));
    }

    const { db } = await connectMongo();

    await db
      .collection<Room>('room')
      .updateOne({ _id: room._id }, { $set: { deletedAt: new Date() } });

    return res.status(204).end();
  }
};

export default withErrorHandler(handler);
