import { SyncManager } from "./utils/util/SyncManager";

// 웹소켓 서버 URL
const serverUrl = "ws://192.168.153.144:7788";

describe("웹소켓 서버 테스트", () => {
  let syncManager: SyncManager;

  const delay = (ms: number) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  };

  const checkConnectionID = async () => {
    return await new Promise<number>((resolve, reject) => {
      const interval = setInterval(() => {
        const connectionID = syncManager.getConnectionID();
        if (connectionID !== 0) {
          resolve(connectionID);
          clearInterval(interval);
        }
      }, 60);
    });
  };

  const checkRoomID = async () => {
    return await new Promise<number>((resolve) => {
      syncManager.reqRoomListInfo((res: any) => {
        resolve(res[res.length - 1].RoomID);
      });
    });
  };

  beforeEach(async () => {
    await delay(500);
    syncManager = new SyncManager(serverUrl);
  });

  afterEach(() => {
    if (syncManager.socket.readyState === 1) {
      syncManager.socket.close();
    }
  });

  test("방 생성 테스트", async () => {
    const currentRoomID = await checkRoomID();

    return new Promise<void>((resolve) => {
      syncManager.reqCreateAndJoinRoom(9);

      syncManager.onCreateRoom = (res) => {
        expect(parseInt(res, 16)).toBeGreaterThan(currentRoomID);
        resolve();
      };
    });
  });

  test("방 입장 테스트", async () => {
    await checkConnectionID().then((res: Number) => {
      return new Promise<void>((resolve) => {
        syncManager.reqJoinRoom(1);

        syncManager.onJoinRoom = (res) => {
          expect(res).toBeGreaterThanOrEqual(1);
          resolve();
        };
      });
    });
  });
});
