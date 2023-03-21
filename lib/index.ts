import { SyncManager } from "./utils/SyncManager";

export function makeSyncManager(_ws: string): SyncManager {
  const syncManager = new SyncManager(_ws);
  return syncManager;
}
