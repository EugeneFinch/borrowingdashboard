import { GraphQLClient, gql } from 'graphql-request';

const API_URL = 'https://blue-api.morpho.org/graphql';

export const morphoClient = new GraphQLClient(API_URL);

export interface Token {
  address: string;
  symbol: string;
  decimals: number;
}

export interface MarketReward {
  borrowApr: number;
  asset: {
    symbol: string;
  };
}

export interface MarketState {
  borrowApy: number;
  utilization: number;
  supplyAssets: string;
  borrowAssets: string;
  rewards?: MarketReward[];
}

export interface Chain {
  id: number;
  network: string;
}

export interface Market {
  uniqueKey: string;
  loanAsset: Token;
  collateralAsset: Token | null;
  state: MarketState;
  morphoBlue: {
    chain: {
      id: number;
    };
  };
}

export interface GetMarketsResponse {
  markets: {
    items: Market[];
  };
}

export const GET_MARKETS_QUERY = gql`
  query GetMarkets($first: Int, $skip: Int) {
    markets(first: $first, skip: $skip) {
      items {
        uniqueKey
        loanAsset {
          address
          symbol
          decimals
        }
        collateralAsset {
          address
          symbol
          decimals
        }
        state {
          borrowApy
          utilization
          supplyAssets
          borrowAssets
          rewards {
            borrowApr
            asset {
              symbol
            }
          }
        }
        morphoBlue {
          chain {
            id
          }
        }
      }
    }
  }
`;

export const CHAIN_IDS: Record<number, string> = {
  1: 'Ethereum',
  8453: 'Base',
  10: 'Optimism',
  42161: 'Arbitrum',
  56: 'BSC',
  137: 'Polygon',
  250: 'Fantom',
  43114: 'Avalanche',
  100: 'Gnosis',
  1101: 'Polygon zkEVM',
  59144: 'Linea',
  534352: 'Scroll',
  5000: 'Mantle',
  11155111: 'Sepolia',
  130: 'Unichain',
  747474: 'Katana',
  999: 'Hyperliquid',
};

export async function fetchMarkets() {
  let allMarkets: Market[] = [];
  let skip = 0;
  const first = 1000; // Increase page size
  let hasMore = true;

  while (hasMore) {
    console.log(`Fetching markets: skip=${skip} first=${first}`);
    const data = await morphoClient.request<GetMarketsResponse>(GET_MARKETS_QUERY, { first, skip });
    const items = data.markets.items;

    if (items.length > 0) {
      allMarkets = [...allMarkets, ...items];
      skip += items.length;
    } else {
      hasMore = false;
    }

    // Safety break to prevent infinite loops if something weird happens, or if we hit a massive number
    if (items.length < first || allMarkets.length > 5000) {
      hasMore = false;
    }
  }

  return allMarkets;
}
