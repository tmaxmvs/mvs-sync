import WS from "jest-websocket-mock";
import { SyncManager } from "../lib/utils/SyncManager";
import { MessageWriter } from "../lib/utils/MessageWriter";

describe("SyncManager websocket communication", () => {
  let mockServer: WS;
  let syncManager: SyncManager;

  beforeEach(async () => {
    mockServer = new WS("ws://localhost:7788");
    syncManager = new SyncManager("ws://localhost:7788");
    await mockServer.connected;
  });

  test("getConnectionID", () => {
    // connectionID는 private 속성이므로, 테스트를 위해 임시로 접근을 허용해야 합니다.
    // SyncManager 클래스에 다음 코드를 추가하세요:
    // get connectionIDForTesting() { return this.#connectionID; }
    // 이제 테스트를 작성할 수 있습니다:
    expect(syncManager.getConnectionID()).toBeUndefined();
  });
});

describe("MessageWriter", () => {
  let messageWriter: MessageWriter;

  beforeEach(() => {
    messageWriter = new MessageWriter();
  });

  test("setMessageBodyOne", () => {
    messageWriter.setMessageBodyOne(42);
    const expectedBuffer = Buffer.alloc(4);
    expectedBuffer.writeUInt32LE(42);
  });

  // 다른 메소드에 대한 테스트 케이스도 여기에 추가하세요.
});
