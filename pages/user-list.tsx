import { NextSeo } from 'next-seo';
import useSWR from 'swr';

import { Loading } from '@components/core';
import { DashboardLayout } from '@components/layout';
import { Avatar } from '@components/ui';

import { momentDate } from '@utils/moment';

import { UserInfo } from 'types/user';

export default function UserListPage() {
  const { data: users } = useSWR<UserInfo[]>('/api/user/list');

  if (!users) return <Loading />;

  return (
    <>
      <NextSeo title="Mighty - User List" />
      <div>
        <h2 className="text-2xl font-medium">Approved Users</h2>
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
                      Profile
                    </th>
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
                      nick
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
                      Activated
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(
                    ({ _id, name, displayName, email, profileUrl, activatedAt }, userIdx) => (
                      <tr
                        key={_id as string}
                        className={userIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <Avatar size="sm" src={profileUrl} />
                          </div>
                        </td>
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
                          {momentDate(activatedAt).fromNow()}
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

UserListPage.Layout = DashboardLayout;
