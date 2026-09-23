export const staticSite = process.env.NEXT_PUBLIC_STATIC_SITE === 'true';
export const assetUrl = (path: string) => `${process.env.NEXT_PUBLIC_BASE_PATH || ''}${path}`;
