import Joi, { ValidationError } from 'joi';
import { ObjectId } from 'mongodb';

import { createError } from '@defines/errors';

import { isValidId } from '@lib/is-valid-id';

import { connectMongo } from '@utils/mongodb/connect';

import { Room } from 'types/room';

import type { NextApiRequest, NextApiResponse } from 'next';

export async function getRoomByQuery(req: NextApiRequest, res: NextApiResponse) {
  const querySchema = Joi.object({ roomId: Joi.string().hex().length(24).required() });
  const { roomId } = (await querySchema.validateAsync(req.query)) as { roomId: string };

  if (!isValidId(roomId)) throw new ValidationError(`Invalid roomId: ${roomId}`, [], '');

  const { db } = await connectMongo();
  const room = await db
    .collection<Room>('room')
    .findOne({ _id: new ObjectId(roomId), deletedAt: null }, { projection: { deletedAt: 0 } });

  if (!room) {
    res.status(404);
    throw createError('NO_SUCH_ROOM');
  }

  return room;
}

export async function getRoomById(roomId: OurId) {
  const { db } = await connectMongo();
  return await db
    .collection<Room>('room')
    .findOne({ _id: new ObjectId(roomId), deletedAt: null }, { projection: { deletedAt: 0 } });
}
