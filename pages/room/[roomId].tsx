import type { GetStaticPaths, GetStaticProps } from 'next';
import type { ParsedUrlQuery } from 'querystring';
import { ObjectId } from 'mongodb';
import cn from 'classnames';

import { DashboardLayout } from '@components/layout';
import { connectMongo } from '@utils/connect-mongo';

import { Room } from 'types/room';
import { useSession } from '@lib/hooks/use-session';
import useSWR, { mutate } from 'swr';
import { Loading, Title } from '@components/core';
import { Game } from 'types/game';
import { useCallback, useMemo } from 'react';
import { useUI } from '@components/context';
import { closeRoomById } from '@lib/close-room-by-id';
import { Avatar, Button, Dropdown } from '@components/ui';
import { transferDealerTo } from '@lib/transfer-dealer-to';

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: [],
    fallback: 'blocking',
  };
};

interface PageProps {
  roomId: string;
}

interface Params extends ParsedUrlQuery {
  roomId: string;
}

export const getStaticProps: GetStaticProps<PageProps, Params> = async ({ params }) => {
  if (!params) throw new Error('missing params');

  const { db } = await connectMongo();
  const room = await db
    .collection<Room>('room')
    .findOne({ _id: new ObjectId(params.roomId), deletedAt: null }, { projection: { _id: 1 } });

  if (!room) return { notFound: true };

  return { props: { roomId: params.roomId } };
};

export default function RoomDetailsPage({ roomId }: PageProps) {
  const { user } = useSession();
  const { data: room, mutate: mutateRoom } = useSWR<Room>(`/api/room/${roomId}`);
  const { data: games } = useSWR<Game[]>(`/api/room/${roomId}/game`);

  const isOpen = useMemo(() => room && room.state === 'inProgress', [room]);

  const { showModal, showNoti } = useUI();

  const showAlert = useCallback(
    (err: { name: string; message: string }) =>
      showNoti({ variant: 'alert', title: err.name, content: err.message }),
    [showNoti],
  );

  const handleCloseRoomClicked = useCallback(() => {
    if (!room || !user) return;

    if (user._id !== room.dealer._id) {
      return showAlert({
        name: 'No permission',
        message: 'Only dealer can close the room.',
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
            .catch(showAlert);
        },
      },
      cancelButton: {
        label: 'Cancel',
        onClick: () => {},
      },
    });
  }, [room, user, showModal, showAlert]);

  if (!room || !games || !user) return <Loading />;

  return (
    <div>
      <div className="flex justify-between items-center">
        <Title>Room - {room.title}</Title>

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
        </span>
      </div>
      <div className="mt-2">
        <h6 className="font-medium">Dealer</h6>
        <div className="flex justify-between items-center">
          <div className="mt-1 flex items-center p-2">
            <Avatar src={room.dealer.profileUrl} />
            <div className="ml-2">
              <p className="text-gray-700 font-semibold">{room.dealer.displayName}</p>
              <p className="text-gray-500 text-sm">{room.dealer.name}</p>
            </div>
          </div>
          <div className={cn('flex', { hidden: user._id !== room.dealer._id })}>
            <div className={cn({ hidden: !isOpen })}>
              <Dropdown
                button={
                  <Button color="white" as="div">
                    Transfer To
                  </Button>
                }
                dropdownItems={room.participants
                  .filter(({ _id }) => _id !== room.dealer._id)
                  .map((user) => ({
                    label: user.displayName,
                    onClick: () => {
                      transferDealerTo(room._id, user._id)
                        .then(() => mutateRoom())
                        .then(() =>
                          showNoti({
                            title: `The dealer successfully transferred to ${user.displayName}.`,
                          }),
                        )
                        .catch(showAlert);
                    },
                  }))}
              />
            </div>
            <div className="hidden ml-4 lg:block">
              <Button
                color={isOpen ? 'red' : 'white'}
                disabled={!isOpen}
                onClick={handleCloseRoomClicked}
              >
                {isOpen ? 'End this room' : 'Room ended'}
              </Button>
            </div>
          </div>
        </div>
      </div>
      <div
        className={cn('my-4 lg:hidden', {
          hidden: user._id !== room.dealer._id,
        })}
      >
        <Button
          full
          color={isOpen ? 'red' : 'white'}
          disabled={!isOpen}
          onClick={handleCloseRoomClicked}
        >
          {isOpen ? 'End this room' : 'Room ended'}
        </Button>
      </div>
    </div>
  );
}

RoomDetailsPage.Layout = DashboardLayout;
