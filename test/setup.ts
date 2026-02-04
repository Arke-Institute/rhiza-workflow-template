/**
 * Shared test setup and utilities
 */

import { configureTestClient } from '@arke-institute/klados-testing';

// =============================================================================
// Configuration
// =============================================================================

export const ARKE_API_BASE = process.env.ARKE_API_BASE || 'https://arke-v1.arke.institute';
export const ARKE_USER_KEY = process.env.ARKE_USER_KEY;
export const ARKE_NETWORK = (process.env.ARKE_NETWORK || 'test') as 'test' | 'main';

// Klados IDs for workflow steps
export const STAMP_KLADOS_1 = process.env.STAMP_KLADOS_1;
export const STAMP_KLADOS_2 = process.env.STAMP_KLADOS_2;

// Rhiza ID (from registration)
export const RHIZA_ID = process.env.RHIZA_ID;

// =============================================================================
// Setup
// =============================================================================

/**
 * Initialize the test client
 *
 * Call this in beforeAll() of each test file.
 */
export function setupTestClient(): boolean {
  if (!ARKE_USER_KEY) {
    console.warn('Skipping tests: ARKE_USER_KEY not set');
    return false;
  }

  configureTestClient({
    apiBase: ARKE_API_BASE,
    userKey: ARKE_USER_KEY,
    network: ARKE_NETWORK,
  });

  return true;
}

/**
 * Check if required environment variables are set for stamp-chain test
 */
export function hasStampChainConfig(): boolean {
  if (!ARKE_USER_KEY) {
    console.warn('Missing: ARKE_USER_KEY');
    return false;
  }
  if (!RHIZA_ID) {
    console.warn('Missing: RHIZA_ID (run: npm run register -- stamp-chain)');
    return false;
  }
  return true;
}
