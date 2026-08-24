import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'URBANPULSE — Urban Infrastructure Cascade Simulator',
  description:
    'AI-powered real-world urban infrastructure cascade simulator modeling dependency graphs, failure propagation, systemic bottlenecks, and optimized emergency response sequences.',
  openGraph: {
    title: 'URBANPULSE — Urban Infrastructure Cascade Simulator',
    description:
      'Real-World Urban Infrastructure Cascade Simulator with Multi-Hop Dependency Modeling & AI Response Optimization',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'URBANPULSE — Urban Infrastructure Cascade Simulator',
    description:
      'Real-World Urban Infrastructure Cascade Simulator with Multi-Hop Dependency Modeling & AI Response Optimization',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body suppressHydrationWarning className="bg-[#0F1012] text-white antialiased min-h-screen selection:bg-white selection:text-black">
        {children}
      </body>
    </html>
  );
}
