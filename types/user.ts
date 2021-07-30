import { ObjectId } from 'mongodb';

export interface User {
  _id: ObjectId | string;
  name: string;
  displayName: string;
  email: string;
  profileUrl: string | null;
  password: string;
  createdAt: OurDate;
  updatedAt: OurDate;
  approvedAt: OurDate | null;
}

export type UserInfo = Pick<User, '_id' | 'name' | 'displayName' | 'email' | 'profileUrl'>;

export {};
