const https = require('https');

const url = 'https://www.blackrock.com/us/individual/products/333011/ishares-bitcoin-trust';

https.get(url, {
    headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cookie': 'some-cookie=1' // sometimes helps
    }
}, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        if (res.statusCode !== 200) {
            console.log("Status:", res.statusCode);
            return;
        }

        // Simple regex to find NAV
        // Data format saw in Chunk 11: "NAV as of Dec 12, 2025\n\n\n$51.13"
        // It might be in HTML spans.
        const navMatch = data.match(/NAV as of/i);
        console.log("Found 'NAV as of':", !!navMatch);

        // Let's print a small window around it if found
        if (navMatch) {
            const idx = navMatch.index;
            console.log(data.substring(idx, idx + 200));
        }

        // Try to find the specific value class if possible?
        // Usually <span class="header-nav-data">
    });
});
