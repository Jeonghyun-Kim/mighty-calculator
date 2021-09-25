import { Dialog, Transition } from '@headlessui/react';
import {
  HomeIcon,
  LockOpenIcon,
  MenuIcon,
  RssIcon,
  UsersIcon,
  XIcon,
  FingerPrintIcon,
} from '@heroicons/react/outline';
import cn from 'classnames';
import NextImage from 'next/image';
import { useRouter } from 'next/router';
import { Fragment, useMemo, useState } from 'react';

import CommonLayout from '@components/layout/Common';
import { Avatar, Link } from '@components/ui';

import { useAdminKey } from '@lib/hooks/use-admin-key';
import { useSession } from '@lib/hooks/use-session';

const initialNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Users', href: '/user-list', icon: UsersIcon },
  { name: 'Rooms', href: '/rooms', icon: RssIcon },
  // { name: 'Calendar', href: '#', icon: CalendarIcon },
  // { name: 'Documents', href: '#', icon: InboxIcon },
  // { name: 'Reports', href: '#', icon: ChartBarIcon },
] as const;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useSession({ redirectTo: '/signin' });
  const [adminKey] = useAdminKey();

  const navigation = useMemo(
    () =>
      adminKey === null
        ? initialNavigation
        : [{ name: 'Admin', href: '/admin', icon: FingerPrintIcon }, ...initialNavigation],
    [adminKey],
  );

  return (
    <CommonLayout className="h-full flex bg-white">
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog
          as="div"
          static
          className="fixed inset-0 flex z-40 md:hidden"
          open={sidebarOpen}
          onClose={setSidebarOpen}
        >
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0 bg-gray-600 bg-opacity-75" />
          </Transition.Child>
          <Transition.Child
            as={Fragment}
            enter="transition ease-in-out duration-300 transform"
            enterFrom="-translate-x-full"
            enterTo="translate-x-0"
            leave="transition ease-in-out duration-300 transform"
            leaveFrom="translate-x-0"
            leaveTo="-translate-x-full"
          >
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
              <Transition.Child
                as={Fragment}
                enter="ease-in-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in-out duration-300"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div className="absolute top-0 right-0 -mr-12 pt-2">
                  <button
                    className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className="sr-only">Close sidebar</span>
                    <XIcon className="h-6 w-6 text-white" aria-hidden="true" />
                  </button>
                </div>
              </Transition.Child>
              <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                <div className="flex-shrink-0 flex items-center px-4">
                  <NextImage src="/assets/spades.svg" alt="Spade" width={24} height={28} />
                </div>
                <nav className="mt-5 px-2 space-y-1">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        router.asPath.startsWith(item.href)
                          ? 'bg-gray-100 text-gray-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                        'group flex items-center px-2 py-2 text-base font-medium rounded-md',
                      )}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <item.icon
                        className={cn(
                          router.asPath.startsWith(item.href)
                            ? 'text-gray-500'
                            : 'text-gray-400 group-hover:text-gray-500',
                          'mr-4 flex-shrink-0 h-6 w-6',
                        )}
                        aria-hidden="true"
                      />
                      {item.name}
                    </Link>
                  ))}
                </nav>
              </div>
              <div className="p-2">
                <a
                  href="/signout"
                  className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex w-full items-center px-2 py-2 text-base font-medium rounded-md"
                >
                  <LockOpenIcon className="text-gray-400 group-hover:text-gray-500 mr-4 flex-shrink-0 h-6 w-6" />
                  Sign Out
                </a>
              </div>
              <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
                <Link
                  href="/profile"
                  className="flex-shrink-0 group block"
                  onClick={() => setSidebarOpen(false)}
                >
                  <div className="flex items-center">
                    <Avatar src={user?.profileUrl} />
                    <div className="ml-3">
                      <p className="text-base font-medium text-gray-700 group-hover:text-gray-900">
                        {(user?.displayName || user?.name) ?? 'Loading...'}
                      </p>
                      <p className="text-sm font-medium text-gray-500 group-hover:text-gray-700">
                        View profile
                      </p>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </Transition.Child>
          <div className="flex-shrink-0 w-14">
            {/* Force sidebar to shrink to fit close icon */}
          </div>
        </Dialog>
      </Transition.Root>

      {/* Static sidebar for desktop */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          {/* Sidebar component, swap this element with another sidebar if you like */}
          <div className="flex flex-col h-0 flex-1 border-r border-gray-200 bg-white">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex items-end flex-shrink-0 px-4">
                <NextImage src="/assets/spades.svg" alt="Spade" width={36} height={43} />
                <span className="ml-4 text-2xl italic font-mono tracking-tighter">Mighty 23rd</span>
              </div>
              <nav className="mt-5 flex-1 px-2 bg-white space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      router.asPath.startsWith(item.href)
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                      'group flex items-center px-2 py-2 text-sm font-medium rounded-md',
                    )}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon
                      className={cn(
                        router.asPath.startsWith(item.href)
                          ? 'text-gray-500'
                          : 'text-gray-400 group-hover:text-gray-500',
                        'mr-3 flex-shrink-0 h-6 w-6',
                      )}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="p-2">
              <a
                href="/signout"
                className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-2 py-2 text-sm font-medium rounded-md"
              >
                <LockOpenIcon className="text-gray-400 group-hover:text-gray-500 mr-3 flex-shrink-0 h-6 w-6" />
                Sign Out
              </a>
            </div>
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <Link
                href="/profile"
                className="flex-shrink-0 w-full group block"
                onClick={() => setSidebarOpen(false)}
              >
                <div className="flex items-center">
                  <Avatar src={user?.profileUrl} />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                      {(user?.displayName || user?.name) ?? 'Loading...'}
                    </p>
                    <p className="text-xs font-medium text-gray-500 group-hover:text-gray-700">
                      View profile
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
      <div className="relative w-full h-full md:overflow-y-auto">
        <div className="md:hidden w-full bg-white pl-1 pt-1 sm:pl-3 sm:pt-3 shadow fixed top-0 z-10">
          <button
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <MenuIcon className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
        <main className="relative h-full pt-16 md:pt-6 max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          {children}
        </main>
      </div>
    </CommonLayout>
  );
}
