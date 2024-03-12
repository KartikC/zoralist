import { useEffect } from 'react';
import { useRouter } from 'next/router';

const Home = () => {
  const router = useRouter();

  useEffect(() => {
    router.replace('/0x72d07beebb80f084329da88063f5e52f70f020a3/1');
  }, [router]);

  return null; // or a loading spinner, or anything you want to show briefly before redirect
};

export default Home;
