const https = require('https');

const url = 'https://query1.finance.yahoo.com/v8/finance/chart/IBIT';

https.get(url, {
    headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.0.0 Safari/537.36'
    }
}, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log(JSON.stringify(json, null, 2));
        } catch (e) {
            console.error("Parse error", e);
        }
    });
});
