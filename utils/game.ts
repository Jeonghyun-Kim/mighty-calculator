import type { NextApiRequest, NextApiResponse } from 'next';
import { ObjectId } from 'mongodb';
import Joi, { ValidationError } from 'joi';

import { connectMongo } from '@utils/connect-mongo';
import { createError } from '@defines/errors';

import { Game } from 'types/game';

export async function getGameByQuery(req: NextApiRequest, res: NextApiResponse) {
  const querySchema = Joi.object({ gameId: Joi.string().hex().length(24).required() });
  const { gameId } = (await querySchema.validateAsync(req.query)) as { gameId: string };

  if (!ObjectId.isValid(gameId)) throw new ValidationError(`Invalid gameId: ${gameId}`, '', '');

  const { db } = await connectMongo();
  const game = await db
    .collection<Game>('game')
    .findOne({ _id: new ObjectId(gameId), deletedAt: null }, { projection: { deletedAt: 0 } });

  if (!game) {
    res.status(404);
    throw createError('NO_SUCH_GAME');
  }

  return game;
}
