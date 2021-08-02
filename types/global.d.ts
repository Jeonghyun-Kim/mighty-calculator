import { ObjectId } from 'mongodb';

declare global {
  type OurDate = Date | string;
  type OurId = ObjectId | string;
}
