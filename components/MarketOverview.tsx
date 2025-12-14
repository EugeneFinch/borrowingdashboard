'use client';

import React, { useEffect, useState } from 'react';
import { RefreshCw, TrendingUp, Clock, AlertCircle, Activity } from 'lucide-react';
import clsx from 'clsx';

interface MarketData {
    isOpen: boolean;
    ibitPrice: number | null;
    ibitChange: number | null;
    ibitNav: number | null;
    coinbaseBtcPrice: number | null;
    crypto: any[];
}

export function MarketOverview() {
    const [data, setData] = useState<MarketData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        // Don't set loading to true on refresh to avoid flickering
        if (!data) setLoading(true);
        try {
            const res = await fetch('/api/market-status');
            const json = await res.json();
            setData(json);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000); // 30s refresh for prices
        return () => clearInterval(interval);
    }, []);

    if (loading && !data) {
        return <div className="p-12 text-center text-zinc-500 animate-pulse">Loading market data...</div>;
    }

    if (!data) return <div className="p-12 text-center text-zinc-500">Failed to load data</div>;

    // Filter out BTC first
    const nonBtc = data.crypto ? data.crypto.filter((c: any) => c.symbol.toLowerCase() !== 'btc') : [];

    // Top 3 (excluding BTC, taking top 3 from standard list)
    // We usually want ETH, BNB, SOL (or USDT/USDC if we strictly follow market cap, but user likely wants "crypto" not stables)
    // Let's filter stables for the "Top 3" cards to make them interesting
    const STABLES = ['usdt', 'usdc', 'dai', 'fdusd', 'tusd', 'usde'];
    const volativeCrypto = nonBtc.filter((c: any) => !STABLES.includes(c.symbol.toLowerCase()));

    const top3 = volativeCrypto.slice(0, 3);
    const alts = volativeCrypto.slice(3, 11);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Status & ETF Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Trading Status */}
                <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-xl flex flex-col justify-between h-32">
                    <div className="flex items-center justify-between text-zinc-400 mb-2">
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-widest">Market Status</span>
                        </div>
                        <span className="text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-500">NYSE</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className={clsx("w-3 h-3 rounded-full animate-pulse", data.isOpen ? "bg-emerald-500" : "bg-red-500")} />
                        <span className={clsx("text-2xl font-bold tracking-tight", data.isOpen ? "text-emerald-400" : "text-zinc-500")}>
                            {data.isOpen ? "OPEN" : "CLOSED"}
                        </span>
                    </div>
                </div>

                {/* 2. IBIT ETF */}
                <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-xl flex flex-col justify-between h-32">
                    <div className="flex items-center justify-between text-zinc-400 mb-2">
                        <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-widest">BlackRock IBIT</span>
                        </div>
                        <span className="text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-500">ETF</span>
                    </div>
                    <div className="flex justify-between items-end">
                        <div className="flex flex-col">
                            <span className="text-3xl font-mono text-zinc-100 font-medium">
                                {data.ibitPrice ? `$${data.ibitPrice.toFixed(2)}` : "N/A"}
                            </span>
                            {data.ibitChange !== null && (
                                <span className={clsx("text-xs font-medium mt-1", data.ibitChange >= 0 ? "text-emerald-400" : "text-red-400")}>
                                    {data.ibitChange > 0 ? '+' : ''}{data.ibitChange.toFixed(2)} Today
                                </span>
                            )}
                        </div>
                        {data.ibitNav && (
                            <div className="flex flex-col items-end">
                                <span className="text-xs text-zinc-500 uppercase font-bold tracking-wider">NAV</span>
                                <span className="text-lg font-mono text-zinc-300">
                                    ${data.ibitNav.toFixed(2)}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* 3. Coinbase Futures */}
                <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-xl flex flex-col justify-between h-32">
                    <div className="flex items-center justify-between text-zinc-400 mb-2">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-widest">Coinbase Futures</span>
                        </div>
                        <span className="text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-500">BTC-PERP</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-3xl font-mono text-zinc-100 font-medium">
                            {data.coinbaseBtcPrice ? `$${data.coinbaseBtcPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "N/A"}
                        </span>
                        <span className="text-[10px] text-zinc-600 mt-1">
                            International Exchange
                        </span>
                    </div>
                </div>
            </div>

            {/* Top 3 Crypto */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {top3.map((coin: any) => (
                    <div key={coin.id} className="bg-zinc-950 border border-zinc-800 p-6 rounded-xl relative overflow-hidden group hover:border-zinc-600 transition-colors">
                        {/* No Logos requested */}
                        <div className="relative z-10">
                            <h3 className="text-zinc-500 font-bold text-xs uppercase tracking-widest mb-2">{coin.name}</h3>
                            <div className="text-3xl font-medium text-white font-mono mb-2">
                                ${coin.current_price.toLocaleString()}
                            </div>
                            <div className={clsx("text-sm font-medium", coin.price_change_percentage_24h >= 0 ? "text-emerald-400" : "text-red-400")}>
                                {coin.price_change_percentage_24h > 0 ? '+' : ''}{coin.price_change_percentage_24h.toFixed(2)}%
                            </div>
                        </div>
                    </div>
                ))}
            </div>



        </div>
    );
}
