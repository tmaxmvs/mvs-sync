import {SyncManager} from "../lib/utils/SyncManager";
const WebSocket = require ("ws");

describe("웹소켓 서버 테스트", () => {

  afterEach(() => {
    if (SyncManager.socket.readyState === 1) {
      SyncManager.socket.close();
    }
  });

  test("서버에 연결할 수 있는지 확인", (done) => {
    SyncManager.socket.onopen = () => {
      expect(SyncManager.socket.readyState).toBe(WebSocket.OPEN);
      done();
    };
  });
});
