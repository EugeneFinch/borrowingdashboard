const https = require('https');

function fetchJson(url) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'Node.js' } }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve(null);
                }
            });
        }).on('error', reject);
    });
}

async function checkPrices() {
    console.log("Fetching Spot...");
    const spotData = await fetchJson('https://api.exchange.coinbase.com/products/BTC-USD/ticker');
    const spotPrice = spotData ? parseFloat(spotData.price) : 'N/A';
    console.log("Coinbase Spot (BTC-USD):", spotPrice);

    console.log("Fetching Futures...");
    const derivData = await fetchJson('https://api.coingecko.com/api/v3/derivatives');
    if (derivData) {
        const futures = derivData.find(d =>
            d.market.toLowerCase().includes('coinbase') &&
            d.symbol === 'BTC-PERP'
        );
        if (futures) {
            console.log("Coinbase Futures (BTC-PERP):", futures.price);
            console.log("Difference:", futures.price - spotPrice);
        } else {
            console.log("BTC-PERP not found in CoinGecko response");
        }

    } else {
        console.log("Failed to fetch derivatives");
    }
}

checkPrices();
