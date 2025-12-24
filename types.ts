
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export type TradeResult = 'gain' | 'loss';

export interface Trade {
  id: string;
  pair: string;
  timestamp: number;
  resultType: TradeResult;
  amount: number;
  rrr: number;
  reason: string;
}

export interface Stats {
  daily: number;
  threeDay: number;
  weekly: number;
  monthly: number;
  allTime: number;
}

// Added missing Artifact interface used by components/ArtifactCard.tsx
export interface Artifact {
  id: string;
  html: string;
  styleName: string;
  status: 'streaming' | 'complete' | 'error';
}
