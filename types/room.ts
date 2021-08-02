import { UserInfo } from 'types/user';

export interface Room {
  _id: OurId;
  state: 'inProgress' | 'ended';
  title: string;
  dealer: UserInfo;
  participants: { user: UserInfo; score: number }[];
  comments: [];
  createdAt: OurDate;
  deletedAt: OurDate | null;
}

export {};
