function setting(): string {
  return (process.env.E2E_SESSION_REUSE ?? '').trim().toLowerCase();
}

/** True unless the run has spelled out `off`, for lanes where reuse is on by default. */
export function sessionReuseEnabled(): boolean {
  return setting() !== 'off';
}
