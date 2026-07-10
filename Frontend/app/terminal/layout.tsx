import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Live Terminal — PENN',
  description: 'Algorithmic live trading terminal',
};

export default function TerminalLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
