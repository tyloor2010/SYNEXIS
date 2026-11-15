const KEY = 'synexis-opening-seen';
let seenInMemory = false;

export function claimOpening(storage: Pick<Storage, 'getItem' | 'setItem'>) {
  try {
    if (storage.getItem(KEY) === 'true') return false;
    storage.setItem(KEY, 'true');
    return true;
  } catch {
    if (seenInMemory) return false;
    seenInMemory = true;
    return true;
  }
}
