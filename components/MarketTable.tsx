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
        <div className="w-full overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-zinc-800/50 text-xs font-bold text-zinc-500 uppercase tracking-widest">
                            <th className="pl-6 py-4 w-[30%]">Market Pair</th>
                            <th className="px-4 py-4 w-[20%]">Chain</th>
                            <th className="px-4 py-4 w-[30%]">Liquidity / Util.</th>
                            <th className="pr-6 py-4 w-[20%] text-right">Net APY</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                        {markets.map((market) => {
                            const { loanAsset, collateralAsset, state, morphoBlue, uniqueKey } = market;
                            const chainName = CHAIN_IDS[morphoBlue.chain.id] || `#${morphoBlue.chain.id}`;

                            const val = parseFloat(state.supplyAssets);
                            const liquidityRaw = isNaN(val) ? 0 : val / (10 ** loanAsset.decimals);

                            // Net APY Calculation
                            const rewardsApr = state.rewards?.reduce((acc, r) => acc + r.borrowApr, 0) || 0;
                            const netApy = state.borrowApy - rewardsApr;

                            return (
                                <tr key={uniqueKey} className="group hover:bg-zinc-800/30 transition-colors">
                                    {/* Market Pair */}
                                    <td className="pl-6 py-3">
                                        <div className="flex flex-col">
                                            <div className="flex items-baseline gap-1.5">
                                                <span className="font-bold text-white text-sm">{loanAsset.symbol}</span>
                                                <span className="text-xs text-zinc-500">/</span>
                                                <span className="text-xs text-zinc-400">{collateralAsset?.symbol || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Chain */}
                                    <td className="px-4 py-3">
                                        <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded">
                                            {chainName}
                                        </span>
                                    </td>

                                    {/* Liquidity / Utilization */}
                                    <td className="px-4 py-3">
                                        <div className="flex items-baseline gap-1 text-sm font-mono">
                                            <span className="text-zinc-300">{formatMoney(liquidityRaw)}</span>
                                            <span className="text-zinc-600">/</span>
                                            <span className={clsx(
                                                state.utilization > 0.9 ? "text-red-400" : "text-zinc-400"
                                            )}>
                                                {formatPercent(state.utilization)}
                                            </span>
                                        </div>
                                    </td>

                                    {/* Net APY */}
                                    <td className="pr-6 py-3 text-right">
                                        <div className="flex flex-col items-end">
                                            <span className="text-sm font-bold text-emerald-400 font-mono tracking-tight">
                                                {formatPercent(netApy)}
                                            </span>
                                            {rewardsApr > 0 && (
                                                <span className="text-[8px] font-medium text-emerald-500/70 uppercase tracking-wider">
                                                    (Incentivized)
                                                </span>
                                            )}
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
