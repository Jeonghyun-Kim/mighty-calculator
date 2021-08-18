import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/router';

import { useUI } from '@components/context';
import { Button } from '@components/ui';
import { getSignupRequests } from '@lib/get-signup-requests';
import Loading from '@components/core/Loading';
import { approveSignupRequest } from '@lib/approve-signup-request';
import { momentDate } from '@utils/moment';
import { DashboardLayout } from '@components/layout';
import { useAdminKey } from '@lib/hooks/use-admin-key';

import { Unwrap } from 'types';
import { checkAdminKey } from '@lib/check-admin-key';

export default function AdminPage() {
  const router = useRouter();

  const [adminKey, setAdminKey] = useState('');
  const [storedAdminKey, setStoredAdminKey] = useAdminKey();
  const [users, setUsers] = useState<Unwrap<typeof getSignupRequests> | null>(null);
  const [loadingFlags, setLoadingFlags] = useState({
    validKey: false,
    list: false,
    approve: false,
  });

  const { alertNoti, showModal } = useUI();

  const registerAdminKey = useCallback(
    (adminKey: string) => {
      setLoadingFlags((prev) => ({ ...prev, validKey: true }));
      checkAdminKey({ adminKey })
        .then(() => setStoredAdminKey(adminKey))
        .catch(alertNoti)
        .finally(() => {
          setLoadingFlags((prev) => ({ ...prev, approve: false }));
        });
    },
    [setStoredAdminKey, alertNoti],
  );

  const fetchUserList = useCallback(
    (adminKey: string) => {
      setLoadingFlags((prev) => ({ ...prev, list: true }));
      getSignupRequests({ adminKey })
        .then(setUsers)
        .then(() => setStoredAdminKey(adminKey))
        .catch((err) => {
          alertNoti(err);
          setStoredAdminKey(null);
        })
        .finally(() => {
          setLoadingFlags((prev) => ({ ...prev, list: false }));
        });
    },
    [alertNoti, setStoredAdminKey],
  );

  useEffect(() => {
    if (storedAdminKey) fetchUserList(storedAdminKey);
  }, [storedAdminKey, fetchUserList]);

  const handleApproveById = useCallback(
    (adminKey: string, userId: string, displayName: string) => {
      setLoadingFlags((prev) => ({ ...prev, approve: true }));
      approveSignupRequest({ adminKey, userId })
        .then(() =>
          showModal({
            title: 'Signup Request Approved',
            content: `Successfully approved user '${displayName}'. You can approve another user or go back to dashboard.`,
            actionButton: {
              label: 'Back to Dashboard',
              onClick: () => router.push('/dashboard'),
            },
            cancelButton: {
              label: 'Stay',
              onClick: () => {},
            },
          }),
        )
        .then(() => fetchUserList(adminKey))
        .catch((err) => {
          alertNoti(err);
          setStoredAdminKey(null);
        })
        .finally(() => {
          setLoadingFlags((prev) => ({ ...prev, approve: false }));
        });
    },
    [alertNoti, showModal, setStoredAdminKey, router, fetchUserList],
  );

  return (
    <div className="max-w-screen-lg mx-auto py-8 px-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          registerAdminKey(adminKey);
        }}
      >
        <label htmlFor="adminKey" className="block text-sm font-medium text-gray-700">
          Admin Key
        </label>
        <div className="mt-1 flex space-x-2">
          <input
            type="password"
            name="adminKey"
            id="adminKey"
            className="shadow-sm block w-full sm:text-sm border-gray-300 rounded-md flex-1"
            placeholder="SECRET KEY"
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
          />
          <Button type="submit" size="sm">
            Submit
          </Button>
        </div>
      </form>

      {users === null ? (
        // Initial state. (without adminKey)
        <div className="mt-8">Enter the Admin Key first.</div>
      ) : (
        <div className="mt-8">
          <h4>Singup Request List</h4>
          {loadingFlags.list ? (
            // Fetching singup request list
            <Loading />
          ) : users.length === 0 ? (
            // Emtpy request list
            <p className="mt-4 font-medium text-lg">There&apos;s no pending signup request.</p>
          ) : (
            <div className="mt-2 -mb-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Name
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          DisplayName
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Email
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Requested At
                        </th>
                        <th scope="col" className="relative px-6 py-3">
                          <span className="sr-only">Approve</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(({ _id, name, displayName, email, createdAt }, userIdx) => (
                        <tr
                          key={_id as string}
                          className={userIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {displayName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {momentDate(createdAt).fromNow()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              className="text-teal-600 hover:text-teal-900"
                              disabled={!storedAdminKey}
                              onClick={() => {
                                if (!storedAdminKey) return;
                                handleApproveById(storedAdminKey, _id as string, displayName);
                              }}
                            >
                              Approve
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

AdminPage.Layout = DashboardLayout;
