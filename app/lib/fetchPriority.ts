/**
 * React 18 only accepts the lowercase DOM attribute `fetchpriority` on
 * `<img>`; camelCase `fetchPriority` logs a console warning. React 19
 * accepts camelCase. Spread this onto Hydrogen `Image` or native `<img>`.
 */
export function fetchPriorityAttr(value: 'high' | 'low' | 'auto') {
  return {fetchpriority: value} as const;
}
