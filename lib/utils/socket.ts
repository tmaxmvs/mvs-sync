import { SyncManager } from "./SyncManager";

const syncManager = new SyncManager(process.env.REACT_APP_SERVER_URL);

export default syncManager;
