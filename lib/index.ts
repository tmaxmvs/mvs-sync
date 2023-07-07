import {SyncManager} from "./utils/SyncManager";

export function makeSyncManager(_ws: string): SyncManager {
  return SyncManager.getInstance();
}
