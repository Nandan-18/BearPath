export const MOBILE_MAX = 639;
export const MOBILE_QUERY = `(max-width: ${MOBILE_MAX}px)`;

export function isMobileWidth(width = window.innerWidth): boolean {
  return width <= MOBILE_MAX;
}
