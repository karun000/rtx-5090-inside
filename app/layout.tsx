import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'RTX 5090 — Inside',
  description: 'Explore the RTX 5090 Founders Edition from the inside out.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
