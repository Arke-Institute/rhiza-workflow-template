# Rhiza Workflow Template

A template for testing rhiza workflow compositions on the Arke network.

## Overview

This template provides the infrastructure to:
- Define workflow compositions (JSON)
- Register workflows as rhiza entities on Arke
- Test workflow execution end-to-end
- Verify data flows correctly through workflow steps

**Key concept**: Rhizas reference klados workers that exist on the network. Workers are independent, portable entities - this template focuses on testing how they compose together.

## Quick Start

### 1. Clone this template

```bash
git clone https://github.com/Arke-Institute/rhiza-workflow-template my-workflow
cd my-workflow
npm install
```

### 2. Set up your environment

Copy the example environment file:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```bash
ARKE_USER_KEY=uk_your_key_here
ARKE_NETWORK=test

# Klados IDs (workers must be deployed and active)
STAMP_KLADOS_1=klados_your_first_stamp_worker
STAMP_KLADOS_2=klados_your_second_stamp_worker
```

### 3. Find available klados workers

List klados workers you have access to:
```bash
npm run list-kladoi
```

### 4. Register your workflow

```bash
npm run register -- stamp-chain
```

This creates a rhiza entity on Arke and saves its ID to `.rhiza-state.json`.

### 5. Run the tests

```bash
RHIZA_ID=rhiza_xxx npm test
```

## Project Structure

```
rhiza-workflow-template/
├── workflows/               # Workflow definitions (JSON)
│   └── stamp-chain.json     # Example: stamp → stamp chain
├── scripts/
│   ├── register.ts          # Create rhiza from definition
│   └── list-kladoi.ts       # List available workers
├── test/
│   ├── setup.ts             # Shared test configuration
│   └── stamp-chain.test.ts  # Workflow tests
├── package.json
├── vitest.config.ts
└── .env.example
```

## Workflow Definition Format

Workflow definitions are JSON files in `workflows/`:

```json
{
  "label": "My Workflow",
  "description": "What this workflow does",
  "version": "1.0",
  "entry": "$ENTRY_KLADOS",
  "flow": {
    "$ENTRY_KLADOS": {
      "then": { "pass": "$NEXT_KLADOS" }
    },
    "$NEXT_KLADOS": {
      "then": { "done": true }
    }
  }
}
```

**Variable substitution**: Use `$ENV_VAR` syntax for klados references. The registration script substitutes these from environment variables.

### Handoff Types

- `{ "pass": "klados_id" }` - Pass output to next step (1:1)
- `{ "scatter": "klados_id" }` - Fan out to multiple parallel invocations (1:N)
- `{ "gather": "klados_id" }` - Collect outputs from scatter (N:1)
- `{ "done": true }` - Workflow complete

## Creating Your Own Workflow

1. **Create a workflow definition** in `workflows/my-workflow.json`
2. **Set environment variables** for the klados IDs used
3. **Register**: `npm run register -- my-workflow`
4. **Create test file** in `test/my-workflow.test.ts`
5. **Run tests**: `npm test`

## Example: Stamp Chain

The included `stamp-chain` workflow demonstrates basic chaining:

```
Entity → Stamp Worker 1 → Stamp Worker 2 → Done
                ↓                ↓
           adds stamp[0]    adds stamp[1]
```

After the workflow completes, the entity has:
```json
{
  "stamps": [
    { "stamp_number": 1, "stamped_by": "klados_1", ... },
    { "stamp_number": 2, "stamped_by": "klados_2", ... }
  ],
  "stamp_count": 2
}
```

## Testing Utilities

This template uses `@arke-institute/klados-testing` which provides:

- `invokeRhiza()` - Start a workflow
- `waitForWorkflowCompletion()` - Poll until all steps complete
- `assertWorkflowCompleted()` - Verify workflow success
- `createCollection()`, `createEntity()`, `deleteEntity()` - Test fixtures

## Environment Variables

| Variable | Description |
|----------|-------------|
| `ARKE_API_BASE` | API URL (default: https://arke-v1.arke.institute) |
| `ARKE_USER_KEY` | Your user API key (uk_...) |
| `ARKE_NETWORK` | Network: 'test' or 'main' |
| `RHIZA_ID` | Rhiza ID (from registration) |
| `STAMP_KLADOS_1` | First stamp worker ID |
| `STAMP_KLADOS_2` | Second stamp worker ID |

## Resources

- [klados-examples](https://github.com/Arke-Institute/klados-examples) - Example klados workers
- [klados-worker-template](https://github.com/Arke-Institute/klados-worker-template) - Create new workers
- [@arke-institute/rhiza](https://www.npmjs.com/package/@arke-institute/rhiza) - Workflow protocol library
- [@arke-institute/klados-testing](https://www.npmjs.com/package/@arke-institute/klados-testing) - Testing utilities

## License

MIT
