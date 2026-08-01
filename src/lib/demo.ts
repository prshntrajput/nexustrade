import type { User } from '@supabase/supabase-js';
import type { AlertWithSymbol, Holding, Report, WatchlistItem } from '@/types';

export const DEMO_MODE_COOKIE = 'nexustrade-demo';
export const DEMO_USER_ID = '00000000-0000-4000-8000-000000000001';
export const DEMO_USER_EMAIL = 'demo@nexustrade.local';

export function isDemoModeCookie(value: string | undefined): boolean {
  return value === 'true';
}

export function createDemoUser(): User {
  const timestamp = '2026-01-01T00:00:00.000Z';

  return {
    id: DEMO_USER_ID,
    aud: 'authenticated',
    role: 'authenticated',
    email: DEMO_USER_EMAIL,
    email_confirmed_at: timestamp,
    confirmed_at: timestamp,
    last_sign_in_at: timestamp,
    app_metadata: { provider: 'demo', providers: ['demo'] },
    user_metadata: { name: 'Demo Interviewer' },
    identities: [],
    created_at: timestamp,
    updated_at: timestamp,
    is_anonymous: false,
  } as User;
}

export const demoWatchlist: WatchlistItem[] = [
  {
    id: '10000000-0000-4000-8000-000000000001',
    userId: DEMO_USER_ID,
    symbol: 'AAPL',
    addedAt: '2026-07-20T10:00:00.000Z',
    notes: 'Large-cap quality benchmark',
  },
  {
    id: '10000000-0000-4000-8000-000000000002',
    userId: DEMO_USER_ID,
    symbol: 'MSFT',
    addedAt: '2026-07-21T10:00:00.000Z',
    notes: 'AI and cloud exposure',
  },
  {
    id: '10000000-0000-4000-8000-000000000003',
    userId: DEMO_USER_ID,
    symbol: 'NVDA',
    addedAt: '2026-07-22T10:00:00.000Z',
    notes: 'Semiconductor momentum watch',
  },
  {
    id: '10000000-0000-4000-8000-000000000004',
    userId: DEMO_USER_ID,
    symbol: 'TSLA',
    addedAt: '2026-07-23T10:00:00.000Z',
    notes: 'High-beta sentiment indicator',
  },
];

export const demoHoldings: Holding[] = [
  {
    id: '20000000-0000-4000-8000-000000000001',
    userId: DEMO_USER_ID,
    symbol: 'AAPL',
    shares: 12,
    avgBuyPrice: 185.25,
    notes: 'Core position',
    createdAt: '2026-07-10T10:00:00.000Z',
    updatedAt: '2026-07-10T10:00:00.000Z',
  },
  {
    id: '20000000-0000-4000-8000-000000000002',
    userId: DEMO_USER_ID,
    symbol: 'MSFT',
    shares: 6,
    avgBuyPrice: 410.5,
    notes: 'Cloud exposure',
    createdAt: '2026-07-11T10:00:00.000Z',
    updatedAt: '2026-07-11T10:00:00.000Z',
  },
  {
    id: '20000000-0000-4000-8000-000000000003',
    userId: DEMO_USER_ID,
    symbol: 'NVDA',
    shares: 10,
    avgBuyPrice: 118.75,
    notes: 'AI infrastructure',
    createdAt: '2026-07-12T10:00:00.000Z',
    updatedAt: '2026-07-12T10:00:00.000Z',
  },
];

export const demoAlerts: AlertWithSymbol[] = [
  {
    id: '30000000-0000-4000-8000-000000000001',
    watchlistId: '10000000-0000-4000-8000-000000000001',
    userId: DEMO_USER_ID,
    symbol: 'AAPL',
    conditionType: 'PRICE_ABOVE',
    threshold: 230,
    multiplier: null,
    isActive: true,
    createdAt: '2026-07-24T10:00:00.000Z',
  },
  {
    id: '30000000-0000-4000-8000-000000000002',
    watchlistId: '10000000-0000-4000-8000-000000000003',
    userId: DEMO_USER_ID,
    symbol: 'NVDA',
    conditionType: 'RSI_ABOVE',
    threshold: 70,
    multiplier: null,
    isActive: false,
    createdAt: '2026-07-25T10:00:00.000Z',
  },
];

export const demoReports: Report[] = [
  {
    id: '40000000-0000-4000-8000-000000000001',
    userId: DEMO_USER_ID,
    symbol: 'MSFT',
    alertId: null,
    trigger: 'manual',
    summary:
      'Microsoft remains positioned around durable cloud demand and broad AI monetization, with valuation discipline the main swing factor.',
    sentiment: 'BULLISH',
    keyRisks: [
      'Enterprise cloud optimization could pressure growth.',
      'High expectations leave less room for execution misses.',
    ],
    keyOpportunities: [
      'Copilot adoption can expand ARPU across existing enterprise seats.',
      'Azure AI workloads may support infrastructure growth.',
    ],
    technicalOutlook:
      'Momentum is constructive while price remains above the middle Bollinger band; watch RSI for overbought confirmation.',
    indicators: {
      rsi14: 61.4,
      macd: 2.8,
      signal: 1.9,
      histogram: 0.9,
      bbUpper: 455.2,
      bbMiddle: 431.6,
      bbLower: 408.0,
    },
    createdAt: '2026-07-28T10:00:00.000Z',
  },
  {
    id: '40000000-0000-4000-8000-000000000002',
    userId: DEMO_USER_ID,
    symbol: 'AAPL',
    alertId: '30000000-0000-4000-8000-000000000001',
    trigger: 'alert',
    summary:
      'Apple shows defensive quality characteristics, but near-term upside depends on services strength and device cycle follow-through.',
    sentiment: 'NEUTRAL',
    keyRisks: [
      'Hardware replacement cycles may stay uneven.',
      'Regulatory scrutiny can pressure services economics.',
    ],
    keyOpportunities: [
      'Services mix can support margin resilience.',
      'AI-enabled device upgrades could improve sentiment.',
    ],
    technicalOutlook:
      'The setup is range-bound. A close above resistance would improve the risk/reward profile.',
    indicators: {
      rsi14: 54.2,
      macd: 0.8,
      signal: 0.9,
      histogram: -0.1,
      bbUpper: 226.4,
      bbMiddle: 214.1,
      bbLower: 201.8,
    },
    createdAt: '2026-07-26T10:00:00.000Z',
  },
];
