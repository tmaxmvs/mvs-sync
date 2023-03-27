import * as protocol from "../interfaces/Dictionary";
import { MessageWriter } from "./MessageWriter";

interface SyncType {
  objID: number;
  attributes: { [key: number]: number };
}

interface objType {
  objID: number;
  [key: string]: any;
}

export class SyncManager extends MessageWriter {
  #connectionID: number;
  socket: WebSocket;

  #objectList: Map<number, object> = new Map();

  onCreateRoom: (roomNumber: string) => any;
  onJoinRoom: (sceneID: number) => any;
  onCreateObject: (any: any) => any;
  onRemoveObject: (objectID: number) => any;
  onSyncObject: (any: any) => any;
  onRoomInfo: (any: any) => any;
  onRoomListInfo: (any: any) => any;

  /**
   *
   * @param _url websocket url
   */
  constructor(_url: string) {
    super();
    this.socket = new WebSocket(_url);
    this.socket.binaryType = "arraybuffer";
  }

  // 서버로부터 응답 받기
  listner() {
    this.socket.onmessage = (e) => {
      this.ReadProtocol(e);
    };
  }

  // 서버로부터 받은 응답 해석
  ReadProtocol(e: any) {
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
      // console.log(serverData[1].toString(16))
      offsetBound = offsetBound + dataView.getUint32(offset, true) + 8;
      offset += protocol.eOffsetManager.MESSAGE_LEN_LENGTH;

      switch (messageID) {
        // 룸 생성 응답
        case protocol.eMessageID.ROOM_CREATE_RES:
          // 룸 생성 응답
          const roomId: string = serverData[3].toString(16);
          this.onCreateRoom(roomId);
          offset += protocol.eOffsetManager.OFFSET_LENGTH;
          break;
        // 룸 connect 응답
        case protocol.eMessageID.ROOM_CONNECT_RES:
          const sceneId: number = Number(serverData[3]);
          this.onJoinRoom(sceneId);
          offset += protocol.eOffsetManager.OFFSET_LENGTH;
          break;

        // 객체 생성
        case protocol.eMessageID.CREATE_OBJECT_RES:
          offset += this.getCreateObj(offset, dataView, offsetBound);
          break;

        // 객체 삭제
        case protocol.eMessageID.REMOVE_OBJECT_RES:
          const removeObjId = dataView.getUint32(offset, true);
          offset += protocol.eOffsetManager.OFFSET_LENGTH;
          this.onRemoveObject(removeObjId);
          break;

        // 싱크
        case protocol.eMessageID.SYNC_VALUE_RES:
          offset += this.getSync(offset, dataView, offsetBound);
          break;

        // 커넥션 ID
        case protocol.eMessageID.CONNECTION_ID_RES:
          this.#connectionID = serverData[3];
          offset += protocol.eOffsetManager.OFFSET_LENGTH;
          break;
        // 룸 리스트
        case protocol.eMessageID.ROOM_LIST_RES:
          offset += this.getRoomList(offset, dataView, offsetBound);
          break;
        case protocol.eMessageID.ROOM_INFO_RES:
          offset += this.getRoomInfo(offset, dataView, offsetBound);
          break;
        default:
          return 0;
      }
    }
  }

  /**
   * 룸 리스트 보내기
   * @params offset: 현재까지 증가했던 오프셋, dataView, offsetBound: 현재까지 오프셋바운드
   * @type number
   */
  getRoomList(offset: number, dataView: any, offsetBound: number): number {
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
      let roomName = this.tidy(stringChar);
      offset += 80;

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
    this.onRoomListInfo([roomList]);
    return offset;
  }

  tidy(s: string) {
    const tidy =
      typeof s === "string" ? s.replace(/[\x00-\x1F\x7F-\xA0]+/g, "") : s;
    return tidy;
  }

  /**
   * 특정 룸 정보 보내기
   * @params offset: 현재까지 증가했던 오프셋, dataView, offsetBound: 현재까지 오프셋바운드
   * @type number
   */
  getRoomInfo(offset: number, dataView: any, offsetBound: number): number {
    let roomInfo: any = new Object();

    while (offset < 4 + offsetBound) {
      let roomID: number = dataView.getUint32(offset + 4, true);
      offset += protocol.eOffsetManager.OFFSET_LENGTH + 4;

      let byteView = new Uint8Array(dataView.buffer, offset, 80);
      let charCodes = Array.from(byteView).map((byte) =>
        String.fromCharCode(byte)
      );
      let stringChar = charCodes.join("");
      let roomName = this.tidy(stringChar);
      offset += 80;

      let playerNumber: number = dataView.getUint32(offset, true);
      offset += protocol.eOffsetManager.OFFSET_LENGTH;

      let playerLst: any[] = [];
      if (playerNumber > 0) {
        for (let i = 0; i < playerNumber; i++) {
          let byteView2 = new Uint8Array(dataView.buffer, offset, 40);
          let charCodes2 = Array.from(byteView2).map((byte) =>
            String.fromCharCode(byte)
          );
          let stringChar2 = charCodes2.join("");
          let playerName = this.tidy(stringChar2);
          offset += 40;

          let playerID: number = dataView.getUint32(offset, true);
          offset += protocol.eOffsetManager.OFFSET_LENGTH;

          playerLst.push({
            PlayerID: playerID,
            PlayerName: playerName,
          });
        }
      }

      roomInfo = {
        RoomID: roomID,
        RoomName: roomName,
        PlayerNumber: playerNumber,
        PlayerLst: playerLst,
      };
    }
    // RoomInfo
    this.onRoomInfo([roomInfo]);
    return offset;
  }

  /**
   *객체 생성 보내기
   * @params offset: 현재까지 증가했던 오프셋, dataView, offsetBound: 현재까지 오프셋바운드
   * @type number
   */
  getCreateObj(offset: number, dataView: any, offsetBound: number): number {
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
  getSync(offset: number, dataView: any, offsetBound: number): number {
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
    this.setMessageBodyOne(sceneID);
    this.socket.send(this.setBatch(protocol.eMessageID.ROOM_CREATE_REQ));
  }

  /**
   *
   * @param roomNumber join room by room number
   * @type number
   */
  reqJoinRoom(roomNumber: number) {
    this.setMessageBodyOne(roomNumber);
    this.socket.send(this.setBatch(protocol.eMessageID.ROOM_CONNECT_REQ));
  }

  /**
   * 씬 생성이 끝나면 보낸다. 서버에서는 클라이언트에게 동기화할 객체 정보들을 모두 보내준다.
   */
  sceneLoadedComplete() {
    this.setMessageBodyZero();
    this.socket.send(this.setBatch(protocol.eMessageID.SCENE_LOAD_COMPLETE));
  }

  /**
   *
   * @param params 생성하고자 하는 객체[]
   * @tpye SyncType[] : { objID: number; attributes: { [key: number]: number };}[]
   * - objID : 클래스의 고유 넘버
   * - attributes : 해당 클래스 속성.
   */
  reqCreateObject(params: SyncType[] | any[]) {
    this.setMessageBodyObject(params);
    this.socket.send(this.setBatch(protocol.eMessageID.CREATE_OBJECT_REQ));
  }

  /**
   *
   * @param objectID prefab number(unique number of the class?) + instance number
   */
  reqRemoveObject(objectID: number) {
    this.setMessageBodyOne(objectID);
    this.socket.send(this.setBatch(protocol.eMessageID.REMOVE_OBJECT_REQ));
  }

  /**
   *
   * @param obj 동기화 하고 싶은 객체
   * @tpye SyncType : { objID: number; attributes: { [key: number]: number };}
   * - objID : 클래스의 고유 넘버
   * - attributes : 해당 클래스 속성.
   */
  reqSyncObject(obj: SyncType) {
    this.setMessageBodySync(obj);
    this.socket.send(this.setBatch(protocol.eMessageID.SYNC_VALUE_REQ));
  }
  /**
   *
   * @param params 생성하고자 하는 객체[]
   * @tpye SyncType[] : { objID: number; attributes: { [key: number]: number };}[]
   * - objID : 클래스의 고유 넘버
   * - attributes : 해당 클래스 속성.
   */
  reqCreatePublicObject(params: SyncType[] | any[]) {
    this.setMessageBodyObject(params);
    this.socket.send(
      this.setBatch(protocol.eMessageID.CREATE_PUBLIC_OBJECT_REQ)
    );
  }

  reqRoomInfo(roomNumber: number) {
    this.setMessageBodyOne(roomNumber);
    this.socket.send(this.setBatch(protocol.eMessageID.ROOM_INFO_REQ));
  }

  reqRoomListInfo() {
    this.setMessageBodyZero();
    this.socket.send(this.setBatch(protocol.eMessageID.ROOM_LIST_REQ));
  }

  /**
   *
   * @param arr 당신이 동기화하고 싶은 object들의 배열 (prefabID(=objID) 및 속성들)
   */
  syncObject(arr: objType[]) {
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
  setObject(obj: objType) {
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
