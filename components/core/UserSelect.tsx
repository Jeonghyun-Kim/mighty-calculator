import cn from 'classnames';

import { Avatar } from '@components/ui';

import { UserInfo } from 'types/user';

interface UserSelectProps {
  className?: string;
  user: UserInfo;
  selected: boolean;
  onSelect: () => void | Promise<void>;
}

export default function UserSelect({ className, user, selected, onSelect }: UserSelectProps) {
  return (
    <button
      className={cn(
        className,
        'relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 text-left hover:opacity-80',
        {
          'ring-2 ring-offset-2 ring-teal-300': selected,
        },
      )}
      onClick={onSelect}
    >
      <div className="flex-shrink-0">
        <Avatar src={user.profileUrl} size="base" />
      </div>
      <div className="flex-1 min-w-0">
        {/* <span className="absolute inset-0" aria-hidden="true" /> */}
        <p className="text-sm font-medium text-gray-900">{user.displayName}</p>
        <p className="text-sm text-gray-500 truncate">{user.name}</p>
      </div>
    </button>
  );
}
