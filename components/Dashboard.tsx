'use client';

import React, { useState, useMemo } from 'react';
import { Market, CHAIN_IDS } from '@/lib/morpho';
import { Search, RotateCcw, LayoutGrid, List } from 'lucide-react'; // LayoutGrid could be icon for Overview
import clsx from 'clsx';
// import { MarketRow } from './MarketRow';
import { MarketTable } from './MarketTable';
import { MarketOverview } from './MarketOverview';

interface DashboardProps {
    initialMarkets: Market[];
}

export function Dashboard({ initialMarkets }: DashboardProps) {
    const [markets, setMarkets] = useState<Market[]>(initialMarkets);
    const [borrowAsset, setBorrowAsset] = useState<'USDC' | 'USDT' | 'ANY'>('ANY');
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Tabs state
    const [activeTab, setActiveTab] = useState<'RATES' | 'STATUS'>('RATES');

    // Collateral Families
    const COLLATERAL_FAMILIES = useMemo(() => ({
        BTC: ['BTC', 'CBTC', 'WBTC', 'CBBTC', 'TACBTC'],
        ETH: ['ETH', 'WETH'],
    }), []);

    const [collateralFamily, setCollateralFamily] = useState<'ALL' | 'BTC' | 'ETH'>('ALL');
    const [searchQuery, setSearchQuery] = useState('');

    // Filter & Sort logic (Only relevant for RATES tab)
    const filteredMarkets = useMemo(() => {
        let result = markets;
        result = result.filter(m => m.collateralAsset && m.collateralAsset.symbol !== 'N/A');

        if (borrowAsset === 'ANY') {
            result = result.filter(m => {
                const s = m.loanAsset.symbol.toUpperCase();
                return s.includes('USDC') || s.includes('USDT') || s === 'USDBC';
            });
        } else {
            result = result.filter(m => m.loanAsset.symbol.includes(borrowAsset));
        }

        result = result.filter(m => {
            if (!m.state) return false;
            const supply = Number(m.state.supplyAssets) / Math.pow(10, m.loanAsset.decimals);
            const borrow = Number(m.state.borrowAssets) / Math.pow(10, m.loanAsset.decimals);
            const liquidity = supply - borrow;
            return liquidity > 200000;
        });

        if (collateralFamily !== 'ALL') {
            const familySymbols = COLLATERAL_FAMILIES[collateralFamily];
            result = result.filter(m => {
                const collateral = m.collateralAsset;
                if (!collateral) return false;
                const symbolUpper = collateral.symbol.toUpperCase();
                if (collateralFamily === 'ETH') {
                    const EXCLUDED_PREFIXES = ['PT-', 'GM:', 'GLV'];
                    if (EXCLUDED_PREFIXES.some(prefix => symbolUpper.startsWith(prefix))) return false;
                }
                return familySymbols.some(fam => symbolUpper === fam || symbolUpper.includes(fam));
            });
        }

        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            result = result.filter(m =>
                m.loanAsset.symbol.toLowerCase().includes(lowerQuery) ||
                m.collateralAsset?.symbol?.toLowerCase().includes(lowerQuery)
            );
        }

        const getNetApy = (m: Market) => {
            const rewardsApr = m.state.rewards?.reduce((acc, r) => acc + r.borrowApr, 0) || 0;
            return m.state.borrowApy - rewardsApr;
        };

        return result.sort((a, b) => getNetApy(a) - getNetApy(b));
    }, [markets, borrowAsset, collateralFamily, searchQuery, COLLATERAL_FAMILIES]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            const res = await fetch('/api/metrics');
            const data = await res.json();
            if (data.markets) {
                setMarkets(data.markets);
            }
        } catch (err) {
            console.error('Failed to refresh', err);
        } finally {
            setIsRefreshing(false);
        }
    };

    return (
        <div className="w-full max-w-[1400px] mx-auto p-6 space-y-6">

            {/* Header / Title Area */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-8 border-b border-zinc-800 pb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Morpho Dashboard</h1>
                    <p className="text-zinc-400 text-sm">Real-time borrowing rates and market intelligence.</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4">
                    {/* Tab Switcher */}
                    <div className="flex bg-zinc-900/50 p-1 rounded-lg border border-zinc-800">
                        <button
                            onClick={() => setActiveTab('RATES')}
                            className={clsx(
                                "flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold transition-all",
                                activeTab === 'RATES' ? "bg-zinc-100 text-black" : "text-zinc-500 hover:text-white"
                            )}
                        >
                            <List className="h-4 w-4" /> RATES
                        </button>
                        <button
                            onClick={() => setActiveTab('STATUS')}
                            className={clsx(
                                "flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold transition-all",
                                activeTab === 'STATUS' ? "bg-zinc-100 text-black" : "text-zinc-500 hover:text-white"
                            )}
                        >
                            <LayoutGrid className="h-4 w-4" /> OVERVIEW
                        </button>
                    </div>

                    <button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white rounded-md text-xs font-medium transition-all disabled:opacity-50"
                    >
                        <RotateCcw className={clsx("h-3.5 w-3.5", isRefreshing && "animate-spin")} />
                        REFRESH
                    </button>
                </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'RATES' ? (
                <div className="space-y-6 animate-in fade-in duration-300">

                    {/* Global Search Bar */}
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-zinc-500" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search by asset name (e.g. WBTC, USDC)..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full pl-10 pr-3 py-4 border border-zinc-800 rounded-lg leading-5 bg-zinc-900/50 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:bg-zinc-900 focus:ring-1 focus:ring-zinc-600 focus:border-zinc-600 sm:text-sm transition-all"
                        />
                    </div>

                    {/* Filters Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Step 1: Collateral */}
                        <div className="flex flex-col gap-3">
                            <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-zinc-800 text-zinc-300 text-[10px]">1</span>
                                I have collateral
                            </h2>
                            <div className="flex bg-zinc-900/50 p-1.5 rounded-lg border border-zinc-800">
                                {(['ALL', 'BTC', 'ETH'] as const).map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setCollateralFamily(type)}
                                        className={clsx(
                                            "flex-1 py-3 px-4 rounded-md text-sm font-bold transition-all",
                                            collateralFamily === type
                                                ? "bg-zinc-100 text-black shadow-lg shadow-white/10"
                                                : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800"
                                        )}
                                    >
                                        {type === 'ALL' ? 'Any Asset' : `${type} Family`}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Step 2: Borrow */}
                        <div className="flex flex-col gap-3">
                            <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-zinc-800 text-zinc-300 text-[10px]">2</span>
                                I want to borrow
                            </h2>
                            <div className="flex bg-zinc-900/50 p-1.5 rounded-lg border border-zinc-800">
                                {(['ANY', 'USDC', 'USDT'] as const).map((asset) => (
                                    <button
                                        key={asset}
                                        onClick={() => setBorrowAsset(asset)}
                                        className={clsx(
                                            "flex-1 py-3 px-4 rounded-md text-sm font-bold transition-all",
                                            borrowAsset === asset
                                                ? "bg-zinc-100 text-black shadow-lg shadow-white/10"
                                                : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800"
                                        )}
                                    >
                                        {asset === 'ANY' ? 'Any (Best Rate)' : asset}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Markets List (Using MarketTable) */}
                    <div className="space-y-0.5">
                        {filteredMarkets.length === 0 ? (
                            <div className="h-32 flex flex-col items-center justify-center text-zinc-500 border border-zinc-800 rounded-lg bg-zinc-900/20">
                                <Search className="h-6 w-6 opacity-20 mb-2" />
                                <p>No active markets found.</p>
                            </div>
                        ) : (
                            <MarketTable markets={filteredMarkets} />
                        )}
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-zinc-600 font-mono">
                        <span>Showing {filteredMarkets.length} markets</span>
                        <span>Data via Morpho Blue API</span>
                    </div>

                </div>
            ) : (
                <MarketOverview />
            )}

        </div>
    );
}
