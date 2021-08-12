import { ReactNode } from 'react';
import cn from 'classnames';

interface TitleProps {
  className?: string;
  children?: ReactNode;
}

export default function Title({ className, children }: TitleProps) {
  return <h2 className={cn(className, 'text-2xl font-medium')}>{children}</h2>;
}
