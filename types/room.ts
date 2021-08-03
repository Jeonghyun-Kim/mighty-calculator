import { UserInfo } from 'types/user';

export interface Room {
  _id: OurId;
  state: 'inProgress' | 'ended';
  title: string;
  dealer: UserInfo;
  participants: UserInfo[];
  comments: [];
  createdAt: OurDate;
  updatedAt: OurDate;
  deletedAt: OurDate | null;
  approvedAt: OurDate | null;
}

export {};
