/**
 * The domain each service tag belongs to. A service tag marks a spec in some
 * other domain that a service's pull request should also run (see
 * trade-imports-workspace scripts/ci/e2e-tests-pr-scope.json). That service's
 * own domain already runs by path, so a spec under it must not carry the tag.
 */
export const SERVICE_TAG_DOMAINS: Record<string, string[]> = {
  '@address-book': ['ins'],
  '@ins-backend': ['ins'],
  '@ins-frontend': ['ins'],
  '@animals-admin': ['animals-admin'],
  '@animals-backend': ['animals', 'animals-admin'],
  '@animals-frontend': ['animals'],
  '@plants-backend': ['plants'],
  '@plants-frontend': ['plants'],
};
