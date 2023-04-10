import * as protocol from "../interfaces/Dictionary";
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

  #message: Buffer;

  #setMessageHeader(_msgID: number) {
    this.#offset = this.#message.writeUInt32LE(_msgID, this.#offset);
    this.#offset = this.#message.writeUInt32LE(
      this.#message.byteLength -
        protocol.eOffsetManager.MESSAGE_HEADER_LENGTH -
        protocol.eOffsetManager.BATCH_HEADER_LENGTH,
      this.#offset
    );
  }

  createObjectMessage(_params: SyncType) {
    const isInstanceID = _params.syncObjID > 0x00010000;

    isInstanceID
      ? (this.#offset = this.#message.writeUInt32LE(
          _params.syncObjID,
          this.#offset
        )) // instance ID 부여 받았을 때
      : (this.#offset = this.#message.writeUInt16LE(
          _params.syncObjID,
          this.#offset + 2
        )); // prefab ID만 있을 때

    for (const key in _params.attributes) {
      const value: number = _params.attributes[key];
      this.#offset = this.#message.writeUInt32LE(
        (1 << 24) | parseInt(key, 0),
        this.#offset
      );
      this.#offset = this.#message.writeUInt32LE(
        protocol.eOffsetManager.SYNC_OBJECT_ATTR_DATA_LENGTH,
        this.#offset
      );
      this.#offset = this.#message.writeDoubleLE(value, this.#offset);
    }
  }

  #getArrayParamsLength(params: SyncType[]) {
    let messageBodyLength = 0;
    for (const param of params) {
      messageBodyLength +=
        Object.keys(param.attributes).length *
          (protocol.eOffsetManager.SYNC_OBJECT_ATTR_ID +
            protocol.eOffsetManager.SYNC_OBJECT_ATTR_LEN_LENGTH +
            protocol.eOffsetManager.SYNC_OBJECT_ATTR_DATA_LENGTH) +
        protocol.eOffsetManager.SYNC_OBJECT_ID_LENGTH; // key 갯수 * (Attribute ID + Attribute Len + Attribute Len) + syncObject ID
    }
    return messageBodyLength;
  }

  #createMessage(_msgID: number, params?: number | SyncType | SyncType[]) {
    let len =
      protocol.eOffsetManager.MESSAGE_HEADER_LENGTH +
      protocol.eOffsetManager.BATCH_HEADER_LENGTH;
    // 객체 생성
    if (Array.isArray(params)) {
      len += this.#getArrayParamsLength(params);
      this.#message = Buffer.alloc(len);
      this.#setMessageHeader(_msgID);
      // 모든 객체에 대한 message 생성
      for (const param of params) {
        this.createObjectMessage(param);
      }
    }
    // 싱크
    else if (typeof params === "object") {
      len +=
        Object.keys(params.attributes).length *
          (protocol.eOffsetManager.SYNC_OBJECT_ATTR_ID +
            protocol.eOffsetManager.SYNC_OBJECT_ATTR_LEN_LENGTH +
            protocol.eOffsetManager.SYNC_OBJECT_ATTR_DATA_LENGTH) +
        protocol.eOffsetManager.SYNC_OBJECT_ID_LENGTH; // key 갯수 * (Attribute ID + Attribute Len + Attribute Len) + syncObject ID
      this.#message = Buffer.alloc(len);
      this.#setMessageHeader(_msgID);
      this.createObjectMessage(params);
    }
    // 룸 생성, 룸 입장, 객체 삭제, 룸 정보 요청
    else if (typeof params === "number") {
      len += protocol.eOffsetManager.OFFSET_LENGTH;

      this.#message = Buffer.alloc(len);
      this.#setMessageHeader(_msgID);
      this.#offset = this.#message.writeUInt32LE(params, this.#offset);
    }
    // 룸 전체 정보 요청
    else {
      this.#message = Buffer.alloc(len);
      this.#setMessageHeader(_msgID);
    }
  }

  #initOffset() {
    this.#offset = protocol.eOffsetManager.INIT_OFFSET;
  }

  #setBatchHeader() {
    this.#message.writeUInt32LE(
      this.#offset - protocol.eOffsetManager.BATCH_HEADER_LENGTH,
      0
    );
  }

  setBatch(_msgID: number, _params?: number | SyncType | SyncType[]) {
    this.#createMessage(_msgID, _params);
    this.#setBatchHeader();

    this.#initOffset();

    return this.#message;
  }
}
