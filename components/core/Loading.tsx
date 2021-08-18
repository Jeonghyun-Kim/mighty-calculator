import Lottie from 'lottie-react';
import loadingAnimation from '../../lottie/loading.json';

export default function Loading() {
  return (
    <div className="w-full h-screen flex justify-center items-center text-center">
      <Lottie animationData={loadingAnimation} className="w-80 h-80" />
    </div>
  );
}
