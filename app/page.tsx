import { Dashboard } from '@/components/Dashboard';
import { fetchMarkets } from '@/lib/morpho';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const markets = await fetchMarkets();

  return (
    <main className="min-h-screen bg-black">
      {/* Navbar / Top Bar */}
      <nav className="border-b border-zinc-900 bg-black/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <span className="text-black font-bold text-lg">M</span>
            </div>
            <span className="font-bold text-white text-lg tracking-tight">Morpho<span className="text-zinc-600">Monitor</span></span>
          </div>
          <div className="text-xs text-zinc-500 font-mono">
            V1.0.0
          </div>
        </div>
      </nav>

      <Dashboard initialMarkets={markets} />
    </main>
  );
}
