export const getImageUrl = (path: string | null | undefined): string => {
  if (!path) return '/assets/img/placeholder-avatar.svg';

  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }

  const getApiRoot = (): string => {
    try {
      if (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) {
        return (import.meta as any).env.VITE_API_URL.replace(/\/api\/v\d+$/, '');
      }
    } catch (e) { /* Ignore */ }
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return 'http://localhost:5000';
  };

  const root = getApiRoot().replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  return `${root}${normalizedPath}`;
};
