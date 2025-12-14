const https = require('https');

https.get('https://api.coingecko.com/api/v3/derivatives', {
    headers: { 'User-Agent': 'Node.js' }
}, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        try {
            const derivatives = JSON.parse(data);
            const coinbase = derivatives.filter(d =>
                d.market.toLowerCase().includes('coinbase') &&
                d.symbol.toLowerCase().includes('btc')
            );
            console.log("Coinbase Futures:", coinbase);
        } catch (e) {
            console.error("Parse error", e);
        }
    });
});
