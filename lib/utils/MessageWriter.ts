import * as protocol from "../interfaces/Dictionary";
import msgpack from "msgpack-lite";
import { SyncType } from "../interfaces/SyncManagerInterfaces";

/*

(bytes)
batch 0 -
batchHeader 0 - 3
                batchBody 4 - (batchLength + 4)
                message   4 - (messageLength + 4)
                messageID 4 - 7
                                messageLen 8 - 11
                                                messageBody 12 - 
0   1   2   3   4   5   6   7   8   9   10  11  12  13  14  15  16  17  18  19  20 ....
-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------...
| batchHeader   | messageID     | messageLen    | messageBody ~ (repeat...)            | messageID     | messageLen    | messageBody ~                         | messageID     | messageLen    | messageBody ~                         |...
-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------...

*/

// stack 메시지들을 담아 놓고, 1/60 초마다 담은 것을 보낸다.
// class batch
const DEFAULT_PATCH_RATE = 1000 / 20; // 20fps (50ms)
const DEFAULT_SIMULATION_INTERVAL = 1000 / 60; // 60fps (16.66ms)

export class MessageWriter {
  #patchInterval: boolean = false;
  #delay: number = DEFAULT_SIMULATION_INTERVAL;

  #offset: number = protocol.eOffsetManager.INIT_OFFSET;

  #batch: ArrayBuffer;

  #batchHeader: Buffer;
  #batchBody: Buffer;

  #message: Buffer;

  #messageHeader: Buffer;
  #messageBody: Buffer;

  // getter
  #getBatchBodyLength() {
    return this.#batchBody.byteLength;
  }

  #setMessageHeader(_msgID: number) {
    // this.#message.writeUInt32LE(_msgID);
    // this.#message.writeUInt32LE(this.#messageBody.byteLength, 4);
    const messageHeader: Buffer = Buffer.alloc(
      protocol.eOffsetManager.MESSAGE_HEADER_LENGTH
    );

    // let offset = protocol.eOffsetManager.INIT_OFFSET;
    messageHeader.writeUInt32LE(_msgID);
    messageHeader.writeUInt32LE(this.#messageBody.byteLength, 4);

    this.#messageHeader = messageHeader;
  }

  createObjectMessage(_params: SyncType, _existingMessageBody?: Buffer) {
    const objID = Buffer.alloc(4);

    const isInstanceID = _params.syncObjID > 0x00010000;

    isInstanceID
      ? objID.writeUInt32LE(_params.syncObjID, 0) // instance ID 부여 받았을 때
      : objID.writeUInt16LE(_params.syncObjID, 2); // prefab ID만 있을 때

    const attributions = Buffer.alloc(
      Object.keys(_params.attributes).length * 16
    );

    let offset = protocol.eOffsetManager.INIT_OFFSET;

    for (const key in _params.attributes) {
      const value: number = _params.attributes[key];
      offset = attributions.writeUInt32LE((1 << 24) | parseInt(key, 0), offset);
      offset = attributions.writeUInt32LE(8, offset);
      offset = attributions.writeDoubleLE(value, offset);
    }

    return _existingMessageBody
      ? Buffer.concat([_existingMessageBody, objID, attributions]) // messageBody에 여러개 들어갈 때
      : Buffer.concat([objID, attributions]); // messageBody에 1개만 들어갈 때
  }

  #createMessageBody(params?: number | SyncType | SyncType[]) {
    // 객체 생성
    if (Array.isArray(params)) {
      let messageBody;
      // 모든 객체에 대한 message 생성
      for (const param of params) {
        messageBody = this.createObjectMessage(param, messageBody);
      }
      this.#messageBody = messageBody;
    }
    // 싱크
    else if (typeof params === "object") {
      this.#messageBody = this.createObjectMessage(params);
    }
    // 룸 생성, 룸 입장, 객체 삭제, 룸 정보 요청
    else if (typeof params === "number") {
      this.#messageBody = Buffer.alloc(4);
      this.#messageBody.writeUInt32LE(params);
    }
    // 룸 전체 정보 요청
    else {
      this.#messageBody = Buffer.alloc(0);
    }
  }

  #setBatchBody() {
    this.#batchBody = Buffer.concat([this.#messageHeader, this.#messageBody]);
  }

  #createBatchHeader() {
    const batchHeader = Buffer.alloc(
      protocol.eOffsetManager.BATCH_HEADER_LENGTH
    );
    batchHeader.writeUInt32LE(this.#getBatchBodyLength());

    this.#batchHeader = batchHeader;
  }

  #setMessage(_msgID: number, _params?: number | SyncType | SyncType[]) {
    this.#createMessageBody(_params);
    this.#setMessageHeader(_msgID);
    this.#setBatchBody();
  }

  setBatch(_msgID: number, _params?: number | SyncType | SyncType[]) {
    this.#setMessage(_msgID, _params);
    this.#createBatchHeader();

    this.#batch = Buffer.concat([this.#batchHeader, this.#batchBody]);
    return this.#batch;
  }
}
