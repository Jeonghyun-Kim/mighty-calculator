import dynamic from 'next/dynamic';
// import Lottie from 'lottie-react';
import loadingAnimation from '../../lottie/rocket.json';
// const loadingAnimation = dynamic(() => import('../../lottie/rocket.json') as any, { ssr: false });
const Lottie = dynamic(() => import('lottie-react') as never, {
  loading: ({}) => (<p>loading...</p>) as never,
}) as any;

export default function Loading() {
  return (
    <div className="absolute inset-0 w-full h-full flex justify-center items-center text-center">
      <Lottie animationData={loadingAnimation} className="w-80 h-80" />
    </div>
  );
}
