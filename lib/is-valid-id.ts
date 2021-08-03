import { ObjectId } from 'mongodb';

export function isValidId(id: OurId) {
  return ObjectId.isValid(id);
}
