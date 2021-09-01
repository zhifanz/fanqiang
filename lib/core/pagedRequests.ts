import { nonNullArray } from "./langUtils";

export async function findPagedResources<R, T, PAGEABLE>(
  pagedAction: (pageable?: PAGEABLE) => Promise<R>,
  updatePageable: (previousPageable: PAGEABLE | undefined, response: R) => PAGEABLE | undefined,
  checkHasMore: (response: R) => boolean,
  mapper: (response: R) => T[] | undefined,
  initialValue?: PAGEABLE
): Promise<T[]> {
  const result: T[] = [];
  let current = initialValue;
  let hasMore = true;
  while (hasMore) {
    const response = await pagedAction(current);
    result.push(...nonNullArray(mapper(response)));
    hasMore = checkHasMore(response);
    current = updatePageable(current, response);
  }
  return result;
}
