import ValidationError from '../ValidationError';

/**
 * Position of the first key (in shape order) contained in the error path,
 * `Infinity` when there is none or the error has no path.
 */
function findIndex(keys: readonly string[], err: ValidationError) {
  const path = err.path;
  if (path == null) return Infinity;

  for (let i = 0; i < keys.length; i++) {
    if (path.includes(keys[i])) return i;
  }

  return Infinity;
}

/**
 * Creates a function that sorts (in place) the errors of an object by the
 * order of its keys.
 *
 * The index of each error is computed once per call, O(N × K) for N errors
 * and K keys, instead of once per comparison (O(N log N × K)); the sort then
 * compares numbers only. Nothing is cached between calls: paths contain array
 * indexes, so a cache living on the schema would grow without bound.
 *
 * The result is the one of a stable sort by index, same as the previous
 * comparator (`Infinity - Infinity` is `NaN`, i.e. equal).
 */
export default function sortByKeyOrder(keys: readonly string[]) {
  return function sortErrors(errors: ValidationError[]): ValidationError[] {
    const length = errors.length;
    if (length < 2 || keys.length === 0) return errors;

    const indexes = new Array<number>(length);
    let sorted = true;
    for (let i = 0; i < length; i++) {
      indexes[i] = findIndex(keys, errors[i]);
      if (i > 0 && indexes[i] < indexes[i - 1]) sorted = false;
    }

    if (sorted) return errors;

    const order = new Array<number>(length);
    for (let i = 0; i < length; i++) order[i] = i;
    // `|| a - b` also covers `Infinity - Infinity` (NaN) and keeps the sort stable
    order.sort((a, b) => indexes[a] - indexes[b] || a - b);

    const original = errors.slice();
    for (let i = 0; i < length; i++) errors[i] = original[order[i]];

    return errors;
  };
}
