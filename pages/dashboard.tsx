import Loading from '@components/core/Loading';
import { useSession } from '@lib/hooks/use-session';

export default function IndexPage() {
  const { user } = useSession({ redirectTo: '/signin' });

  if (!user) return <Loading />;

  return (
    <div className="max-w-screen-lg mx-auto py-8">
      <h1>Dashboard Page</h1>
      <p>signin as {user.name}</p>
    </div>
  );
}
