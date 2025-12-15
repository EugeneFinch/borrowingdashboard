import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // Ensure no caching for real-time data

export async function GET() {
    try {
        // 1. Fetch Crypto Prices (CoinGecko)
        // We fetch top 50 to have enough alts
        const coinGeckoRes = await fetch(
            'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=false',
            { next: { revalidate: 60 } }
        );

        let cryptoData = [];
        if (coinGeckoRes.ok) {
            cryptoData = await coinGeckoRes.json();
        } else {
            console.error("CoinGecko Error:", coinGeckoRes.status);
        }

        // 2. Fetch IBIT Price (Nasdaq API)
        // Reliable source for ETF data
        let ibitPrice = null;
        let ibitChange = null;
        try {
            const nasdaqRes = await fetch('https://api.nasdaq.com/api/quote/IBIT/info?assetclass=etf', {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.0.0 Safari/537.36'
                },
                next: { revalidate: 60 }
            });
            if (nasdaqRes.ok) {
                const data = await nasdaqRes.json();
                // data.data.primaryData.lastSalePrice -> "$51.20"
                const priceStr = data.data?.primaryData?.lastSalePrice;
                if (priceStr) {
                    ibitPrice = parseFloat(priceStr.replace('$', '').replace(',', ''));
                }
                // data.data.primaryData.netChange -> "-0.90"
                const changeStr = data.data?.primaryData?.netChange;
                if (changeStr) {
                    ibitChange = parseFloat(changeStr);
                }
            }
        } catch (e) {
            console.error("Nasdaq Fetch Error:", e);
        }

        // 2a. Fetch IBIT NAV (BlackRock Scraping)
        // NAV drives futures arbitrage
        let ibitNav = null;
        let ibitNavDate = null;
        try {
            const brRes = await fetch('https://www.blackrock.com/us/individual/products/333011/ishares-bitcoin-trust', {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                },
                next: { revalidate: 300 } // NAV updates once a day, cache longer
            });
            if (brRes.ok) {
                const html = await brRes.text();
                // Pattern: NAV as of Dec 12, 2025 ... $51.13
                // Capture Date and Price
                const dateMatch = html.match(/NAV as of\s+([A-Za-z]{3}\s+\d{1,2},\s+\d{4})/i);
                if (dateMatch && dateMatch[1]) {
                    ibitNavDate = dateMatch[1];
                }

                const priceMatch = html.match(/NAV as of[^<]*<\/span>\s*<span class="header-nav-data">\s*\$([\d,.]+)/i)
                    || html.match(/class="header-nav-data">\s*\$([\d,.]+)/i); // Fallback

                if (priceMatch && priceMatch[1]) {
                    ibitNav = parseFloat(priceMatch[1].replace(',', ''));
                }
            }
        } catch (e) {
            console.error("BlackRock NAV Fetch Error:", e);
        }

        // 3. Coinbase BTC Futures (BTC-PERP)
        // Fetched via CoinGecko Derivatives endpoint
        let coinbaseBtcPrice = null;
        try {
            const cgDerivativesRes = await fetch('https://api.coingecko.com/api/v3/derivatives', {
                next: { revalidate: 60 }
            });
            if (cgDerivativesRes.ok) {
                const derivatives = await cgDerivativesRes.json();
                const btcPerp = derivatives.find((d: any) =>
                    d.market.toLowerCase().includes('coinbase') &&
                    d.symbol === 'BTC-PERP'
                );
                if (btcPerp) {
                    coinbaseBtcPrice = parseFloat(btcPerp.price);
                }
            }
        } catch (e) {
            console.error("Coinbase Futures Fetch Error:", e);
        }

        // Trading Status Logic (NYSE/Nasdaq)
        const now = new Date();
        const etNow = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
        const day = etNow.getDay();
        const hour = etNow.getHours();
        const minute = etNow.getMinutes();

        // Simple Market Hours: Mon-Fri 9:30 AM - 4:00 PM ET
        const isWeekday = day >= 1 && day <= 5;
        const isMarketOpen = isWeekday &&
            (hour > 9 || (hour === 9 && minute >= 30)) &&
            (hour < 16);

        return NextResponse.json({
            isOpen: isMarketOpen,
            ibitPrice,
            ibitChange,
            ibitNav,
            ibitNavDate,
            coinbaseBtcPrice,
            crypto: cryptoData
        });

    } catch (error) {
        console.error("API Error", error);
        return NextResponse.json({ error: 'Failed to fetch market data' }, { status: 500 });
    }
}

