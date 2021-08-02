import { useCallback, useEffect, useState } from 'react';

import { useUI } from '@components/context';
import Loading from '@components/core/Loading';
import { DashboardLayout } from '@components/layout';
import { Button } from '@components/ui';
import { useSession } from '@lib/hooks/use-session';
import { updateDisplayName } from '@lib/update-display-name';

export default function ProfilePage() {
  const { user, mutate } = useSession();
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [loadingFlags, setLoadingFlags] = useState({ displayName: false, picture: false });

  const { showNoti } = useUI();

  useEffect(() => {
    if (user) setDisplayName(user.displayName);
  }, [user]);

  const handleUpdateDisplayName = useCallback(
    (displayName: string) => {
      if (!displayName || loadingFlags.displayName) return;
      setLoadingFlags((prev) => ({ ...prev, displayName: true }));
      updateDisplayName(displayName)
        .then(() => mutate())
        .catch((err) => showNoti({ variant: 'alert', title: err.name, content: err.message }))
        .finally(() => setLoadingFlags((prev) => ({ ...prev, displayName: false })));
    },
    [loadingFlags.displayName, mutate, showNoti],
  );

  if (!user || displayName === null) return <Loading />;

  return (
    <div className="max-w-screen-md mx-auto">
      <div className="mt-6">
        <h2 className="text-3xl font-medium">Profile</h2>
        <p className="mt-3 text-gray-700">
          This information will be displayed publicly so be careful what you share.
        </p>
      </div>

      {/* name section */}
      <div className="mt-8 p-4 border border-gray-200 rounded-lg">
        <h4 className="text-lg font-medium text-gray-700">Name</h4>
        <p className="mt-1.5 text-sm text-gray-500">
          Used to identify you by admin. Please contact{' '}
          <a className="text-teal-700 hover:opacity-70" href="mailto:kimjh@bawi.org">
            admin
          </a>
          &nbsp;if you want to change this field.
        </p>
        <form className="mt-4 grid grid-cols-12 gap-6">
          <div className="col-span-12 sm:col-span-6">
            <label htmlFor="full-name" className="text-sm font-medium text-gray-700 hidden">
              Full name
            </label>
            <input
              type="text"
              name="full-name"
              id="full-name"
              disabled
              value={user.name}
              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500"
            />
          </div>
          <div className="col-span-12 sm:col-span-6 flex justify-end">
            <Button type="submit" disabled size="sm">
              Save
            </Button>
          </div>
        </form>
      </div>

      {/* displayName section */}
      <div className="mt-8 p-4 border border-gray-200 rounded-lg">
        <h4 className="text-lg font-medium text-gray-700">Display Name</h4>
        <p className="mt-1.5 text-sm text-gray-500">
          This could be your first name, or a nickname - however you&apos;d like people to refer to
          you in Mighty Network 23rd.
        </p>
        <form
          className="mt-4 grid grid-cols-12 gap-6"
          onSubmit={(e) => {
            e.preventDefault();
            handleUpdateDisplayName(displayName);
          }}
        >
          <div className="col-span-12 sm:col-span-6">
            <label htmlFor="displayName" className="text-sm font-medium text-gray-700 hidden">
              Display Name
            </label>
            <input
              type="text"
              name="displayName"
              id="displayName"
              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
          <div className="col-span-12 sm:col-span-6 flex justify-end">
            <Button
              type="submit"
              disabled={
                loadingFlags.displayName ||
                user.displayName === displayName.trim() ||
                displayName.trim().length < 2
              }
              size="sm"
            >
              Save
            </Button>
          </div>
        </form>
      </div>

      {/* TODO: add profile picture section */}
      <div className="mt-8 p-4 border border-gray-200 rounded-lg">
        <h4 className="text-lg font-medium text-gray-700">Picture</h4>
        <p className="mt-1.5 text-sm text-gray-500">This feature is preparing now.</p>
      </div>
    </div>
  );
}

ProfilePage.Layout = DashboardLayout;
