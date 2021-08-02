import type { NextApiRequest, NextApiResponse } from 'next';
import { ObjectId } from 'mongodb';
import Joi, { ValidationError } from 'joi';

import { createError } from '@defines/errors';
import { withErrorHandler } from '@utils/with-error-handler';
import { connectMongo } from '@utils/connect-mongo';
import { verifySession } from '@lib/server/verify-session';
import { getRoomByQuery, isParticipant } from '@utils/room';
import { getUserInfoById } from '@utils/user';

import { Room } from 'types/room';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const querySchema = Joi.object({
    participantId: Joi.string().hex().length(24).required(),
  });
  const { participantId } = (await querySchema.validateAsync(req.query)) as {
    participantId: string;
  };

  if (!ObjectId.isValid(participantId))
    throw new ValidationError(`Invalid participantId: ${participantId}`, '', '');

  const room = await getRoomByQuery(req, res);

  if (room.state === 'ended') return res.status(400).json(createError('ROOM_ENDED'));

  const { userId } = verifySession(req, res);

  if (String(room.dealer._id) !== String(userId)) {
    return res.status(403).json(createError('NO_PERMISSION'));
  }

  if (req.method === 'POST') {
    if (isParticipant(participantId, room)) {
      return res.status(304).end();
    }

    const participant = await getUserInfoById(res, participantId);

    const { db } = await connectMongo();

    await db
      .collection<Room>('room')
      .updateOne(
        { _id: room._id },
        { $addToSet: { participants: { user: participant, score: 0 } } },
      );

    return res.status(204).end();
  }

  if (req.method === 'DELETE') {
    if (!isParticipant(participantId, room)) {
      return res.status(304).end();
    }

    const participant = await getUserInfoById(res, participantId);

    const { db } = await connectMongo();

    await db
      .collection<Room>('room')
      .updateOne(
        { _id: room._id },
        { $pull: { participants: { user: { _id: participant._id } } } },
      );

    return res.status(204).end();
  }
};

export default withErrorHandler(handler);
