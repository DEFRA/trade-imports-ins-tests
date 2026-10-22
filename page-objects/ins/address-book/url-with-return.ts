export const urlWithReturn = (url: string, returnTo: string): string => `${url}?return=${encodeURIComponent(returnTo)}`;
