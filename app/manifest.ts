import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Morpho Monitor',
        short_name: 'MorphoMon',
        description: 'Real-time borrowing costs across Morpho Blue deployments',
        start_url: '/',
        display: 'standalone',
        background_color: '#000000',
        theme_color: '#000000',
        icons: [
            {
                src: '/vercel.svg',
                sizes: '192x192',
                type: 'image/svg+xml',
            },
            {
                src: '/vercel.svg',
                sizes: '512x512',
                type: 'image/svg+xml',
            },
        ],
    };
}
