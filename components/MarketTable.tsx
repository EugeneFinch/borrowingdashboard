import React from 'react';
import { Market, CHAIN_IDS } from '@/lib/morpho';
import clsx from 'clsx';


// Helper formatters
const formatMoney = (val: number) => {
    if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
    if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
    if (val >= 1e3) return `$${(val / 1e3).toFixed(0)}K`;
    return `$${val.toFixed(2)}`;
};

const formatPercent = (val: number) => `${(val * 100).toFixed(2)}%`;

interface MarketTableProps {
    markets: Market[];
}

export function MarketTable({ markets }: MarketTableProps) {
    return (
        <div className="w-full overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)]">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white/[0.02]">
                            <th className="pro-table-header pl-6 py-4 w-[25%]">Market Pair</th>
                            <th className="pro-table-header px-4 py-4 w-[15%]">Chain</th>
                            <th className="pro-table-header px-4 py-4 w-[20%] text-right">Liquidity (Total Supply)</th>
                            <th className="pro-table-header px-4 py-4 w-[25%]">Utilization</th>
                            <th className="pro-table-header pr-6 py-4 w-[15%] text-right">Borrow APY</th>
                        </tr>
                    </thead>
                    <tbody>
                        {markets.map((market) => {
                            const { loanAsset, collateralAsset, state, morphoBlue, uniqueKey } = market;
                            const chainName = CHAIN_IDS[morphoBlue.chain.id] || `#${morphoBlue.chain.id}`;

                            // Parse BigInt-like strings for assets (assuming 18 decimals roughly or using decimals field)
                            // Note: Raw values from API might be in wei. I need to check decimals.
                            // Assuming for now simple division if I can't confirm.
                            // Actually, I should use loanAsset.decimals.
                            // The API usually returns raw integer strings.
                            const val = parseFloat(state.supplyAssets);
                            const liquidityRaw = isNaN(val) ? 0 : val / (10 ** loanAsset.decimals);

                            return (
                                <tr key={uniqueKey} className="group pro-table-row">
                                    {/* Market Pair */}
                                    <td className="pl-6 py-4">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-white text-base">{loanAsset.symbol}</span>
                                                <span className="text-xs text-gray-500">/</span>
                                                <span className="text-sm text-gray-400">{collateralAsset?.symbol || 'N/A'}</span>
                                            </div>
                                            <span className="text-[10px] text-gray-600 font-mono mt-0.5">{uniqueKey.slice(0, 6)}...{uniqueKey.slice(-4)}</span>
                                        </div>
                                    </td>

                                    {/* Chain */}
                                    <td className="px-4 py-4">
                                        <span className="inline-flex items-center px-2 py-1 rounded bg-white/5 border border-white/5 text-[10px] font-medium text-gray-400 uppercase tracking-wide">
                                            {chainName}
                                        </span>
                                    </td>

                                    {/* Liquidity */}
                                    <td className="px-4 py-4 text-right font-mono text-sm text-gray-300">
                                        {formatMoney(liquidityRaw)}
                                    </td>

                                    {/* Utilization */}
                                    <td className="px-4 py-4">
                                        <div className="flex flex-col gap-1.5 w-full max-w-[140px]">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-gray-500">Util.</span>
                                                <span className={clsx(
                                                    "font-mono",
                                                    state.utilization > 0.9 ? "text-red-400" : "text-white"
                                                )}>
                                                    {formatPercent(state.utilization)}
                                                </span>
                                            </div>
                                            <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                                                <div
                                                    className={clsx(
                                                        "h-full rounded-full transition-all duration-500",
                                                        state.utilization > 0.9 ? "bg-red-500" :
                                                            state.utilization > 0.75 ? "bg-amber-500" : "bg-emerald-500"
                                                    )}
                                                    style={{ width: `${Math.min(state.utilization * 100, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </td>

                                    {/* Borrow APY */}
                                    <td className="pr-6 py-4 text-right">
                                        <div className="flex flex-col items-end">
                                            {(() => {
                                                const rewardsApr = state.rewards?.reduce((acc, r) => acc + r.borrowApr, 0) || 0;
                                                const netApy = state.borrowApy - rewardsApr;
                                                return (
                                                    <>
                                                        <span className="text-base font-bold text-emerald-400 font-mono tracking-tight">
                                                            {formatPercent(netApy)}
                                                        </span>
                                                        {rewardsApr > 0 && (
                                                            <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                                                Inc. Rewards
                                                            </span>
                                                        )}
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
