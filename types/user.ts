import { ObjectId } from 'mongodb';

export interface User {
  _id: ObjectId | string;
  name: string;
  email: string;
  profileUrl: string | null;
  password: string;
  createdAt: OurDate;
  updatedAt: OurDate;
  approvedAt: OurDate | null;
}

export type UserInfo = Pick<User, '_id' | 'name' | 'email' | 'profileUrl'>;

export {};
