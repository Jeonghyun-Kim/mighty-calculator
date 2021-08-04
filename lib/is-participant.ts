import { Room } from 'types/room';

export function isParticipant(id: OurId, room: Room) {
  return room.participants.map(({ _id }) => String(_id)).includes(String(id));
}
