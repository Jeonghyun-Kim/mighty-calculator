import cn from 'classnames';
import { ReactNode } from 'react';

interface TitleProps {
  className?: string;
  children?: ReactNode;
}

export default function Title({ className, children }: TitleProps) {
  return <h2 className={cn(className, 'text-2xl font-medium')}>{children}</h2>;
}
