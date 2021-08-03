import Joi from 'joi';
import { Expand } from 'types';

export const GAME_TYPES = ['5M', '6M'] as const;
export type GameType = typeof GAME_TYPES[number];

export interface Game5M {
  _id: OurId;
  _roomId: OurId;
  type: typeof GAME_TYPES[0];
  isNogi: boolean;
  isRun: boolean;
  win: boolean;
  _presidentId: OurId;
  _friendId: OurId | null;
  _oppositionIds: [OurId, OurId, OurId] | [OurId, OurId, OurId, OurId];
  createdAt: OurDate;
  updatedAt: OurDate;
  deletedAt: OurDate | null;
}

export interface Game6M extends Omit<Game5M, 'type' | '_diedId'> {
  type: typeof GAME_TYPES[1];
  _diedId: OurId;
}

export type Game = Expand<Game5M | Game6M>;

export const gameSchema = Joi.object({
  type: Joi.string()
    .valid(...GAME_TYPES)
    .required(),
  isNogi: Joi.bool().required(),
  isRun: Joi.bool().required(),
  win: Joi.bool().required(),
  _presidentId: Joi.string().hex().length(24).required(),
  _friendId: Joi.string().hex().length(24).allow(null).default(null),
  _oppositionIds: Joi.when('_friendId', {
    is: null,
    then: Joi.array().items(Joi.string().hex().length(24).required()).length(4),
    otherwise: Joi.array().items(Joi.string().hex().length(24).required()).length(3),
  }),
  _diedId: Joi.when('type', {
    is: GAME_TYPES[1],
    then: Joi.string().hex().length(24).required(),
    otherwise: Joi.valid(null).default(null),
  }),
}).prefs({ errors: { label: 'key' } });

export {};
