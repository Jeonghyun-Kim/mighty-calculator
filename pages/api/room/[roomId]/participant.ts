import type { NextApiRequest, NextApiResponse } from 'next';
import Joi, { ValidationError } from 'joi';

import { createError } from '@defines/errors';
import { withErrorHandler } from '@utils/with-error-handler';
import { connectMongo } from '@utils/connect-mongo';
import { verifySession } from '@lib/server/verify-session';
import { getRoomByQuery, isParticipant } from '@utils/room';
import { getUserInfoById } from '@utils/user';
import { compareId } from '@lib/server/compare-id';
import { isValidId } from '@lib/is-valid-id';

import { Room } from 'types/room';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const querySchema = Joi.object({
    participantId: Joi.string().hex().length(24).required(),
  });
  const { participantId } = (await querySchema.validateAsync(req.query)) as {
    participantId: string;
  };

  if (!isValidId(participantId))
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

    await db.collection<Room>('room').updateOne(
      { _id: room._id },
      {
        $addToSet: { participants: participant },
      },
    );

    return res.status(204).end();
  }

  if (req.method === 'DELETE') {
    if (!isParticipant(participantId, room)) {
      return res.status(304).end();
    }

    if (compareId(participantId, room.dealer._id)) {
      return res.status(400).json(createError('DEALER_CANNOT_BE_REMOVED'));
    }

    const exParticipant = room.participants.find((user) => compareId(user._id, participantId));
    if (!exParticipant) throw new Error('Server Error!');

    const participant = await getUserInfoById(res, participantId);

    const { db } = await connectMongo();

    await db
      .collection<Room>('room')
      .updateOne({ _id: room._id }, { $pull: { participants: { _id: participant._id } } });

    return res.status(204).end();
  }
};

export default withErrorHandler(handler);
