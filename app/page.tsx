import dynamic from 'next/dynamic';

const GpuExperience = dynamic(() => import('../components/GpuExperience'), {
  ssr: false,
  loading: () => <div className="loading-state">Loading the silicon…</div>,
});

export default function Page() {
  return <GpuExperience />;
}
