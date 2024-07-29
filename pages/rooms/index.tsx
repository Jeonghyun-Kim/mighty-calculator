import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { XMarkIcon } from '@heroicons/react/24/solid';
import cn from 'classnames';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { NextSeo } from 'next-seo';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { mutate } from 'swr';
import useSWRInfinite from 'swr/infinite';

import { useUI } from '@components/context';
import { Loading, Title } from '@components/core';
import { DashboardLayout } from '@components/layout';
import { Avatar, Button, Toggle } from '@components/ui';
import { approveRoomById } from '@lib/approve-room-by-id';
import { closeRoomById } from '@lib/close-room-by-id';
import { deleteRoomById } from '@lib/delete-room-by-id';
import { useAdminKey } from '@lib/hooks/use-admin-key';
import { useSession } from '@lib/hooks/use-session';
import { isParticipant } from '@lib/is-participant';
import { momentDate } from '@utils/moment';

import type { Room } from 'types/room';

function RoomListItem({
  room,
  joined,
  adminKey,
  revalidate,
}: {
  room: Room;
  joined: boolean;
  adminKey?: string | null;
  revalidate?: () => void;
}) {
  const router = useRouter();
  const { user } = useSession();

  const isOpen = useMemo(() => room.state === 'inProgress', [room.state]);

  const { showModal, showNoti } = useUI();

  useEffect(() => {
    console.log('adminKey', adminKey);
  }, [adminKey]);

  const handleCloseRoomClicked = useCallback(() => {
    if (!user) return;

    if (user._id !== room.dealer._id) {
      return showNoti({
        variant: 'alert',
        title: 'No permission',
        content: 'Only dealer can close the room.',
      });
    }

    showModal({
      variant: 'alert',
      title: 'Sure to close the Room?',
      content: `After closing the room, you won't be able to add games to this room. This action cannot be reverted in any reason.`,
      actionButton: {
        label: 'Close',
        onClick: () => {
          closeRoomById(room._id as string)
            .then(() => mutate('/api/room'))
            .catch((err) => showNoti({ variant: 'alert', title: err.name, content: err.message }));
        },
      },
      cancelButton: {
        label: 'Cancel',
        onClick: () => {},
      },
    });
  }, [room, user, showModal, showNoti]);

  return (
    <div
      className={cn(
        'shadow-md rounded-md p-4 bg-white',
        joined ? 'ring' : 'border border-gray-300',
        joined && (isOpen ? 'ring-teal-300' : 'ring-red-300'),
      )}
    >
      <div className="flex justify-between items-end">
        {room.state === 'inProgress' ? (
          <span className="text-sm text-gray-500">
            started {momentDate(room.createdAt).fromNow()}
          </span>
        ) : (
          <span className="text-sm text-gray-500">
            ended {momentDate(room.updatedAt).fromNow()}
          </span>
        )}
        <span
          className={cn('flex items-center space-x-2', isOpen ? 'text-teal-500' : 'text-red-500')}
        >
          <span>{isOpen ? 'In Progress' : !room.approvedAt ? 'Ended' : 'Approved'}</span>
          <button
            disabled={!isOpen}
            className="inline-flex disabled:cursor-default"
            onClick={handleCloseRoomClicked}
          >
            <span
              className={cn(
                'w-4 h-4 rounded-full border shadow',
                isOpen ? 'bg-teal-300 border-teal-400 animate-pulse' : 'bg-red-400 border-red-500',
              )}
            />
          </button>
          {adminKey && room.state === 'ended' && !room.approvedAt ? (
            <button
              className="inline-flex hover:opacity-70"
              onClick={() => {
                console.log('approve', room._id);
                approveRoomById({ adminKey, roomId: room._id as string })
                  .then(() => {
                    showNoti({ title: `Room ${room.title} has been Successfully approved.` });
                  })
                  .then(() => revalidate && revalidate());
              }}
            >
              <CheckCircleIcon className="w-6 h-6 text-green-500" />
            </button>
          ) : null}
          {adminKey && room.state === 'ended' && !room.approvedAt ? (
            <button
              className="inline-flex hover:opacity-70"
              onClick={() => {
                console.log('delete', room._id);
                deleteRoomById({ adminKey, roomId: room._id as string })
                  .then(() => {
                    showNoti({ title: `Room ${room.title} has been Successfully deleted.` });
                  })
                  .then(() => revalidate && revalidate());
              }}
            >
              <XMarkIcon className="w-6 h-6 text-gray-500" />
            </button>
          ) : null}
        </span>
      </div>
      <div className="mt-2 flex justify-between items-end">
        <h4 className="text-lg font-semibold line-clamp-2">{room.title}</h4>
        <span className="flex-shrink-0">{room.participants.length} members</span>
      </div>
      <div className="flex justify-between items-end">
        <div>
          <p className="mt-4 text-gray-500 text-sm">Dealer</p>
          <div className="mt-2 text-gray-500 text-sm font-semibold flex items-center">
            <Avatar
              className="inline-block mr-2"
              size="sm"
              src={room.dealer.profileUrl}
              nickname={room.dealer.displayName}
            />
            <p className="ml-1">
              {room.dealer.displayName} ({room.dealer.name})
            </p>
          </div>
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

export default function RoomListPage() {
  const { data, size, setSize, mutate } = useSWRInfinite<{ rooms: Room[]; roomCount: number }>(
    (index) => `/api/room?limit=${index}`,
  );

  const [adminKey] = useAdminKey();

  const { user } = useSession();
  const [joinedOnly, setJoinedOnly] = useState(false);

  const openRooms = useMemo(
    () =>
      data &&
      user &&
      data
        .map(({ rooms }) => rooms)
        .flat(1)
        .filter(({ state }) => state === 'inProgress')
        .filter(
          ({ participants }) =>
            !joinedOnly || participants.map(({ _id }) => _id).includes(user._id),
        ),
    [data, user, joinedOnly],
  );

  const closedRooms = useMemo(
    () =>
      data &&
      user &&
      data
        .map(({ rooms }) => rooms)
        .flat(1)
        .filter(({ state }) => state === 'ended')
        .filter(
          ({ participants }) =>
            !joinedOnly || participants.map(({ _id }) => _id).includes(user._id),
        ),
    [data, user, joinedOnly],
  );

  if (!openRooms || !closedRooms) return <Loading />;

  return (
    <>
      <NextSeo title="Mighty - Room List" />
      <div className="pb-12">
        <Title>Rooms</Title>
        <div className="mt-4 flex space-x-2">
          <span>Joined rooms only</span>
          <Toggle
            enabled={joinedOnly}
            setEnabled={setJoinedOnly}
            screenReaderLabel="joined rooms only"
          />
        </div>
        <section className="mt-2">
          <h3 className="text-lg font-medium">Open rooms ({openRooms.length})</h3>
          <div className="mt-4 space-y-4 lg:space-y-0 lg:grid lg:grid-cols-2 xl:grid-cols-3 gap-4">
            <Link
              href="/rooms/create"
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
                  adminKey={adminKey}
                  revalidate={() => mutate()}
                />
              ))}
          </div>
        </section>

        <section className={cn('mt-6', { hidden: closedRooms.length === 0 })}>
          <h3 className="text-lg font-medium">Closed rooms ({data && data[0].roomCount})</h3>
          <div className="mt-4 space-y-4 lg:space-y-0 lg:grid lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {closedRooms.map((room) => (
              <RoomListItem
                key={`room-${room._id}`}
                room={room}
                joined={!!user?._id && isParticipant(user._id, room)}
                adminKey={adminKey}
                revalidate={() => mutate()}
              />
            ))}
          </div>
        </section>
        {data && closedRooms.length < data[0].roomCount && (
          <div className="mt-8 max-w-lg mx-auto">
            <Button
              onClick={() => {
                setSize(size + 1);
              }}
              color="white"
              full
            >
              More
            </Button>
          </div>
        )}
      </div>
    </>
  );
}

RoomListPage.Layout = DashboardLayout;
