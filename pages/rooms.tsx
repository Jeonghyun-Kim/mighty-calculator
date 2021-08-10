import { useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import useSWR from 'swr';
import cn from 'classnames';

import { DashboardLayout } from '@components/layout';
import { Loading } from '@components/core';
import { Avatar, Button, Link } from '@components/ui';

import { momentDate } from '@utils/moment';
import { useSession } from '@lib/hooks/use-session';
import { isParticipant } from '@lib/is-participant';

import { Room } from 'types/room';

function RoomListItem({ room, joined }: { room: Room; joined: boolean }) {
  const router = useRouter();

  const isOpen = useMemo(() => room.state === 'inProgress', [room.state]);

  return (
    <div
      className={cn(
        'shadow-md rounded-md p-4 bg-white',
        joined ? 'ring' : 'border border-gray-300',
        joined && (isOpen ? 'ring-teal-300' : 'ring-red-300'),
      )}
    >
      <div className="flex justify-between items-end">
        <span className="text-sm text-gray-500">
          started {momentDate(room.createdAt).fromNow()}
        </span>
        <span
          className={cn('flex items-center space-x-2', isOpen ? 'text-teal-500' : 'text-red-500')}
        >
          <span>{isOpen ? 'In Progress' : 'Ended'}</span>
          <span
            className={cn(
              'w-4 h-4 rounded-full border shadow',
              isOpen ? 'bg-teal-300 border-teal-400 animate-pulse' : 'bg-red-400 border-red-500',
            )}
          />
        </span>
      </div>
      <div className="mt-2 flex justify-between items-end">
        <h4 className="text-lg font-semibold line-clamp-2">{room.title}</h4>
        <span className="flex-shrink-0">{room.participants.length} members</span>
      </div>
      <div className="flex justify-between items-end">
        <div>
          <p className="mt-4 text-gray-500 text-sm">Dealer</p>
          <p className="mt-2 text-gray-500 text-sm font-semibold flex items-center">
            <Avatar className="inline-block mr-2" size="sm" src={room.dealer.profileUrl} />{' '}
            {room.dealer.displayName} ({room.dealer.name})
          </p>
        </div>
        <div>
          <Button
            size="sm"
            color={isOpen ? 'teal' : 'white'}
            onClick={() => router.push(`/room/${room._id}`)}
          >
            {isOpen ? 'Enter' : 'Details'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function UserListPage() {
  const { data: rooms } = useSWR<Room[]>('/api/room');
  const { user } = useSession();
  const [joinedOnly, setJoinedOnly] = useState(false);

  const openRooms = useMemo(
    () => rooms && rooms.filter(({ state }) => state === 'inProgress'),
    [rooms],
  );

  const closedRooms = useMemo(
    () => rooms && rooms.filter(({ state }) => state === 'ended'),
    [rooms],
  );

  if (!openRooms || !closedRooms) return <Loading />;

  return (
    <div>
      <h2 className="text-2xl font-medium">Rooms</h2>
      <section className="mt-6">
        <h3 className="text-lg font-medium">Open rooms</h3>
        <div className="mt-4 space-y-4 lg:space-y-0 lg:grid lg:grid-cols-2 xl:grid-cols-3 gap-4">
          <Link
            href="/room/create"
            className="w-full p-4 grid place-items-center rounded-md bg-white border border-dashed border-gray-500 hover:opacity-70"
          >
            <span className="text-gray-700 text-lg font-medium">+ Create new room</span>
          </Link>
          {openRooms.length !== 0 &&
            openRooms.map((room) => (
              <RoomListItem
                key={`room-${room._id}`}
                room={room}
                joined={!!user?._id && isParticipant(user._id, room)}
              />
            ))}
        </div>
      </section>

      <section className={cn('mt-6', { hidden: closedRooms.length === 0 })}>
        <h3 className="text-lg font-medium">Closed rooms</h3>
        <div className="mt-4 space-y-4 lg:space-y-0 lg:grid lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {closedRooms.map((room) => (
            <RoomListItem
              key={`room-${room._id}`}
              room={room}
              joined={!!user?._id && isParticipant(user._id, room)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

UserListPage.Layout = DashboardLayout;
