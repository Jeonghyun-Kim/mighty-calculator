import { useRouter } from 'next/router';
import { useCallback, useEffect, useState } from 'react';

import { Unwrap } from 'types';

import { useUI } from '@components/context';
import Loading from '@components/core/Loading';
import { DashboardLayout } from '@components/layout';
import { Button } from '@components/ui';

import { approveRoomById } from '@lib/approve-room-by-id';
import { approveSignupRequest } from '@lib/approve-signup-request';
import { checkAdminKey } from '@lib/check-admin-key';
import { deleteRoomById } from '@lib/delete-room-by-id';
import { getEndedRooms } from '@lib/get-ended-rooms';
import { getSignupRequests } from '@lib/get-signup-requests';
import { useAdminKey } from '@lib/hooks/use-admin-key';

import { momentDate } from '@utils/moment';

export default function AdminPage() {
  const router = useRouter();

  const [adminKey, setAdminKey] = useState('');
  const [storedAdminKey, setStoredAdminKey] = useAdminKey();
  const [users, setUsers] = useState<Unwrap<typeof getSignupRequests> | null>(null);
  const [rooms, setRooms] = useState<Unwrap<typeof getEndedRooms> | null>(null);
  const [loadingFlags, setLoadingFlags] = useState({
    validKey: false,
    signupList: false,
    signupApprove: false,
    roomList: false,
    roomApprove: false,
    roomDelete: false,
  });

  const { showNoti, alertNoti, showModal } = useUI();

  const registerAdminKey = useCallback(
    (adminKey: string) => {
      setLoadingFlags((prev) => ({ ...prev, validKey: true }));
      checkAdminKey({ adminKey })
        .then(() => setStoredAdminKey(adminKey))
        .catch(alertNoti)
        .finally(() => {
          setLoadingFlags((prev) => ({ ...prev, signupApprove: false }));
        });
    },
    [setStoredAdminKey, alertNoti],
  );

  const fetchUserList = useCallback(
    (adminKey: string) => {
      setLoadingFlags((prev) => ({ ...prev, signupList: true }));
      getSignupRequests({ adminKey })
        .then(setUsers)
        .catch((err) => {
          alertNoti(err);
          setStoredAdminKey(null);
        })
        .finally(() => {
          setLoadingFlags((prev) => ({ ...prev, signupList: false }));
        });
    },
    [alertNoti, setStoredAdminKey],
  );

  const fetchRoomList = useCallback(
    (adminKey: string) => {
      setLoadingFlags((prev) => ({ ...prev, roomList: true }));
      getEndedRooms({ adminKey })
        .then(setRooms)
        .catch((err) => {
          alertNoti(err);
          setStoredAdminKey(null);
        })
        .finally(() => {
          setLoadingFlags((prev) => ({ ...prev, roomList: false }));
        });
    },
    [alertNoti, setStoredAdminKey],
  );

  useEffect(() => {
    if (storedAdminKey) {
      fetchUserList(storedAdminKey);
      fetchRoomList(storedAdminKey);
    }
  }, [storedAdminKey, fetchUserList, fetchRoomList]);

  const handleApproveById = useCallback(
    (adminKey: string, userId: string, displayName: string) => {
      setLoadingFlags((prev) => ({ ...prev, signupApprove: true }));
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
          setLoadingFlags((prev) => ({ ...prev, signupApprove: false }));
        });
    },
    [alertNoti, showModal, setStoredAdminKey, router, fetchUserList],
  );

  const handleApproveRoomById = useCallback(
    (adminKey: string, roomId: string, title: string) => {
      setLoadingFlags((prev) => ({ ...prev, roomApprove: true }));
      approveRoomById({ adminKey, roomId })
        .then(() => {
          showModal({
            title: 'Room Approved.',
            content: `Room ${title} has been Successfully approved.`,
            actionButton: {
              label: 'Back to Dashboard',
              onClick: () => router.push('/dashboard'),
            },
            cancelButton: {
              label: 'Stay',
              onClick: () => {},
            },
          });
        })
        .then(() => fetchRoomList(adminKey))
        .catch((err) => {
          alertNoti(err);
          setStoredAdminKey(null);
        })
        .finally(() => {
          setLoadingFlags((prev) => ({ ...prev, roomApprove: false }));
        });
    },
    [alertNoti, showModal, setStoredAdminKey, router, fetchRoomList],
  );

  const handleDeleteRoomById = useCallback(
    (adminKey: string, roomId: string, title: string) => {
      setLoadingFlags((prev) => ({ ...prev, roomDelete: true }));
      deleteRoomById({ adminKey, roomId })
        .then(() => fetchRoomList(adminKey))
        .then(() => {
          showNoti({ title: `Room ${title} has been Successfully deleted.` });
        })
        .catch((err) => {
          alertNoti(err);
          setStoredAdminKey(null);
        })
        .finally(() => {
          setLoadingFlags((prev) => ({ ...prev, roomDelete: false }));
        });
    },
    [alertNoti, showNoti, setStoredAdminKey, fetchRoomList],
  );

  return (
    <div className="max-w-screen-lg mx-auto py-8 px-4">
      {!storedAdminKey ? (
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
      ) : (
        <div>
          <Button
            color="red"
            onClick={() => {
              setStoredAdminKey(null);
              setAdminKey('');
              setUsers(null);
              setRooms(null);
            }}
          >
            Clear Key
          </Button>
        </div>
      )}

      {users === null || rooms === null ? (
        // Initial state. (without adminKey)
        <div className="mt-8">Enter the Admin Key first.</div>
      ) : (
        <div>
          <div className="mt-8">
            <h4>Singup Request List</h4>
            {loadingFlags.signupList ? (
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
                                disabled={!storedAdminKey || loadingFlags.signupApprove}
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

          <div className="mt-8">
            <h4>Ended Room List</h4>
            {loadingFlags.roomList ? (
              // Fetching singup request list
              <Loading />
            ) : rooms.length === 0 ? (
              // Emtpy request list
              <p className="mt-4 font-medium text-lg">There&apos;s no unapproved ended room.</p>
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
                            Title
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Members
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Dealer Name
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Updated At
                          </th>
                          <th scope="col" className="relative px-6 py-3">
                            <span className="sr-only">Preview</span>
                          </th>
                          <th scope="col" className="relative px-6 py-3">
                            <span className="sr-only">Approve</span>
                          </th>
                          <th scope="col" className="relative px-6 py-3">
                            <span className="sr-only">Delete</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {rooms.map(({ _id, title, participants, dealer, updatedAt }, roomIdx) => (
                          <tr
                            key={_id as string}
                            className={roomIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {title}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {participants.length}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {dealer.displayName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {momentDate(updatedAt).fromNow()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <a
                                className="text-teal-600 hover:text-teal-900"
                                href={`/room/${_id}`}
                                target="_blank"
                                rel="noreferrer noopener"
                              >
                                Preview
                              </a>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                className="text-teal-600 hover:text-teal-900"
                                disabled={!storedAdminKey || loadingFlags.roomApprove}
                                onClick={() => {
                                  if (!storedAdminKey) return;
                                  handleApproveRoomById(storedAdminKey, _id as string, title);
                                }}
                              >
                                Approve
                              </button>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                className="text-teal-600 hover:text-teal-900"
                                disabled={!storedAdminKey || loadingFlags.roomDelete}
                                onClick={() => {
                                  if (!storedAdminKey) return;

                                  showModal({
                                    variant: 'alert',
                                    title: 'Room Deletion Confirmation',
                                    content: `Are you sure you want to delete this room? This action cannot be reverted.`,
                                    actionButton: {
                                      label: 'Delete',
                                      onClick: () =>
                                        handleDeleteRoomById(storedAdminKey, _id as string, title),
                                    },
                                    cancelButton: {
                                      label: 'Cancel',
                                      onClick: () => {},
                                    },
                                  });
                                }}
                              >
                                Delete
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
        </div>
      )}
    </div>
  );
}

AdminPage.Layout = DashboardLayout;
