import cn from 'classnames';

import { useUI } from '@components/context';
import { Modal, Notification } from '@components/ui';

export default function CommonLayout({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { modalFlag, modalContent, notiFlag, closeModal, closeNoti, notiContent } = useUI();

  return (
    <div className="relative h-full w-full">
      <main className={cn(className, 'relative h-full')}>{children}</main>

      <Modal show={modalFlag} close={closeModal} {...modalContent} />
      <Notification show={notiFlag} close={closeNoti} {...notiContent} />
    </div>
  );
}
