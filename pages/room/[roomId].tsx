import type { GetStaticPaths, GetStaticProps } from 'next';
import type { ParsedUrlQuery } from 'querystring';
import { ObjectId } from 'mongodb';
import cn from 'classnames';
import useSWR from 'swr';

import { DashboardLayout } from '@components/layout';
import { connectMongo } from '@utils/mongodb/connect';

import { Room } from 'types/room';
import { useSession } from '@lib/hooks/use-session';
import { Loading, Title } from '@components/core';
import { Game } from 'types/game';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useUI } from '@components/context';
import { closeRoomById } from '@lib/close-room-by-id';
import { Avatar, Button, Dropdown, Select } from '@components/ui';
import { transferDealerTo } from '@lib/transfer-dealer-to';
import { addNewGame } from '@lib/add-new-game';
import { XIcon } from '@heroicons/react/outline';
import { deleteGameById } from '@lib/delete-game-by-id';
import { UserInfo } from 'types/user';
import { calcScoresByGame } from '@utils/game/calc-scores-by-game';
import { momentDate } from '@utils/moment';

interface UserScore {
  user: UserInfo;
  score: number;
  president: { win: number; lose: number };
  friend: { win: number; lose: number };
  opposition: { win: number; lose: number };
}

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

function calcWinRatio({ win, lose }: { win: number; lose: number }) {
  if (!(win + lose)) return null;
  return (win / (win + lose)) * 100;
}

export default function RoomDetailsPage({ roomId }: PageProps) {
  const { user } = useSession();
  const { data: room, mutate: mutateRoom } = useSWR<Room>(`/api/room/${roomId}`);
  const { data: games, mutate: mutateGames } = useSWR<Game[]>(`/api/room/${roomId}/game`, {
    refreshInterval: 3000,
  });
  const [_presidentId, setPresidentId] = useState<string | null>(null);
  const [_friendId, setFriendId] = useState<string | null>(null);
  const [_diedId, setDiedId] = useState<string | null>(null);
  const [gameConfig, setGameConfig] = useState<Pick<Game, 'isNogi' | 'isRun'>>({
    isNogi: false,
    isRun: false,
  });
  const [loading, setLoading] = useState(false);
  const [scores, setScores] = useState<UserScore[] | null>(null);

  const gameType = useMemo(() => (room && room.participants.length === 6 ? '6M' : '5M'), [room]);
  const isOpen = useMemo(() => room && room.state === 'inProgress', [room]);
  const isValid = useMemo(() => {
    if (!room) return false;
    if (room.participants.length === 6) {
      return Boolean(_presidentId && _friendId && _diedId);
    }

    return Boolean(_presidentId && _friendId);
  }, [room, _presidentId, _friendId, _diedId]);

  const { showModal, alertNoti, showNoti } = useUI();

  const handleCloseRoomClicked = useCallback(() => {
    if (!room || !user) return;

    if (user._id !== room.dealer._id) {
      return alertNoti({
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
            .then(() => mutateRoom())
            .catch(alertNoti);
        },
      },
      cancelButton: {
        label: 'Cancel',
        onClick: () => {},
      },
    });
  }, [room, user, showModal, alertNoti, mutateRoom]);

  const handleAddNewGame = useCallback(
    (presidentWin: boolean) => {
      if (!room) return;
      setLoading(true);
      addNewGame(
        room._id as string,
        {
          type: gameType,
          ...gameConfig,
          win: presidentWin,
          _presidentId,
          _friendId,
          _diedId,
          _oppositionIds: room.participants
            .filter(({ _id }) => ![_presidentId, _friendId, _diedId].includes(_id as string))
            .map(({ _id }) => _id),
        } as never,
      )
        .then(() => mutateGames())
        .then(() => {
          setPresidentId(null);
          setFriendId(null);
          setDiedId(null);
          setGameConfig({ isNogi: false, isRun: false });
          showNoti({ title: 'Successfully Updated!' });
        })
        .catch(alertNoti)
        .finally(() => setLoading(false));
    },
    [
      room,
      gameType,
      gameConfig,
      _presidentId,
      _friendId,
      _diedId,
      mutateGames,
      alertNoti,
      showNoti,
    ],
  );

  useEffect(() => {
    if (!room || !games) return;

    const newScores = room.participants.map((user) => ({
      user,
      score: 0,
      president: { win: 0, lose: 0 },
      friend: { win: 0, lose: 0 },
      opposition: { win: 0, lose: 0 },
    }));

    games.forEach((game) => {
      calcScoresByGame(game).forEach(({ userId, score, president, friend, opposition }) => {
        const idx = newScores.findIndex(({ user }) => user._id === userId);
        if (idx !== -1) {
          newScores[idx].score += score;
          if (president) newScores[idx].president[president > 0 ? 'win' : 'lose'] += 1;
          if (friend) newScores[idx].friend[friend > 0 ? 'win' : 'lose'] += 1;
          if (opposition) newScores[idx].opposition[opposition > 0 ? 'win' : 'lose'] += 1;
        }
      });
    });

    setScores(newScores);
  }, [room, games]);

  if (!room || !games || !user || !scores) return <Loading />;

  return (
    <div className="pb-12">
      <div className="flex justify-between items-center">
        <Title>
          Room - {room.title} ({gameType})
        </Title>

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
                        .catch(alertNoti);
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

      <div className="mt-4">
        <h6 className="font-medium">Scores</h6>
        <div className="mt-2 flex flex-col">
          <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
              <div className="shadow-md overflow-hidden border-b border-gray-200 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-4 py-3 text-center sm:text-left md:text-center lg:text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Member
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center"
                      >
                        Score
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center"
                      >
                        President
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center"
                      >
                        Friend
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center"
                      >
                        Opposition
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center"
                      >
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {scores
                      .sort((a, b) => b.score - a.score)
                      .map(({ user: player, score, president, friend, opposition }) => (
                        <tr
                          key={player._id as string}
                          className={cn({ 'bg-teal-50': player._id === user._id })}
                        >
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center justify-center sm:justify-start md:justify-center lg:justify-start">
                              <div>
                                <Avatar size="sm" src={player.profileUrl} />
                              </div>
                              <div className="ml-4 hidden sm:block md:hidden lg:block">
                                <div className="text-sm font-medium text-gray-900">
                                  {player.displayName}
                                </div>
                                <div className="text-sm text-gray-500">{player.name}</div>
                              </div>
                            </div>
                          </td>
                          <td
                            className={cn(
                              'px-4 py-4 whitespace-nowrap text text-center font-semibold',
                              {
                                'text-gray-500': !score,
                                'text-teal-600': score > 0,
                                'text-red-500': score < 0,
                              },
                            )}
                          >
                            {score}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                            {president.win} / {president.lose}
                            <br />(
                            {calcWinRatio(president) !== null
                              ? `${calcWinRatio(president)?.toFixed(1)}%`
                              : 'NULL'}
                            )
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                            {friend.win} / {friend.lose}
                            <br />(
                            {calcWinRatio(friend) !== null
                              ? `${calcWinRatio(friend)?.toFixed(1)}%`
                              : 'NULL'}
                            )
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                            {opposition.win} / {opposition.lose}
                            <br />(
                            {calcWinRatio(opposition) !== null
                              ? `${calcWinRatio(opposition)?.toFixed(1)}%`
                              : 'NULL'}
                            )
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                            {president.win + friend.win + opposition.win} /{' '}
                            {president.lose + friend.lose + opposition.lose}
                            <br />(
                            {calcWinRatio({
                              win: president.win + friend.win + opposition.win,
                              lose: president.lose + friend.lose + opposition.lose,
                            }) !== null
                              ? `${calcWinRatio({
                                  win: president.win + friend.win + opposition.win,
                                  lose: president.lose + friend.lose + opposition.lose,
                                })?.toFixed(1)}%`
                              : 'NULL'}
                            )
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className={cn('mt-4', {
          hidden: !isOpen || user._id !== room.dealer._id,
        })}
      >
        <h6 className="font-medium">Register a new game</h6>
        <div className="mt-2 border border-gray-200 rounded-md shadow-md">
          <form className="p-4 space-y-4" onSubmit={(e) => e.preventDefault()}>
            <Select
              label="Died"
              className={cn({ hidden: room.participants.length !== 6 })}
              items={[
                { key: 'died-null', label: 'Not Selected', value: null },
                ...room.participants.map(({ _id, displayName }) => ({
                  key: `died-${_id}`,
                  label: displayName,
                  value: _id,
                })),
              ]}
              selectedValue={_diedId}
              onSelect={({ value }) => setDiedId(value as never)}
            />
            <Select
              label="President"
              items={[
                { key: 'president-null', label: 'Not Selected', value: null },
                ...room.participants
                  .filter(({ _id }) => _id !== _diedId)
                  .map(({ _id, displayName }) => ({
                    key: `president-${_id}`,
                    label: displayName,
                    value: _id,
                  })),
              ]}
              selectedValue={_presidentId}
              onSelect={({ value }) => setPresidentId(value as never)}
            />
            <Select
              label="Friend"
              disabled={_presidentId === null}
              items={[
                { key: 'friend-null', label: 'Not Selected', value: null },
                ...room.participants
                  .filter(({ _id }) => _id !== _diedId)
                  // .filter(({ _id }) => _id !== _presidentId)
                  .map(({ _id, displayName }) => ({
                    key: `friend-${_id}`,
                    label: _id === _presidentId ? `${displayName} - (NF)` : displayName,
                    value: _id,
                  })),
              ]}
              selectedValue={_friendId}
              onSelect={({ value }) => setFriendId(value as never)}
            />
            <div className="divide-y divide-gray-200">
              <div className="relative flex items-start py-4">
                <div className="min-w-0 flex-1 text-sm">
                  <label htmlFor="no-giru" className="font-medium text-gray-700">
                    No-Giru (노기루)
                  </label>
                  <p id="no-giru-description" className="text-gray-500">
                    This game was No-Giru. (2x score)
                  </p>
                </div>
                <div className="ml-3 flex items-center h-5">
                  <input
                    id="no-giru"
                    aria-describedby="no-giru-description"
                    name="no-giru"
                    type="checkbox"
                    checked={gameConfig.isNogi}
                    onChange={(e) =>
                      setGameConfig((prev) => ({ ...prev, isNogi: e.target.checked }))
                    }
                    className="focus:ring-teal-500 h-5 w-5 text-teal-600 border-gray-300 rounded"
                  />
                </div>
              </div>
              <div>
                <div className="relative flex items-start py-4">
                  <div className="min-w-0 flex-1 text-sm">
                    <label htmlFor="run" className="font-medium text-gray-700">
                      Run
                    </label>
                    <p id="run-description" className="text-gray-500">
                      This game was run or back-run. (2x score)
                    </p>
                  </div>
                  <div className="ml-3 flex items-center h-5">
                    <input
                      id="run"
                      aria-describedby="run-description"
                      name="run"
                      type="checkbox"
                      checked={gameConfig.isRun}
                      onChange={(e) =>
                        setGameConfig((prev) => ({ ...prev, isRun: e.target.checked }))
                      }
                      className="focus:ring-teal-500 h-5 w-5 text-teal-600 border-gray-300 rounded"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                color="white"
                full
                disabled={loading || !isValid}
                onClick={() => handleAddNewGame(false)}
              >
                Opposition (야당)
              </Button>
              <Button
                color="teal"
                full
                disabled={loading || !isValid}
                onClick={() => handleAddNewGame(true)}
              >
                President (주공)
              </Button>
            </div>
          </form>
        </div>
      </div>

      <div className="mt-4">
        <h6 className="font-medium">History ({games.length})</h6>
        {games.length === 0 ? (
          <p className="my-2 text-center text-gray-500 text-sm lg:text-left">
            There is no game in this room.
          </p>
        ) : (
          <div className="mt-2 flex flex-col">
            <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                <div className="shadow-md overflow-hidden border-b border-gray-200 sm:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-4 py-3 text-center sm:text-left md:text-center lg:text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          President
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 text-center sm:text-left md:text-center lg:text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Friend
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center"
                        >
                          Nogi
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center"
                        >
                          Run
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center"
                        >
                          Win
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center hidden lg:table-cell"
                        >
                          At
                        </th>
                        <th
                          scope="col"
                          className={cn('relative px-4 py-3', {
                            hidden: !isOpen || user._id !== room.dealer._id,
                          })}
                        >
                          <span className="sr-only">Delete</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {games.map((game) => {
                        const president = room.participants.find(
                          ({ _id }) => _id === game._presidentId,
                        )!;
                        const friend = room.participants.find(({ _id }) => _id === game._friendId)!;
                        return (
                          <tr key={game._id as string}>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="flex items-center justify-center sm:justify-start md:justify-center lg:justify-start">
                                <Avatar size="sm" src={president.profileUrl} />
                                <div className="ml-4 hidden sm:block md:hidden lg:block">
                                  <div className="text-sm font-medium text-gray-900">
                                    {president.displayName}
                                  </div>
                                  <div className="text-sm text-gray-500">{president.name}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="flex items-center justify-center sm:justify-start md:justify-center lg:justify-start">
                                <Avatar size="sm" src={friend.profileUrl} />
                                <div className="ml-4 hidden sm:block md:hidden lg:block">
                                  <div className="text-sm font-medium text-gray-900">
                                    {friend.displayName}
                                  </div>
                                  <div className="text-sm text-gray-500">{friend.name}</div>
                                </div>
                              </div>
                            </td>
                            <td
                              className={cn(
                                'px-4 py-4 whitespace-nowrap text-sm text-center',
                                game.isNogi ? 'text-teal-500' : 'text-red-500',
                              )}
                            >
                              {game.isNogi ? 'Y' : 'N'}
                            </td>
                            <td
                              className={cn(
                                'px-4 py-4 whitespace-nowrap text-sm text-center',
                                game.isRun ? 'text-teal-500' : 'text-red-500',
                              )}
                            >
                              {game.isRun ? 'Y' : 'N'}
                            </td>
                            <td
                              className={cn(
                                'px-4 py-4 whitespace-nowrap text-sm text-center',
                                game.win ? 'text-teal-500' : 'text-red-500',
                              )}
                            >
                              {game.win ? 'Y' : 'N'}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-500 hidden lg:table-cell">
                              {momentDate(game.createdAt).fromNow()}
                            </td>
                            <td
                              className={cn(
                                'px-4 py-4 whitespace-nowrap text-right text-sm font-medium',
                                {
                                  hidden: !isOpen || user._id !== room.dealer._id,
                                },
                              )}
                            >
                              <button
                                className="text-red-600 hover:text-red-900"
                                onClick={() => {
                                  showModal({
                                    variant: 'alert',
                                    title: 'Delete Game Confirmation',
                                    content: `Are you sure you want to delete the game? This action cannot be reverted. (president ${
                                      president.displayName
                                    } ${game.win ? 'won' : 'lost'})`,
                                    actionButton: {
                                      label: 'Delete',
                                      onClick: () => {
                                        deleteGameById({ gameId: game._id })
                                          .then(() => {
                                            showNoti({ title: 'Successfully deleted the game' });
                                            mutateGames();
                                          })
                                          .catch(alertNoti);
                                      },
                                    },
                                    cancelButton: {
                                      label: 'Cancel',
                                      onClick: () => {},
                                    },
                                  });
                                }}
                              >
                                <XIcon className="w-5 h-5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

RoomDetailsPage.Layout = DashboardLayout;
