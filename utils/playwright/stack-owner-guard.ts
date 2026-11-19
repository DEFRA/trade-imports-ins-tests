import type { FullConfig } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';

const STACK_PROJECT = 'trade-imports';
const WORKING_DIR_LABEL = 'com.docker.compose.project.working_dir';
const COMPOSE_FOLDER = join('docker', 'stack');

type StackLease = { workspace?: string; state?: string; pid?: number };

/** The per-machine stack lease file, found the way `tim docker lease` finds it. */
export function stackLeasePath(env: NodeJS.ProcessEnv = process.env): string {
  return env.TIM_STACK_LEASE || join(env.XDG_STATE_HOME || join(homedir(), '.local', 'state'), 'tim', 'stack-lease.json');
}

function canonicalPath(path: string): string {
  return existsSync(path) ? realpathSync(path) : resolve(path);
}

function isSameClone(left: string, right: string): boolean {
  return canonicalPath(left) === canonicalPath(right);
}

/** The workspace clone holding this tests repo under its repos/ folder, or undefined for a checkout outside a workspace. */
export function workspaceCloneOf(testsRepoRoot: string): string | undefined {
  const reposFolder = dirname(testsRepoRoot);
  const clone = dirname(reposFolder);
  return basename(reposFolder) === 'repos' && existsSync(join(clone, 'repos.json')) ? clone : undefined;
}

function cloneOfComposeFolder(workingDir: string): string {
  return workingDir.endsWith(`/${COMPOSE_FOLDER}`) ? workingDir.slice(0, -(COMPOSE_FOLDER.length + 1)) : workingDir;
}

function listStackWorkingDirs(): string {
  try {
    return execFileSync(
      'docker',
      ['ps', '--filter', `label=com.docker.compose.project=${STACK_PROJECT}`, '--format', `{{.Label "${WORKING_DIR_LABEL}"}}`],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
    );
  } catch (error) {
    console.warn(`Stack owner check: docker cannot list the workspace stack, so no running stack counts (${(error as Error).message}).`);
    return '';
  }
}

/** The clones the running workspace stack's containers were started from. Empty when docker shows no stack. */
export function stackClones(): string[] {
  const workingDirs = listStackWorkingDirs()
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  return [...new Set(workingDirs.map(cloneOfComposeFolder))].sort();
}

function isProcessAlive(pid: unknown): boolean {
  if (!Number.isInteger(pid)) return false;
  try {
    process.kill(pid as number, 0);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === 'EPERM';
  }
}

function readStackLease(leasePath: string): StackLease | undefined {
  if (!existsSync(leasePath)) return undefined;
  try {
    return JSON.parse(readFileSync(leasePath, 'utf8')) as StackLease;
  } catch (error) {
    console.warn(
      `Stack owner check: the stack lease at ${leasePath} is not valid JSON, so it names no owner (${(error as Error).message}).`,
    );
    return undefined;
  }
}

/** The clone whose lease is still starting the stack, from the lease file at `leasePath`. */
export function startingLeaseClone(leasePath: string): string | undefined {
  const lease = readStackLease(leasePath);
  return lease?.workspace && lease.state === 'starting' && isProcessAlive(lease.pid) ? lease.workspace : undefined;
}

/**
 * The clone that owns the workspace stack when it is not `thisClone`: one its running containers
 * were started from, or, while no stack runs, the clone whose lease is still starting one.
 */
export function foreignStackOwner(
  thisClone: string,
  { runningClones, startingClone }: { runningClones: string[]; startingClone?: string },
): string | undefined {
  const candidates = runningClones.length > 0 ? runningClones : [startingClone].filter(Boolean);
  return candidates.find((clone) => !isSameClone(clone, thisClone));
}

export function foreignStackRefusal(owner: string): string {
  return `The stack belongs to ${owner}. Run E2E there, or push and let GitHub Actions run it.`;
}

/**
 * Stops the run before any test when another workspace clone owns the stack.
 * Passes when this checkout sits outside a workspace, when nothing names an owner, and when ALLOW_FOREIGN_STACK=1.
 */
function stackOwnerGuard(config: FullConfig): void {
  if (process.env.ALLOW_FOREIGN_STACK === '1') return;
  const thisClone = workspaceCloneOf(dirname(config.configFile ?? config.rootDir));
  if (!thisClone) return;
  const owner = foreignStackOwner(thisClone, {
    runningClones: stackClones(),
    startingClone: startingLeaseClone(stackLeasePath()),
  });
  if (owner) throw new Error(foreignStackRefusal(owner));
}

export default stackOwnerGuard;
