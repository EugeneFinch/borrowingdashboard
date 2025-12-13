'use client';

import React, { useState, useMemo } from 'react';
import { Market, CHAIN_IDS } from '@/lib/morpho';
import { Search, RotateCcw } from 'lucide-react';
import clsx from 'clsx';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

interface DashboardProps {
    initialMarkets: Market[];
}

export function Dashboard({ initialMarkets }: DashboardProps) {
    const [markets, setMarkets] = useState<Market[]>(initialMarkets);
    const [borrowAsset, setBorrowAsset] = useState<'USDC' | 'USDT' | 'ANY'>('ANY');
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Collateral Families
    const COLLATERAL_FAMILIES = useMemo(() => ({
        BTC: ['BTC', 'CBTC', 'WBTC', 'CBBTC', 'TACBTC'], // Added common variations just in case, but strict checking below
        ETH: ['ETH', 'WETH'],
    }), []);

    const [collateralFamily, setCollateralFamily] = useState<'ALL' | 'BTC' | 'ETH'>('ALL');
    const [searchQuery, setSearchQuery] = useState('');

    // Filter & Sort logic
    const filteredMarkets = useMemo(() => {
        let result = markets;

        // RULE: Always filter out markets with missing/null collateral
        result = result.filter(m => m.collateralAsset && m.collateralAsset.symbol !== 'N/A');

        // RULE: Borrow Asset Filter
        // If ANY, allow both USDC and USDT. If specific, match exact.
        if (borrowAsset === 'ANY') {
            result = result.filter(m => m.loanAsset.symbol === 'USDC' || m.loanAsset.symbol === 'USDT');
        } else {
            result = result.filter(m => m.loanAsset.symbol === borrowAsset);
        }

        // RULE: Minimum Liquidity Filter (Filter out "junk" / empty markets)
        // Threshold: $200,000 (assuming 1 unit = $1 for USDC/USDT)
        result = result.filter(m => {
            if (!m.state) return false;
            const supply = Number(m.state.supplyAssets) / Math.pow(10, m.loanAsset.decimals);
            const borrow = Number(m.state.borrowAssets) / Math.pow(10, m.loanAsset.decimals);
            const liquidity = supply - borrow;
            // User requested > 200k to avoid low liquidity markets
            return liquidity > 200000;
        });

        // Filter by Collateral Family
        if (collateralFamily !== 'ALL') {
            const familySymbols = COLLATERAL_FAMILIES[collateralFamily];
            result = result.filter(m => {
                const collateral = m.collateralAsset;
                if (!collateral) return false;

                const symbolUpper = collateral.symbol.toUpperCase();

                // Clean up "ETH Family" by removing complex structured products
                // (Pendle PT tokens, GMX GM pools, GLV vaults, etc.)
                if (collateralFamily === 'ETH') {
                    const EXCLUDED_PREFIXES = ['PT-', 'GM:', 'GLV'];
                    if (EXCLUDED_PREFIXES.some(prefix => symbolUpper.startsWith(prefix))) {
                        return false;
                    }
                }

                // Check if the symbol is in our allowed list
                // We use .some with .includes to be slightly flexible (e.g. match 'wstETH', 'cbETH')
                return familySymbols.some(fam => symbolUpper === fam || symbolUpper.includes(fam));
            });
        }

        // Filter by Search Query
        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            result = result.filter(m =>
                m.loanAsset.symbol.toLowerCase().includes(lowerQuery) ||
                m.collateralAsset?.symbol?.toLowerCase().includes(lowerQuery)
            );
        }

        // Helper to calculate Net APY
        const getNetApy = (m: Market) => {
            const rewardsApr = m.state.rewards?.reduce((acc, r) => acc + r.borrowApr, 0) || 0;
            return m.state.borrowApy - rewardsApr;
        };

        // Sort by Lowest Net Borrow APY
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
                    <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Market Rates</h1>
                    <p className="text-zinc-400 text-sm">Real-time borrowing costs across Morpho Blue deployments.</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
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

            {/* Data Table */}
            <div className="border border-zinc-800 rounded-lg overflow-hidden bg-zinc-950 shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent border-zinc-800">
                            <TableHead className="w-[300px]">Borrow Asset</TableHead>
                            <TableHead className="w-[300px]">Collateral</TableHead>
                            <TableHead>Chain</TableHead>
                            <TableHead className="w-[200px]">Utilization</TableHead>
                            <TableHead className="text-right">Liquidity</TableHead>
                            <TableHead className="text-right">Net Borrow APY</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredMarkets.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-32 text-center text-zinc-500">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <Search className="h-6 w-6 opacity-20" />
                                        <p>No active markets found.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredMarkets.map((market, index) => {
                                const { loanAsset, collateralAsset, state, morphoBlue } = market;
                                const chainName = CHAIN_IDS[morphoBlue.chain.id] || `${morphoBlue.chain.id}`;
                                const utilWidth = Math.min(state.utilization * 100, 100);
                                const isBestRate = index === 0;

                                // Colors for Utilization
                                let utilColor = 'bg-emerald-500';
                                if (state.utilization > 0.9) utilColor = 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]';
                                else if (state.utilization > 0.75) utilColor = 'bg-amber-500';

                                // Calculate Net APY (Base - Rewards)
                                const rewardsApr = state.rewards?.reduce((acc, r) => acc + r.borrowApr, 0) || 0;
                                const netApy = state.borrowApy - rewardsApr;
                                const hasRewards = rewardsApr > 0;

                                return (
                                    <TableRow key={market.uniqueKey} className="group h-16">
                                        {/* Borrow Asset */}
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-400 group-hover:border-zinc-700 transition-colors">
                                                    {loanAsset.symbol[0]}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-base text-zinc-100">{loanAsset.symbol}</span>
                                                    {/* <span className="text-[10px] bg-zinc-900 text-zinc-500 px-1 rounded w-fit">Borrow</span> */}
                                                </div>
                                            </div>
                                        </TableCell>

                                        {/* Collateral Asset */}
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-400 group-hover:border-zinc-700 transition-colors">
                                                    {collateralAsset?.symbol?.[0] || '?'}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-zinc-300">{collateralAsset?.symbol}</span>
                                                </div>
                                            </div>
                                        </TableCell>

                                        {/* Chain */}
                                        <TableCell>
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-xs font-medium text-zinc-400">
                                                {chainName}
                                            </span>
                                        </TableCell>

                                        {/* Utilization */}
                                        <TableCell>
                                            <div className="flex flex-col gap-1.5 w-32">
                                                <div className="flex justify-between items-end">
                                                    <span className={clsx("text-xs font-mono font-medium", state.utilization > 0.9 ? "text-red-400" : "text-zinc-500")}>
                                                        {(state.utilization * 100).toFixed(2)}%
                                                    </span>
                                                </div>
                                                <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                                                    <div
                                                        className={clsx("h-full rounded-full transition-all duration-500", utilColor)}
                                                        style={{ width: `${utilWidth}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </TableCell>

                                        {/* Liquidity */}
                                        <TableCell className="text-right">
                                            <div className="flex flex-col items-end gap-0.5">
                                                <span className="text-sm font-mono font-medium text-zinc-300">
                                                    {(() => {
                                                        const supply = Number(state.supplyAssets) / Math.pow(10, loanAsset.decimals);
                                                        const borrow = Number(state.borrowAssets) / Math.pow(10, loanAsset.decimals);
                                                        const liquidity = supply - borrow;

                                                        return new Intl.NumberFormat('en-US', {
                                                            notation: "compact",
                                                            maximumFractionDigits: 1
                                                        }).format(liquidity);
                                                    })()} <span className="text-zinc-500 text-[10px]">{loanAsset.symbol}</span>
                                                </span>
                                            </div>
                                        </TableCell>

                                        {/* APY */}
                                        <TableCell className="text-right">
                                            <div
                                                className="flex flex-col items-end gap-0.5 cursor-help"
                                                title={hasRewards ? `Gross Borrow: ${(state.borrowApy * 100).toFixed(2)}%\nRewards: ${(rewardsApr * 100).toFixed(2)}%` : undefined}
                                            >
                                                <span className={clsx(
                                                    "text-lg font-mono-numbers font-bold tracking-tight",
                                                    isBestRate ? "text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]" : "text-zinc-100"
                                                )}>
                                                    {(netApy * 100).toFixed(2)}%
                                                </span>
                                                {hasRewards && (
                                                    <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                                        Inc. Rewards
                                                    </span>
                                                )}
                                                {isBestRate && !hasRewards && (
                                                    <span className="text-[9px] font-extrabold text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                                        Lowest Rate
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex justify-between items-center text-[10px] text-zinc-600 font-mono">
                <span>Showing {filteredMarkets.length} markets</span>
                <span>Data via Morpho Blue API</span>
            </div>

        </div>
    );
}
