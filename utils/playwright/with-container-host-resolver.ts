import type { PlaywrightTestConfig } from '@playwright/test';

/** OIDC redirects use localhost; map to the Docker host from inside the container. */
const CONTAINER_HOST_RESOLVER = '--host-resolver-rules=MAP localhost host.docker.internal';

export function withContainerHostResolver(config: PlaywrightTestConfig): PlaywrightTestConfig {
  if (!Array.isArray(config.projects)) {
    return config;
  }

  return {
    ...config,
    projects: config.projects.map((project) => ({
      ...project,
      use: {
        ...project.use,
        launchOptions: {
          ...project.use?.launchOptions,
          args: [...(project.use?.launchOptions?.args ?? []), CONTAINER_HOST_RESOLVER],
        },
      },
    })),
  };
}
