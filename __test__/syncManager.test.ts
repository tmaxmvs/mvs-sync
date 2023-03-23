import WS from "jest-websocket-mock";
import { SyncManager } from "../lib/utils/SyncManager";
import { MessageWriter } from "../lib/utils/MessageWriter";

describe("SyncManager websocket communication", () => {
  let mockServer: WS;
  let syncManager: SyncManager;

  beforeEach(async () => {
    // mockServer = new WS("ws://localhost:7788");
    // syncManager = new SyncManager("ws://localhost:7788");
    // await mockServer.connected;
  });

  afterEach(() => {
    mockServer.close();
    jest.clearAllMocks();
  });

  it("should create and join room", async () => {
    mockServer = new WS("ws://localhost:7788");
    syncManager = new SyncManager("ws://localhost:7788");
    await mockServer.connected;

    syncManager.reqCreateAndJoinRoom(1);

    await expect(mockServer).toReceiveMessage({
      data: [12, 0, 0, 0, 1, 1, 0, 162, 4, 0, 0, 0, 1, 0, 0, 0],
      type: "Buffer",
    });
    expect(mockServer).toHaveReceivedMessages([
      {
        data: [12, 0, 0, 0, 1, 1, 0, 162, 4, 0, 0, 0, 1, 0, 0, 0],
        type: "Buffer",
      },
    ]);

    // syncManager.onCreateRoom = (roomNumber: string) => {
    //   expect(roomNumber).toBe("1");
    //   done();
    // };

    // mockServer.on("connection", (socket) => {
    //   socket.on("message", (data) => {
    //     const buffer = Buffer.from(data);
    //     const messageId = buffer.readUInt32LE(4);

    //     if (messageId === eMessageID.ROOM_CREATE_REQ) {
    //       const response = Buffer.alloc(12);
    //       response.writeUInt32LE(8, 0);
    //       response.writeUInt32LE(eMessageID.ROOM_CREATE_RES, 4);
    //       response.writeUInt32LE(1, 8);
    //       socket.send(response);
    //     }
    //   });
    // });

    // syncManager.reqCreateAndJoinRoom(1);
  });

  // 이와 같은 방식으로 다른 테스트 케이스를 작성하세요.
});
