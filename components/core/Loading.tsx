import Lottie from 'lottie-react';
import loadingAnimation from '../../lottie/rocket.json';

export default function Loading() {
  return (
    <div className="absolute inset-0 w-full h-full flex justify-center items-center text-center">
      <Lottie animationData={loadingAnimation} className="w-80 h-80" />
    </div>
  );
}
