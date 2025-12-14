import React from 'react';
import { Market, CHAIN_IDS } from '@/lib/morpho';
import clsx from 'clsx';
import { ExternalLink } from 'lucide-react';

interface MarketRowProps {
    market: Market;
    isBestRate?: boolean;
}

export function MarketRow({ market, isBestRate }: MarketRowProps) {
    const { loanAsset, collateralAsset, state, morphoBlue } = market;

    const formatPercent = (val: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'percent',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(val);
    };

    const formatMoney = (val: number) => {
        if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
        if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
        if (val >= 1e3) return `$${(val / 1e3).toFixed(0)}K`;
        return `$${val.toFixed(2)}`;
    };

    const chainName = CHAIN_IDS[morphoBlue.chain.id] || `${morphoBlue.chain.id}`;

    const val = parseFloat(state.supplyAssets);
    const liquidityRaw = isNaN(val) ? 0 : val / (10 ** loanAsset.decimals);

    // Calc Net APY
    const rewardsApr = state.rewards?.reduce((acc, r) => acc + r.borrowApr, 0) || 0;
    const netApy = state.borrowApy - rewardsApr;

    return (
        <div className={clsx(
            "flex flex-col gap-3 p-4 border border-zinc-800 rounded-xl bg-zinc-900/50 mb-3",
            isBestRate ? "ring-1 ring-emerald-500/50 bg-emerald-950/10" : ""
        )}>
            {/* Header: Pair & Chain */}
            <div className="flex justify-between items-start">
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-white">{loanAsset.symbol}</span>
                        <span className="text-sm text-zinc-500">/</span>
                        <span className="text-base text-zinc-400">{collateralAsset?.symbol || 'N/A'}</span>
                    </div>
                    {isBestRate && (
                        <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-1">
                            Best Rate
                        </span>
                    )}
                </div>
                <span className="px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-[10px] font-medium text-zinc-400 uppercase tracking-wide">
                    {chainName}
                </span>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-4 mt-1">
                {/* Liquidity */}
                <div className="flex flex-col">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Liquidity</span>
                    <span className="text-sm font-mono text-zinc-300">{formatMoney(liquidityRaw)}</span>
                </div>

                {/* APY (Right Aligned) */}
                <div className="flex flex-col items-end">
                    <span className="text-[10px] text-emerald-500/80 uppercase font-bold tracking-wider">Net APY</span>
                    <span className="text-xl font-bold font-mono text-emerald-400">{formatPercent(netApy)}</span>
                    {rewardsApr > 0 && <span className="text-[9px] text-emerald-600">(Incentivized)</span>}
                </div>
            </div>

            {/* Utilization Bar */}
            <div className="flex flex-col gap-1.5 pt-2 border-t border-zinc-800/50">
                <div className="flex justify-between text-[10px]">
                    <span className="text-zinc-500 font-medium">Utilization</span>
                    <span className={clsx("font-mono", state.utilization > 0.9 ? "text-red-400" : "text-zinc-400")}>
                        {formatPercent(state.utilization)}
                    </span>
                </div>
                <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <div
                        className={clsx(
                            "h-full rounded-full",
                            state.utilization > 0.9 ? "bg-red-500" : state.utilization > 0.75 ? "bg-amber-500" : "bg-emerald-500"
                        )}
                        style={{ width: `${Math.min(state.utilization * 100, 100)}%` }}
                    />
                </div>
            </div>
        </div>
    );
}
