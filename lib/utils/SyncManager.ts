import * as protocol from "../interfaces/Dictionary";
import { MessageWriter } from "./MessageWriter";

interface SyncType {
  objID: number;
  attributes: { [key: number]: number };
}

export class SyncManager extends MessageWriter {
  #connectionID: number;
  socket: WebSocket;

  onCreateRoom: (roomNumber: string) => any;
  onJoinRoom: (sceneID: number) => any;
  onCreateObject: (any: any) => any;
  onRemoveObject: (objectID: number) => any;
  onSyncObject: (any: any) => any;

  /**
   *
   * @param _url websocket url
   */
  constructor(_url: string) {
    super();
    this.socket = new WebSocket(_url);
    this.socket.binaryType = "arraybuffer";
  }

  listner() {
    this.socket.onmessage = (e) => {
      this.ReadProtocol(e);
    };
  }

  ReadProtocol(e: any) {
    const serverData = new Uint32Array(e.data);
    const objList: any = [];

    let dataView = new DataView(e.data, 0);
    let offset = 0;
    let offsetBound = 0;
    const tcpHeader = dataView.getUint32(offset, true);
    offset += protocol.eOffsetManager.BATCH_HEADER_LENGTH;

    while (offset < tcpHeader) {
      const messageID = dataView.getUint32(offset, true);
      offset += protocol.eOffsetManager.MESSAGE_ID_LENGTH;

      offsetBound = offsetBound + dataView.getUint32(offset, true) + 8;
      offset += protocol.eOffsetManager.MESSAGE_LEN_LENGTH;

      switch (messageID) {
        case protocol.eMessageID.ROOM_CREATE_RES:
          const roomId: string = serverData[3].toString(16);
          this.onCreateRoom(roomId);
          offset += protocol.eOffsetManager.OFFSET_LENGTH;
          break;

        case protocol.eMessageID.ROOM_CONNECT_RES:
          const sceneId: number = Number(serverData[3]);
          this.onJoinRoom(sceneId);
          offset += protocol.eOffsetManager.OFFSET_LENGTH;
          break;

        case protocol.eMessageID.CREATE_OBJECT_RES:
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
          break;

        case protocol.eMessageID.REMOVE_OBJECT_RES:
          const removeObjId = dataView.getUint32(offset, true);
          offset += protocol.eOffsetManager.OFFSET_LENGTH;
          this.onRemoveObject(removeObjId);
          break;

        case protocol.eMessageID.SYNC_VALUE_RES:
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
          break;

        case protocol.eMessageID.CONNECTION_ID_RES:
          this.#connectionID = serverData[3];
          offset += protocol.eOffsetManager.OFFSET_LENGTH;
          break;
        case protocol.eMessageID.ROOM_INFO_RES:
          console.log("room info res");
          break;
        case protocol.eMessageID.ALL_ROOM_INFO_RES:
          console.log("all room info res");
          break;
        case protocol.eMessageID.CREATE_PUBLIC_OBJECT_REQ:
          console.log("create public object res");
          break;
        default:
          return 0;
      }
    }
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

  reqAllRoomInfo() {
    this.setMessageBodyZero();
    this.socket.send(this.setBatch(protocol.eMessageID.ALL_ROOM_INFO_REQ));
  }

  closeConnection() {
    this.socket.close();
  }
}
