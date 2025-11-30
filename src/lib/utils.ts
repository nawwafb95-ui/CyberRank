export function clsx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}
export function pathWithNext(path: string) {
  const enc = encodeURIComponent(path);
  return `?next=${enc}`;
}
export function getNextFromSearch(search: string) {
  const params = new URLSearchParams(search);
  return params.get('next');
}


