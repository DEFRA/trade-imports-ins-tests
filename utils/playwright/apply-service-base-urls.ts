/** Sets each env var in serviceBaseUrls to its URL; throws if any URL is empty. */
export function applyServiceBaseUrls(serviceBaseUrls: Record<string, string>): void {
  for (const [envVar, baseUrl] of Object.entries(serviceBaseUrls)) {
    if (!baseUrl) {
      throw new Error(`No base URL configured for service env var: ${envVar}`);
    }
    process.env[envVar] = baseUrl;
  }
}
