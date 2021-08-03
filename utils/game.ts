import type { NextApiRequest, NextApiResponse } from 'next';
import { ObjectId } from 'mongodb';
import Joi, { ValidationError } from 'joi';

import { connectMongo } from '@utils/connect-mongo';
import { createError } from '@defines/errors';
import { isValidId } from '@lib/is-valid-id';

import { Game } from 'types/game';
import { User } from 'types/user';

export async function getGameByQuery(req: NextApiRequest, res: NextApiResponse) {
  const querySchema = Joi.object({ gameId: Joi.string().hex().length(24).required() });
  const { gameId } = (await querySchema.validateAsync(req.query)) as { gameId: string };

  if (!isValidId(gameId)) throw new ValidationError(`Invalid gameId: ${gameId}`, '', '');

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

export async function getGamesByRoomId(roomId: OurId) {
  const { db } = await connectMongo();
  const games = await db
    .collection<Game>('game')
    .find({ _roomId: new ObjectId(roomId), deletedAt: null }, { projection: { deletedAt: 0 } })
    .sort({ createdAt: -1 })
    .toArray();

  return games;
}

export function calcScoresByGame({
  win,
  isNogi,
  isRun,
  _presidentId,
  _friendId,
  _oppositionIds,
  _diedId,
}: Game & { _diedId?: OurId }) {
  const score = (win ? 1 : -1) * (isNogi ? 2 : 1) * (isRun ? 2 : 1);
  const noFriend = !_friendId;

  const providedIds = Array.from(
    new Set(
      [_presidentId, _friendId, ..._oppositionIds, _diedId].filter(
        (value): value is string => !!value,
      ),
    ),
  ).map((id) => String(id));

  return providedIds.map((userId) => {
    switch (userId) {
      case String(_presidentId): {
        return { userId, score: score * (noFriend ? 4 : 2) };
      }

      case String(_friendId): {
        return { userId, score: score * 1 };
      }
    }

    if (_oppositionIds.map((id) => String(id)).includes(userId)) {
      return { userId, score: score * -1 };
    }

    return { userId, score: 0 };
  });
}

export function calcStatsByGame({
  type,
  win,
  isNogi,
  isRun,
  _presidentId,
  _friendId,
  _oppositionIds,
  _diedId,
}: Game & { _diedId?: OurId }) {
  const providedIds = Array.from(
    new Set(
      [_presidentId, _friendId, ..._oppositionIds, _diedId].filter(
        (value): value is string => !!value,
      ),
    ),
  ).map((id) => String(id));

  return providedIds.map((userId) => {
    switch (userId) {
      case String(_presidentId): {
        const keys: string[] = [];
        const prefix = `stats${type}.president`;

        if (isNogi) {
          keys.push(`${prefix}.nogi`);
          if (isRun) {
            keys.push(win ? `${prefix}.nogiRun` : `${prefix}.nogiBackRun`);
          }
        } else if (isRun) {
          keys.push(win ? `${prefix}.run` : `${prefix}.backRun`);
        }

        return {
          userId,
          updateKeys: [`prefix.${win ? 'win' : 'lose'}`, ...keys],
        };
      }

      case String(_friendId): {
        return { userId, updateKeys: [`stats${type}.friend.${win ? 'win' : 'lose'}`] };
      }

      case String(_diedId): {
        if (type !== '6M') throw new Error('type must be 6M with _diedId.');
        return { userId, updateKeys: ['stats6M.died'] };
      }
    }

    if (_oppositionIds.map((id) => String(id)).includes(userId)) {
      return { userId, updateKeys: [`stats${type}.oppsite.${!win ? 'win' : 'lose'}`] };
    }

    throw new Error('Unreachable Line');

    return { userId, updateKeys: [] } as never;
  });
}
