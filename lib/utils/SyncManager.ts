import * as protocol from "../interfaces/Dictionary";
import {
  ObjType,
  OtherClientJoined,
  SyncType,
} from "../interfaces/SyncManagerInterfaces";
import { MessageWriter } from "./MessageWriter";

export class SyncManager extends MessageWriter {
  #connectionID: number = 0;
  socket: WebSocket = null;
  initialized: boolean = false;
  #objectList: Map<number, object> = new Map();

  onCreateRoom: (roomNumber: string) => any;
  onJoinRoom: (sceneID: number) => any;
  onCreateObject: (any: any) => any;
  onRemoveObject: (objectID: number) => any;
  onSyncObject: (any: any) => any;
  onOtherClientJoined: (res: OtherClientJoined) => any;

  /**
   *
   * @param _url websocket url
   */
  constructor(_url: string) {
    super();
    this.initialize(_url).then(() => {
      this.initialized = true;
    });
  }

  async initialize(_url: string) {
    if (!this.socket) {
      this.socket = new WebSocket(_url);
    }
    this.socket.binaryType = "arraybuffer";
    this.subscribe();

    return await new Promise((resolve) => {
      const interval = setInterval(() => {
        if (this.#connectionID !== 0) {
          resolve(true);
          clearInterval(interval);
        }
      }, 60);
    });
  }

  // 서버로부터 응답 받기
  subscribe() {
    const subscribe = (e: any) => {
      this.#ReadProtocol(e);
    };

    this.socket.addEventListener("message", subscribe);
  }

  // 서버로부터 받은 응답 해석
  #ReadProtocol(e: any) {
    let dataView = new DataView(e.data, 0);
    let offset = 0;
    const tcpHeader = dataView.getUint32(offset, true);
    offset += protocol.eOffsetManager.BATCH_HEADER_LENGTH;
    const serverData = new Uint32Array(e.data);

    let offsetBound = 0;
    while (offset < tcpHeader) {
      const messageID = dataView.getUint32(offset, true);
      offset += protocol.eOffsetManager.MESSAGE_ID_LENGTH;
      // MessageID
      offsetBound = offsetBound + dataView.getUint32(offset, true) + 8;
      offset += protocol.eOffsetManager.MESSAGE_LEN_LENGTH;

      switch (messageID) {
        // 룸 생성 응답
        case protocol.eMessageID.ROOM_CREATE_RES:
          // 룸 생성 응답
          const roomId: string = serverData[3].toString(16);
          this.#checkCallback(
            this.onCreateRoom,
            "onCreateRoom 콜백을 입력하세요"
          );
          this.onCreateRoom(roomId);
          offset += protocol.eOffsetManager.OFFSET_LENGTH;
          break;
        // 룸 connect 응답
        case protocol.eMessageID.ROOM_JOIN_RES:
          const sceneId: number = Number(serverData[3]);
          this.#checkCallback(this.onJoinRoom, "onJoinRoom 콜백을 입력하세요");
          this.onJoinRoom(sceneId);
          offset += protocol.eOffsetManager.OFFSET_LENGTH;
          break;

        // 객체 생성
        case protocol.eMessageID.CREATE_OBJECT_RES:
          this.#checkCallback(
            this.onCreateObject,
            "onCreateObject 콜백을 입력하세요"
          );
          offset += this.#getCreateObj(offset, dataView, offsetBound);
          break;

        // 객체 삭제
        case protocol.eMessageID.REMOVE_OBJECT_RES:
          this.#checkCallback(
            this.onRemoveObject,
            "onRemoveObject 콜백을 입력하세요"
          );
          const removeObjId = dataView.getUint32(offset, true);
          offset += protocol.eOffsetManager.OFFSET_LENGTH;
          this.onRemoveObject(removeObjId);
          break;

        // 싱크
        case protocol.eMessageID.SYNC_VALUE_RES:
          this.#checkCallback(
            this.onSyncObject,
            "onSyncObject 콜백을 입력하세요"
          );
          offset += this.#getSync(offset, dataView, offsetBound);
          break;

        // 커넥션 ID
        case protocol.eMessageID.CONNECTION_ID_RES:
          this.#connectionID = serverData[3];
          offset += protocol.eOffsetManager.OFFSET_LENGTH;
          break;
        // 룸 리스트
        case protocol.eMessageID.ROOM_LIST_RES:
          const roomList = this.#getRoomList(offset, dataView, offsetBound);
          return new Promise((resolve, reject) => {
            resolve(roomList);
          });
        case protocol.eMessageID.ROOM_INFO_RES:
          const roomInfo = this.#getRoomInfo(offset, dataView, offsetBound);
          return new Promise((resolve, reject) => {
            resolve(roomInfo);
          });
        case protocol.eMessageID.OTHER_CLIENT_JOINED:
          this.#checkCallback(
            this.onOtherClientJoined,
            "onOtherClientJoined 콜백을 입력하세요"
          );
          offset += this.#getOtherClientJoined(offset, dataView);
          break;
        default:
          return 0;
      }
    }
  }

  #checkCallback(callback: any, errorMsg: string) {
    if (!callback) {
      throw new Error(errorMsg);
    }
  }

  #getOtherClientJoined(offset: number, dataView: any): number {
    const clientType = dataView.getUint32(offset, true);
    offset += protocol.eOffsetManager.OFFSET_LENGTH;

    const clientId = dataView.getUint32(offset, true);
    offset += protocol.eOffsetManager.OFFSET_LENGTH;

    let byteView = new Uint8Array(dataView.buffer, offset, 40);
    let charCodes = Array.from(byteView).map((byte) =>
      String.fromCharCode(byte)
    );
    let stringChar = charCodes.join("");
    let clientName = this.#removeInvalidCharacters(stringChar);

    offset += 40;

    const otherClient = {
      clientId,
      clientType,
      clientName,
    };

    this.onOtherClientJoined(otherClient);
    return offset;
  }

  /**
   * 룸 리스트 보내기
   * @params offset: 현재까지 증가했던 오프셋, dataView, offsetBound: 현재까지 오프셋바운드
   * @type number
   */
  #getRoomList(offset: number, dataView: any, offsetBound: number) {
    let roomList: any[] = [];
    let tempList: any = new Object();

    while (offset < 4 + offsetBound) {
      let roomID: number = dataView.getUint32(offset, true);
      offset += protocol.eOffsetManager.OFFSET_LENGTH;
      let byteView = new Uint8Array(dataView.buffer, offset, 80);
      let charCodes = Array.from(byteView).map((byte) =>
        String.fromCharCode(byte)
      );
      let stringChar = charCodes.join("");
      let roomName = this.#removeInvalidCharacters(stringChar);
      offset += 80;

      // TODO: 준엽님 player Number 숫자 제대로 안나와요 ㅠ
      let playerNumber: number = dataView.getUint32(offset, true);
      offset += protocol.eOffsetManager.OFFSET_LENGTH;

      tempList = {
        RoomID: roomID,
        RoomName: roomName,
        PlayerNumber: playerNumber,
      };
      roomList.push(tempList);
    }
    // RoomList

    return roomList;
  }

  #removeInvalidCharacters(s: string) {
    const tidy =
      typeof s === "string" ? s.replace(/[\x00-\x1F\x7F-\xA0]+/g, "") : s;
    return tidy;
  }

  /**
   * 특정 룸 정보 보내기
   * @params offset: 현재까지 증가했던 오프셋, dataView, offsetBound: 현재까지 오프셋바운드
   * @type number
   */
  #getRoomInfo(offset: number, dataView: any, offsetBound: number): number {
    let roomInfo: any = new Object();

    while (offset < 4 + offsetBound) {
      let roomID: number = dataView.getUint32(offset + 4, true);
      offset += protocol.eOffsetManager.OFFSET_LENGTH + 4;

      let byteView = new Uint8Array(dataView.buffer, offset, 80);
      let charCodes = Array.from(byteView).map((byte) =>
        String.fromCharCode(byte)
      );
      let stringChar = charCodes.join("");
      let roomName = this.#removeInvalidCharacters(stringChar);
      offset += 80;

      let playerNumber: number = dataView.getUint32(offset, true);
      offset += protocol.eOffsetManager.OFFSET_LENGTH;

      let playerList: any[] = [];
      if (playerNumber > 0) {
        for (let i = 0; i < playerNumber; i++) {
          let byteView2 = new Uint8Array(dataView.buffer, offset, 40);
          let charCodes2 = Array.from(byteView2).map((byte) =>
            String.fromCharCode(byte)
          );
          let stringChar2 = charCodes2.join("");
          let playerName = this.#removeInvalidCharacters(stringChar2);
          offset += 40;

          let playerID: number = dataView.getUint32(offset, true);
          offset += protocol.eOffsetManager.OFFSET_LENGTH;

          playerList.push({
            PlayerID: playerID,
            PlayerName: playerName,
          });
        }
      }

      roomInfo = {
        roomID,
        roomName,
        players: playerNumber,
        playerList,
      };
    }

    return roomInfo;
  }

  /**
   *객체 생성 보내기
   * @params offset: 현재까지 증가했던 오프셋, dataView, offsetBound: 현재까지 오프셋바운드
   * @type number
   */
  #getCreateObj(offset: number, dataView: any, offsetBound: number): number {
    let ObjId = dataView.getUint32(offset, true);
    offset += protocol.eOffsetManager.OFFSET_LENGTH;

    let OwnerId = dataView.getUint32(offset, true);
    offset += protocol.eOffsetManager.OFFSET_LENGTH;

    let obj = new Object();
    const attributes: any = new Object();

    while (offset < 4 + offsetBound) {
      let attributeId = dataView.getUint32(offset, true);
      offset += protocol.eOffsetManager.OFFSET_LENGTH;
      let attributeSize = dataView.getUint32(offset, true);
      offset += protocol.eOffsetManager.OFFSET_LENGTH;
      let attributeData = dataView.getFloat64(offset, true);
      offset += attributeSize;

      attributes[attributeId & 0x00fffff] = attributeData;
      obj = {
        objId: ObjId,
        ownerId: OwnerId,
        attributes,
      };
    }
    this.onCreateObject([obj]);
    return offset;
  }

  /**
   *싱크 보내기
   * @params offset: 현재까지 증가했던 오프셋, dataView, offsetBound: 현재까지 오프셋바운드
   * @type number
   */
  #getSync(offset: number, dataView: any, offsetBound: number): number {
    let syncObjId = dataView.getUint32(offset, true);
    offset += protocol.eOffsetManager.OFFSET_LENGTH;
    const syncAttributes: any = new Object();

    while (offset < 4 + offsetBound) {
      let attributeId = dataView.getUint32(offset, true);
      offset += protocol.eOffsetManager.OFFSET_LENGTH;
      let attributeData = dataView.getFloat64(offset, true);
      offset += 16;
      syncAttributes[attributeId & 0x00fffff] = attributeData;
    }

    const syncObj = new Object({
      objId: syncObjId,
      attributes: syncAttributes,
    });

    this.onSyncObject([syncObj]);
    return offset;
  }

  /**
   *
   * @returns number : your connection ID
   */
  getConnectionID() {
    return this.#connectionID;
  }

  /**
   *
   * @param sceneID create scene by id
   * @type number
   */
  reqCreateAndJoinRoom(sceneID: number) {
    this.socket.send(
      this.setBatch(protocol.eMessageID.ROOM_CREATE_REQ, sceneID)
    );
  }

  /**
   *
   * @param roomNumber join room by room number
   * @type number
   */
  reqJoinRoom(roomNumber: number) {
    this.socket.send(
      this.setBatch(protocol.eMessageID.ROOM_JOIN_REQ, roomNumber)
    );
  }

  /**
   * 씬 생성이 끝나면 보낸다. 서버에서는 클라이언트에게 동기화할 객체 정보들을 모두 보내준다.
   */
  sceneLoadedComplete() {
    this.socket.send(this.setBatch(protocol.eMessageID.SCENE_LOAD_COMPLETE));
  }

  /**
   *
   * @param params 생성하고자 하는 객체[]
   * @tpye SyncType[] : { objID: number; attributes: { [key: number]: number };}[]
   * - objID : 클래스의 고유 넘버
   * - attributes : 해당 클래스 속성.
   */
  reqCreateObject(params: SyncType[]) {
    this.socket.send(
      this.setBatch(protocol.eMessageID.CREATE_OBJECT_REQ, params)
    );
  }

  /**
   *
   * @param objectID prefab number(unique number of the class?) + instance number
   */
  reqRemoveObject(objectID: number) {
    this.socket.send(
      this.setBatch(protocol.eMessageID.REMOVE_OBJECT_REQ, objectID)
    );
  }

  /**
   *
   * @param obj 동기화 하고 싶은 객체
   * @tpye SyncType : { objID: number; attributes: { [key: number]: number };}
   * - objID : 클래스의 고유 넘버
   * - attributes : 해당 클래스 속성.
   */
  reqSyncObject(obj: SyncType) {
    this.socket.send(this.setBatch(protocol.eMessageID.SYNC_VALUE_REQ, obj));
  }
  /**
   *
   * @param params 생성하고자 하는 객체[]
   * @tpye SyncType[] : { objID: number; attributes: { [key: number]: number };}[]
   * - objID : 클래스의 고유 넘버
   * - attributes : 해당 클래스 속성.
   */
  reqCreatePublicObject(params: SyncType[]) {
    this.socket.send(
      this.setBatch(protocol.eMessageID.CREATE_PUBLIC_OBJECT_REQ, params)
    );
  }

  reqRoomInfo(roomNumber: number, cb: Function) {
    const isWebSocketOpen = this.socket.readyState === WebSocket.OPEN;
    if (isWebSocketOpen) {
      this.socket.send(
        this.setBatch(protocol.eMessageID.ROOM_INFO_REQ, roomNumber)
      );
    } else {
      this.socket.onopen = () => {
        this.socket.send(this.setBatch(protocol.eMessageID.ROOM_LIST_REQ));
      };
    }

    const getRoomInfo = (e: any) => {
      const response = this.#ReadProtocol(e);
      if (typeof response !== "number" && typeof response !== "undefined") {
        response.then((res) => {
          response instanceof Object && cb(response);
          this.socket.removeEventListener("message", getRoomInfo);
        });
      }
    };

    this.socket.addEventListener("message", getRoomInfo);
  }

  reqRoomListInfo(cb: Function) {
    const isWebSocketOpen = this.socket.readyState === WebSocket.OPEN;
    if (isWebSocketOpen) {
      this.socket.send(this.setBatch(protocol.eMessageID.ROOM_LIST_REQ));
    } else {
      this.socket.onopen = () => {
        const interval = setInterval(() => {
          if (this.#connectionID !== 0) {
            this.socket.send(this.setBatch(protocol.eMessageID.ROOM_LIST_REQ));
            clearInterval(interval);
          }
        }, 60);
      };
    }

    const getRoomListInfo = (e: any) => {
      const response = this.#ReadProtocol(e);
      if (typeof response !== "number" && typeof response !== "undefined") {
        response.then((res) => {
          Array.isArray(res) && cb(res);
          this.socket.removeEventListener("message", getRoomListInfo);
        });
      }
    };

    this.socket.addEventListener("message", getRoomListInfo);
  }

  /**
   *
   * @param arr 당신이 동기화하고 싶은 object들의 배열 (prefabID(=objID) 및 속성들)
   */
  syncObject(arr: ObjType[]) {
    for (const iterator of arr) {
      this.#objectList.set(iterator.objID, iterator);
    }
  }

  /**
   *
   * @returns 동기화 하려고 하는 object에 관한 map 반환
   */
  getObjectList() {
    return this.#objectList;
  }

  /**
   *
   * @param 혹시라도 동기화에 추가하고 싶은 오브젝트가 생길 수도 있기 떄문에..
   */
  setObject(obj: ObjType) {
    this.#objectList.set(obj.objID, obj);
  }

  /**
   *
   * @param objID Map에서 동기화를 빼고 싶은 object
   */
  deleteObject(objID: number) {
    this.#objectList.delete(objID);
  }

  /**
   * session close
   */
  closeConnection() {
    this.socket.close();
  }
}
