import dynamic from 'next/dynamic';

export default dynamic(() => import('@pages/game/enter'), {
  loading: () => null,
  ssr: false,
});
