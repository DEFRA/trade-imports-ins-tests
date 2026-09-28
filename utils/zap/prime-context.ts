import { createZapClient, runAutomationPlan } from '@utils/zap/client';
import { checkContextSync } from '@utils/zap/check-context-sync';
import { zapContextPlan } from '@config/zap';

// Registers ZAP's contexts (dataDrivenNodes, excludePaths) before the
// Playwright run generates any traffic — see automation-context.yaml's
// header for why this has to happen first, not as part of the real scan
// plan run by run-and-gate.ts afterwards.
async function main(): Promise<void> {
  await checkContextSync();
  const client = createZapClient();
  await runAutomationPlan(client, zapContextPlan);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
