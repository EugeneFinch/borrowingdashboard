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

    const chainName = CHAIN_IDS[morphoBlue.chain.id] || `${morphoBlue.chain.id}`;

    // Ethena/Pro style utilization bar
    const utilWidth = Math.min(state.utilization * 100, 100);
    const utilColor = state.utilization > 0.9 ? 'bg-red-500' : state.utilization > 0.75 ? 'bg-yellow-500' : 'bg-emerald-500';

    // Calculate Net APY
    const rewardsApr = state.rewards?.reduce((acc, r) => acc + r.borrowApr, 0) || 0;
    const netApy = state.borrowApy - rewardsApr;

    return (
        <div className={clsx(
            "grid grid-cols-12 gap-4 items-center p-4 border-b border-[#27272a] hover:bg-[#18181b] transition-colors group text-sm",
            isBestRate ? "bg-[#18181b]/50" : ""
        )}>

            {/* ASSET (Col 1-3) */}
            <div className="col-span-3 flex items-center gap-3">
                {/* Placeholder for Token Icon if we had one */}
                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-400">
                    {loanAsset.symbol[0]}
                </div>
                <div className="flex flex-col">
                    <span className="font-bold text-white">{loanAsset.symbol}</span>
                    <span className="text-xs text-zinc-500">Borrow</span>
                </div>
            </div>

            {/* COLLATERAL (Col 4-6) */}
            <div className="col-span-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-400">
                    {collateralAsset?.symbol?.[0] || '-'}
                </div>
                <div className="flex flex-col">
                    <span className="font-medium text-zinc-300">{collateralAsset?.symbol || 'N/A'}</span>
                    <span className="text-xs text-zinc-500">Collateral</span>
                </div>
            </div>

            {/* CHAIN (Col 7-8) */}
            <div className="col-span-2 flex items-center">
                <span className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 uppercase tracking-wider font-medium">
                    {chainName}
                </span>
            </div>

            {/* UTILIZATION (Col 9-10) */}
            <div className="col-span-2 flex flex-col gap-1.5 pr-4">
                <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-500">
                        {formatPercent(state.utilization)}
                    </span>
                </div>
                <div className="h-1.5 w-full bg-zinc-800 rounded-sm overflow-hidden">
                    <div
                        className={clsx("h-full rounded-sm", utilColor)}
                        style={{ width: `${utilWidth}%` }}
                    />
                </div>
            </div>

            {/* APY (Col 11-12) */}
            <div className="col-span-2 flex justify-end items-center gap-2">
                <div className="flex flex-col items-end">
                    <span className={clsx(
                        "text-lg font-mono-numbers font-bold",
                        isBestRate ? "text-emerald-400" : "text-white"
                    )}>
                        {formatPercent(netApy)}
                    </span>
                    {rewardsApr > 0 && (
                        <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">
                            Inc. Rewards
                        </span>
                    )}
                    {isBestRate && !rewardsApr && (
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                            Best Rate
                        </span>
                    )}
                </div>
                {/* <ExternalLink className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" /> */}
            </div>

        </div>
    );
}
