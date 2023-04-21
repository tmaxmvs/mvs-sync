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
// TODO: 1fps 마다 메시지들을 모아서 하나의 batch로 모아줘야 한다. 그에 필요할 것 같은 variables
const DEFAULT_PATCH_RATE = 1000 / 20; // 20fps (50ms)
const DEFAULT_SIMULATION_INTERVAL = 1000 / 60; // 60fps (16.66ms)

export class MessageWriter {
  // TODO: 1fps 마다 메시지들을 모아서 하나의 batch로 모아줘야 한다. 그에 필요할 것 같은 variables
  #patchInterval: boolean = false;
  #delay: number = DEFAULT_SIMULATION_INTERVAL;

  /**
   * @brief message에 적힐 현재 offset. 초기 값 0
   */
  #offset: number = protocol.eOffsetManager.INIT_OFFSET;

  /**
   * @brief 하나의 message Buffer
   */
  #message: Buffer;

  /**
   * @brief 메시지 헤더(message id(4bytes), message length(4bytes)) write
   * @param _msgID 프로토콜 메시지 id.
   */
  #setMessageHeader(_msgID: number) {
    this.#offset = this.#message.writeUInt32LE(_msgID, this.#offset);
    this.#offset = this.#message.writeUInt32LE(
      this.#message.byteLength -
        protocol.eOffsetManager.MESSAGE_HEADER_LENGTH -
        protocol.eOffsetManager.BATCH_HEADER_LENGTH,
      this.#offset
    );
  }

  /**
   * @brief register object나 sync object할 때 message body write
   * @param _params SyncType { syncObjID: number; attributes: { [key: number]: number }; }
   */
  createObjectMessage(_params: SyncType) {
    const isInstanceID = _params.syncObjID > 0x00010000;

    // instanceID가 부여 되어 있으면 sync하는 것으로 간주
    isInstanceID
      ? (this.#offset = this.#message.writeUInt32LE(
          _params.syncObjID,
          this.#offset
        )) // instance ID 부여 받았을 때
      : (this.#offset = this.#message.writeUInt16LE(
          _params.syncObjID,
          this.#offset + 2
        )); // prefab ID만 있을 때

    // object의 key들을 돌면서 해당 attribute들 직렬화
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

  /**
   * @brief object regist 할 때 message body 부분의 총 길이가 얼마나 나올지 계산
   * @param params SyncType
   * @returns message body가 적힐 총 길이
   */
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

  /**
   * @brief 메시지 생성
   * @param _msgID 프로토콜 메시지 id.
   * @param params number일 경우 4bytes의 message body만을 생성. SyncType일 경우 sync 하는 것으로 간주. SyncType[] 일 경우 regist object 하는 것으로 간주
   */
  #createMessage(_msgID: number, params?: number | SyncType | SyncType[]) {
    let len =
      protocol.eOffsetManager.MESSAGE_HEADER_LENGTH +
      protocol.eOffsetManager.BATCH_HEADER_LENGTH;
    // 객체 등록
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

  /**
   * @brief 현재 offset 0으로 초기화
   */
  #initOffset() {
    this.#offset = protocol.eOffsetManager.INIT_OFFSET;
  }

  /**
   * @brief batch의 헤더에 batch 총 길이 write. 현재 batch의 총 길이는 현재 offset - 4(batch header length)
   */
  #setBatchHeader() {
    this.#message.writeUInt32LE(
      this.#offset - protocol.eOffsetManager.BATCH_HEADER_LENGTH,
      0
    );
  }

  // TODO: message를 return 하는 것이 아니라 1fps 마다 message들 모아서 batch 생성하고 해당 batch return 해야 함.
  /**
   * @brief batch 세팅
   * @param _msgID 프로토콜 메시지 id.
   * @param params number일 경우 4bytes의 message body만을 생성. SyncType일 경우 sync 하는 것으로 간주. SyncType[] 일 경우 regist object 하는 것으로 간주
   * @returns write된 message
   */
  setBatch(_msgID: number, _params?: number | SyncType | SyncType[]) {
    this.#createMessage(_msgID, _params);
    this.#setBatchHeader();

    this.#initOffset();

    return this.#message;
  }
}
