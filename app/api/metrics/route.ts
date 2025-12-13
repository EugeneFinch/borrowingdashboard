import { fetchMarkets } from '@/lib/morpho';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // Ensure no caching for this route

export async function GET() {
    try {
        const markets = await fetchMarkets();
        return NextResponse.json({
            timestamp: new Date().toISOString(),
            count: markets.length,
            markets,
        });
    } catch (error) {
        console.error('Failed to fetch markets:', error);
        return NextResponse.json({ error: 'Failed to fetch markets' }, { status: 500 });
    }
}
