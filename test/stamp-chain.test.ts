/**
 * E2E Test for Stamp Chain Workflow
 *
 * This test verifies that a workflow correctly chains two stamp workers,
 * with stamps accumulating on the target entity.
 *
 * Prerequisites:
 * 1. Deploy two stamp workers (can be same code, different klados entities)
 * 2. Register the workflow: npm run register -- stamp-chain
 * 3. Set environment variables (see .env.example)
 *
 * Usage:
 *   ARKE_USER_KEY=uk_... RHIZA_ID=rhiza_... npm test
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  createCollection,
  createEntity,
  getEntity,
  deleteEntity,
  invokeRhiza,
  waitForWorkflowCompletion,
  assertWorkflowCompleted,
  sleep,
  log,
} from '@arke-institute/klados-testing';
import { setupTestClient, hasStampChainConfig, RHIZA_ID } from './setup.js';

// =============================================================================
// Test Suite
// =============================================================================

describe('stamp-chain workflow', () => {
  // Test fixtures
  let targetCollection: { id: string };
  let jobCollection: { id: string };
  let testEntity: { id: string };
  let configValid = false;

  // Skip tests if environment not configured
  beforeAll(() => {
    configValid = setupTestClient() && hasStampChainConfig();
    if (!configValid) {
      console.warn('\nTest skipped: Missing required environment variables');
      console.warn('See .env.example for required configuration\n');
    }
  });

  // Create test fixtures
  beforeAll(async () => {
    if (!configValid) return;

    log('Creating test fixtures...');

    // Create target collection
    targetCollection = await createCollection({
      label: `Stamp Chain Target ${Date.now()}`,
      description: 'Target collection for stamp chain workflow test',
    });
    log(`Created target collection: ${targetCollection.id}`);

    // Create job collection for workflow logs
    jobCollection = await createCollection({
      label: `Stamp Chain Jobs ${Date.now()}`,
      description: 'Job collection for stamp chain workflow test',
    });
    log(`Created job collection: ${jobCollection.id}`);

    // Create test entity to be stamped
    testEntity = await createEntity({
      type: 'test_entity',
      properties: {
        title: 'Test Entity for Stamp Chain',
        content: 'This entity will be stamped twice',
        created_at: new Date().toISOString(),
      },
      collectionId: targetCollection.id,
    });
    log(`Created test entity: ${testEntity.id}`);
  });

  // Cleanup test fixtures
  afterAll(async () => {
    if (!configValid) return;

    log('Cleaning up test fixtures...');

    try {
      // Small delay to ensure all operations are complete
      await sleep(1000);

      if (testEntity?.id) await deleteEntity(testEntity.id);
      if (targetCollection?.id) await deleteEntity(targetCollection.id);
      if (jobCollection?.id) await deleteEntity(jobCollection.id);
      log('Cleanup complete');
    } catch (e) {
      log(`Cleanup error (non-fatal): ${e}`);
    }
  });

  // ==========================================================================
  // Tests
  // ==========================================================================

  it('should accumulate stamps through workflow chain', async () => {
    if (!configValid) {
      console.warn('Test skipped: missing environment variables');
      return;
    }

    // Invoke the workflow
    log('Invoking stamp-chain workflow...');
    const result = await invokeRhiza({
      rhizaId: RHIZA_ID!,
      targetEntity: testEntity.id,
      targetCollection: targetCollection.id,
      jobCollection: jobCollection.id,
      confirm: true,
    });

    expect(result.status).toBe('started');
    expect(result.job_id).toBeDefined();
    log(`Workflow started: ${result.job_id}`);

    // Wait for workflow completion (2 steps)
    log('Waiting for workflow completion...');
    const completion = await waitForWorkflowCompletion(jobCollection.id, {
      timeout: 90000,
      pollInterval: 3000,
      expectedSteps: 2,
    });

    // Assert workflow completed successfully
    assertWorkflowCompleted(completion, 2);
    log(`Workflow completed with ${completion.logs.length} steps`);

    // Log each step
    for (const stepLog of completion.logs) {
      log(`  Step: ${stepLog.properties.klados_id} - ${stepLog.properties.status}`);
    }

    // Verify stamps accumulated on the entity
    log('Verifying stamps...');
    const entity = await getEntity(testEntity.id);

    // Should have stamps array with 2 entries
    expect(entity.properties.stamps).toBeDefined();
    expect(Array.isArray(entity.properties.stamps)).toBe(true);
    expect(entity.properties.stamps).toHaveLength(2);
    expect(entity.properties.stamp_count).toBe(2);

    // Verify stamp structure
    const stamps = entity.properties.stamps as Array<{
      stamp_number: number;
      stamped_by: string;
      stamped_at: string;
      stamp_message: string;
      job_id: string;
    }>;

    // First stamp
    expect(stamps[0].stamp_number).toBe(1);
    expect(stamps[0].stamped_by).toBeDefined();
    expect(stamps[0].stamped_at).toBeDefined();
    expect(stamps[0].stamp_message).toContain('Stamp #1');
    log(`  Stamp 1: ${stamps[0].stamped_by} at ${stamps[0].stamped_at}`);

    // Second stamp
    expect(stamps[1].stamp_number).toBe(2);
    expect(stamps[1].stamped_by).toBeDefined();
    expect(stamps[1].stamped_at).toBeDefined();
    expect(stamps[1].stamp_message).toContain('Stamp #2');
    log(`  Stamp 2: ${stamps[1].stamped_by} at ${stamps[1].stamped_at}`);

    // Verify stamps are from different klados (if using two different ones)
    // or same klados (if using same worker twice)
    log('');
    log('✓ Workflow chain test passed!');
    log(`  - Entity stamped ${stamps.length} times`);
    log(`  - Stamps accumulated correctly`);
  });
});
