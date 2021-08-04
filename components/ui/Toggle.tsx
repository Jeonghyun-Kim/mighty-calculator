import cn from 'classnames';
import { Switch } from '@headlessui/react';

interface ToggleProps {
  className?: string;
  enabled: boolean;
  size?: 'sm' | 'md';
  setEnabled: (enabled: boolean) => void;
  screenReaderLabel?: string;
}

export default function Toggle({
  className,
  enabled,
  size = 'md',
  setEnabled,
  screenReaderLabel,
}: ToggleProps) {
  return (
    <Switch
      checked={enabled}
      onChange={setEnabled}
      className={cn(
        className,
        enabled ? 'bg-teal-600' : 'bg-gray-200',
        'relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500',
      )}
    >
      <span className="sr-only">{screenReaderLabel ?? 'toggle switch'}</span>
      <span
        aria-hidden="true"
        className={cn(
          enabled ? 'translate-x-5' : 'translate-x-0',
          'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200',
        )}
      />
    </Switch>
  );
}
