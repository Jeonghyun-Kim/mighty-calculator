import { useRouter } from 'next/router';
import { NextSeo } from 'next-seo';
import { useState } from 'react';
import useSWR from 'swr';

import { useUI } from '@components/context';
import { Loading, UserSelect } from '@components/core';
import { DashboardLayout } from '@components/layout';
import { Button } from '@components/ui';
import { createRoom } from '@lib/create-room';
import { useSession } from '@lib/hooks/use-session';
import { compareId } from '@lib/server/compare-id';

import type { UserInfo } from 'types/user';

interface UserInfoClient extends UserInfo {
  _id: string;
}

export default function CreateRoomPage() {
  const router = useRouter();
  const { user } = useSession();
  const { data: users } = useSWR<UserInfoClient[]>('/api/user/list');

  const [title, setTitle] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const { showNoti, closeNoti } = useUI();

  if (!users) return <Loading />;

  return (
    <>
      <NextSeo title="Mighty - Create New Room" />
      <div>
        <h2 className="text-2xl font-medium">Create new room</h2>

        <div className="mt-4 grid grid-cols-12 gap-6">
          <div className="col-span-12 sm:col-span-10 xl:col-span-6">
            <label htmlFor="title" className="text-sm font-medium text-gray-700">
              Title
            </label>
            <input
              type="text"
              name="title"
              id="title"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <p className="mt-2.5 ml-0.5 text-xs text-500">this cannot be changed.</p>
          </div>
        </div>

        <div className="mt-6">
          <label className="text-sm font-medium text-gray-700">Participants</label>
          <div className="mt-2 grid grid-cols-12 gap-4">
            {users
              .filter(({ _id }) => user && !compareId(_id, user._id))
              .map((user) => (
                <UserSelect
                  key={user._id}
                  className="col-span-12 sm:col-span-6 xl:col-span-4"
                  user={user}
                  selected={selectedUserIds.includes(user._id)}
                  onSelect={() => {
                    const idx = selectedUserIds.findIndex((id) => user._id === id);
                    if (idx === -1) {
                      setSelectedUserIds((prev) => [...prev, user._id]);
                    } else {
                      setSelectedUserIds((prev) => prev.filter((id) => id !== user._id));
                    }
                  }}
                />
              ))}
          </div>
        </div>

        <div className="mt-8 flex justify-end md:justify-start">
          <Button
            disabled={!title || loading}
            onClick={() => {
              setLoading(true);
              createRoom({ title, participantIds: selectedUserIds })
                .then((roomId) => {
                  router.push(`/room/${roomId}`).then(closeNoti);
                })
                .catch((err) =>
                  showNoti({ variant: 'alert', title: err.name, content: err.message }),
                )
                .finally(() => setLoading(false));
            }}
          >
            {loading ? 'Creating...' : 'Create'}
          </Button>
        </div>
      </div>
    </>
  );
}

CreateRoomPage.Layout = DashboardLayout;
