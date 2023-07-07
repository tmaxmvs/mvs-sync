import {SyncManager} from "../lib/utils/SyncManager";
import {ResultMessage} from "../lib/interfaces/ResultMessage";
import {randomUUID} from "crypto";
import syncManager from "../lib/utils/socket";

describe("SyncManager 동기화 테스트", () => {

  const appId = 1
  const roomNumber = parseInt(randomUUID(), 16) >>> 1
  const roomName = 'test'
  const delay = (ms: number) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  };

  beforeEach(async () => {
    await delay(500);
  });

  afterEach(() => {
    if (SyncManager.socket.readyState === 1) {
      SyncManager.socket.close();
    }
  });

  test("HEART_BEAT", async () => {
    SyncManager.socket.onopen = () => {
      syncManager.reqHeatBeat();
      return new Promise<void>((resolve) => {

        syncManager.onHeartBeat = (message) => {
          expect(message.getResult()).toBe(ResultMessage.SUCCESS);
          resolve();
        };
      })
    }
  });

  test("룸 리스트 테스트", async () => {
    SyncManager.socket.onopen = () => {
      syncManager.reqRoomList();
      return new Promise<void>((resolve) => {
        syncManager.onRoomList = (message) => {
          expect(message.getResult()).toBe(ResultMessage.SUCCESS);
          resolve();
        };
      });
    }
  });

  test("룸 생성 테스트", async () => {
    SyncManager.socket.onopen = () => {
      syncManager.reqCreateRoom(appId, roomNumber, roomName);
      return new Promise<void>((resolve) => {
        syncManager.onRoomList = (message) => {
          expect(message.getResult()).toBe(ResultMessage.SUCCESS);
          expect(message.getAppid()==appId
              &&message.getWaplroomid()==roomNumber
              &&message.getName()==roomName)
              .toBe(true)
          resolve();
        };
      });
    }
  });

  test("그룹 리스트 테스트", async () => {
    SyncManager.socket.onopen = () => {
      syncManager.reqGroupList();
      return new Promise<void>((resolve) => {
        syncManager.onGroupList = (message) => {
          expect(message.getResult()).toBe(ResultMessage.SUCCESS);
          resolve();
        };
      });
    }
  });

  test("플레이어 아이디 테스트", async () => {
    SyncManager.socket.onopen = () => {
      syncManager.reqPlayerId();
      return new Promise<void>((resolve) => {
        syncManager.onPlayerId = (message) => {
          expect(message.getResult()).toBe(ResultMessage.SUCCESS);
          expect(message.getPlayerid()).toBeGreaterThanOrEqual(0);
          resolve();
        };
      });
    }
  });
});