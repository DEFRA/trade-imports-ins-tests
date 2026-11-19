import { isCdpLocal } from '@utils/playwright/environment';

const CDP_PROXY_URL = process.env.HTTP_PROXY || 'http://localhost:3128';

/** Direct from a laptop (CDP_LOCAL); through the CDP proxy everywhere else. */
export const getCdpProxy = (): { server: string } | undefined => (isCdpLocal() ? undefined : { server: CDP_PROXY_URL });
