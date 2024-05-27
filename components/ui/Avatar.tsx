import cn from 'classnames';

// const AVATAR_SIZES = [{key: 'sm', size: 32 }, { key: 'base', size: 40 } , {key: 'lg', size: 48}] as const;
const AVATAR_SIZES = ['sm', 'base', 'lg'] as const;

interface AvatarProps {
  className?: string;
  src?: string | null;
  size?: (typeof AVATAR_SIZES)[number];
  nickname?: string;
}

export default function Avatar({ className, src, size = 'base', nickname }: AvatarProps) {
  const useDefaultAvatar = !src && !nickname;

  return (
    <span
      className={cn(
        className,
        'relative block overflow-hidden rounded-full bg-gray-100 border border-gray-300/30',
        {
          'w-8 h-8': size === 'sm',
          'w-10 h-10': size === 'base',
          'w-12 h-12': size === 'lg',
        },
      )}
    >
      <img
        className="object-cover"
        src={
          useDefaultAvatar
            ? '/assets/avatar.png'
            : src ?? `https://ui-avatars.com/api/?name=${nickname?.split(' ').join('+')}`
        }
        alt={nickname}
      />
    </span>
  );
}
