import Joi from 'joi';
import { Expand } from 'types';

export const GAME_TYPES = ['5M', '6M'] as const;
export type GameType = typeof GAME_TYPES[number];

export const GIRU_TYPES = ['spade', 'diamond', 'heart', 'clover', 'nogi'] as const;
export type Giru = typeof GIRU_TYPES[number];

export interface Game5M {
  _id: OurId;
  _roomId: OurId;
  type: typeof GAME_TYPES[0];
  giru: Giru;
  promise: number;
  win: boolean;
  run: boolean;
  _presidentId: OurId;
  _friendId: OurId | null;
  _oppositionIds: [OurId, OurId, OurId] | [OurId, OurId, OurId, OurId];
  createdAt: OurDate;
  updatedAt: OurDate;
  deletedAt: OurDate | null;
}

export interface Game6M extends Omit<Game5M, 'type'> {
  type: typeof GAME_TYPES[1];
  _diedId: OurId;
}

export type Game = Expand<Game5M | Game6M>;

export const gaemSchema = Joi.object({
  type: Joi.string()
    .valid(...GAME_TYPES)
    .required(),
  giru: Joi.string().valid(...GIRU_TYPES),
  promise: Joi.number().integer().min(13).max(20).required(),
  win: Joi.bool().required(),
  run: Joi.bool().required(),
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
