import {MessageId} from "../interfaces/MessageId"
import {PacketFactory} from "./factory/PacketFactory";
import {PacketReceiver} from "./packetHandler/PacketReciever";
import {Buffer} from "buffer";
import WebSocket from "ws";
const pb = require("./protoBuf/Protocol_pb");

export class SyncManager {
    // static socket: WebSocket = new WebSocket(process.env.REACT_APP_SERVER_URL)
    static socket: WebSocket = new WebSocket('ws://mvs-server.kro.kr:30080/')
    static syncManager: SyncManager = new SyncManager()
    #connectionID: number = 0;

    /**
     * @brief 각 컴포넌트에서 재정의 할 리스너
     * @param e 서버로부터 도착한 event
     */
    onHeartBeat:(e:any) => any
    onRoomCreate:(e:any) => any
    onRoomList:(e:any) => any
    onRoomJoin:(e:any) => any
    onPlayerId:(e:any) => any
    onGroupList:(e:any) => any
    onGroupJoin:(e:any) => any
    onInitialObjects:(e:any) => any
    onOtherClientJoined:(e:any) => any
    onAddNetworkObject:(e:any) => any
    onRemoveNetworkObject:(e:any) => any
    onUpdateNetworkObject:(e:any) => any
    onChangeObjectsOwner:(e:any) => any
    onChat:(e:any) => any

    /**
     * @brief protected constructor
     */
    protected constructor() {
        this.#initialize().then(() => SyncManager.syncManager = this);
    }

    static getInstance() {
        return SyncManager.syncManager
    }
    /**
     * @brief 서버로 웹소켓 연결 및 listening
     */
    async #initialize() {
        SyncManager.socket.binaryType = "arraybuffer";
        this.#subscribe();

        return await new Promise((resolve) => {
            const interval = setInterval(() => {
                if (this.#connectionID !== 0) {
                    resolve(true);
                    clearInterval(interval);
                }
            }, 60);
        });
    }

    /**
     * @brief 서버로부터 응답 받기
     */
    #subscribe() {
        const subscribe = (e: any) => {
            this.#ReadProtocol(e);
        };
        SyncManager.socket.addEventListener("message", subscribe);
    }

    /**
     * @brief 서버로부터 받은 응답을 해석해 각 컴포넌트에서 메소드를 재정의 해 사용
     * @param e 서버로부터 받은 binary code
     */
    #ReadProtocol(e: any) {
        const packetList = PacketReceiver.receive(e.data)
        for (const packet of packetList) {
            this.#onReceivePacket(packet.messageId, packet.messageBody)
        }
    }

    /**
     * @brief MessageId에 따라 분기해 동작
     * @param receiveMessageId 서버로부터 받은 MessageId
     * @param messageBody 해석할 MessageBody
     */
    #onReceivePacket = (receiveMessageId: MessageId, messageBody: any) => {
        const handlerMap = {
            [MessageId.PKT_S_HEART_BEAT]: () => this.onHeartBeat(messageBody),
            [MessageId.PKT_S_TEST_ROOM_CREATE]: () => this.onRoomCreate(pb.S_TEST_ROOM_CREATE.deserializeBinary(messageBody)),
            [MessageId.PKT_S_TEST_ROOM_LIST]: () => this.onRoomList(pb.S_TEST_ROOM_LIST.deserializeBinary(messageBody)),
            [MessageId.PKT_S_ROOM_JOIN]: () => this.onRoomJoin(pb.S_ROOM_JOIN.deserializeBinary(messageBody)),
            [MessageId.PKT_S_PLAYER_ID]: () => this.onPlayerId(pb.S_PLAYER_ID.deserializeBinary(messageBody)),
            [MessageId.PKT_S_GROUP_LIST]: () => this.onGroupList(pb.S_GROUP_LIST.deserializeBinary(messageBody)),
            [MessageId.PKT_S_GROUP_JOIN]: () => this.onGroupJoin(pb.S_GROUP_JOIN.deserializeBinary(messageBody)),
            [MessageId.PKT_S_INITIAL_OBJECTS]: () => this.onInitialObjects(pb.S_INITIAL_OBJECTS.deserializeBinary(messageBody)),
            [MessageId.PKT_S_OTHER_CLIENT_JOINED]: () => this.onOtherClientJoined(pb.S_OTHER_CLIENT_JOINED.deserializeBinary(messageBody)),
            [MessageId.PKT_S_ADD_NETWORK_OBJECTS]: () => this.onAddNetworkObject(pb.S_ADD_NETWORK_OBJECTS.deserializeBinary(messageBody)),
            [MessageId.PKT_S_REMOVE_NETWORK_OBJECTS]: () => this.onRemoveNetworkObject(pb.S_REMOVE_NETWORK_OBJECTS.deserializeBinary(messageBody)),
            [MessageId.PKT_S_UPDATE_NETWORK_OBJECTS]: () => this.onUpdateNetworkObject(pb.S_UPDATE_NETWORK_OBJECTS.deserializeBinary(messageBody)),
            [MessageId.PKT_S_CHANGE_OBJECTS_OWNER]: () => this.onChangeObjectsOwner(pb.S_CHANGE_OBJECTS_OWNER.deserializeBinary(messageBody)),
            [MessageId.PKT_S_CHAT]: () => this.onChat(pb.S_CHAT.deserializeBinary(messageBody)),
        };

        // @ts-ignore
        const handler = handlerMap[receiveMessageId] || (() => {});
        handler();
    };

    /**
     * @brief 패킷을 생성해 서버로 보냄
     * @param messageId
     * @param params in messageBody
     */
    #sendPacket(messageId:MessageId, params:any) {
        SyncManager.socket.send(PacketFactory.generatePacket(messageId, params));
    }

    /**
     * @brief HEART_BEAT
     */
    reqHeatBeat(){
        return this.#sendPacket(MessageId.PKT_C_HEART_BEAT, null);
    }

    /**
     * @brief 서버로 RoomList 요청
     */
    reqRoomList() {
        return this.#sendPacket(MessageId.PKT_C_TEST_ROOM_LIST, null);
    }

    /**
     * @brief 서버로 GroupList 요청
     */
    reqGroupList() {
        return this.#sendPacket(MessageId.PKT_C_GROUP_LIST, null);
    }

    /**
     * @brief 서버로부터 PlayerId 받아옴
     */
    reqPlayerId() {
        return this.#sendPacket(MessageId.PKT_C_PLAYER_ID, null);
    }

    /**
     * @brief 서버로 사용할 ObjectInfos 요청
     */
    reqInitialObjects() {
        return this.#sendPacket(MessageId.PKT_C_INITIAL_OBJECTS, null);
    }

    /**
     * @brief 서버로 룸 생성 요청
     */
    reqCreateRoom(appID: number, roomID: number, name: string) {
        return this.#sendPacket(MessageId.PKT_C_TEST_ROOM_CREATE, [appID, roomID, name]);
    }

    /**
     * @brief 서버로 룸 입장 요청
     */
    reqJoinRoom(roomNumber: number) {
        return this.#sendPacket(MessageId.PKT_C_ROOM_JOIN, roomNumber);
    }

    /**
     * @brief 서버로 그룹 입장 요청
     */
    reqJoinGroup(sceneNumber: number, channelId: number) {
        return this.#sendPacket(MessageId.PKT_C_GROUP_JOIN, [sceneNumber, channelId]);
    }

    /**
     * @brief 서버로 객체 생성 요청
     */
    reqCreateObject(params: Buffer[]) {
        return this.#sendPacket(MessageId.PKT_C_ADD_NETWORK_OBJECTS, params);
    }

    /**
     * @brief 서버로 객체 제거 요청
     */
    reqRemoveObject(params: Buffer[]) {
        return this.#sendPacket(MessageId.PKT_C_REMOVE_NETWORK_OBJECTS, params);
    }

    /**
     * @brief 서버로 객체정보 갱신 요청
     */
    reqUpdateObject(params: Buffer[]){
        return this.#sendPacket(MessageId.PKT_C_UPDATE_NETWORK_OBJECTS, params);
    }

    /**
     * @brief 서버로 객체 소유권 갱신 요청
     */
    reqChangeObjectOwner(params: Buffer[]){
        return this.#sendPacket(MessageId.PKT_C_CHANGE_OBJECTS_OWNER, params);
    }

    /**
     * @brief 서버로 채팅 요청
     */
    reqChat(msg:string){
        return this.#sendPacket(MessageId.PKT_C_CHAT, msg);
    }

    /**
     * @returns number : your connection ID
     */
    getConnectionID() {
        return this.#connectionID;
    }

    /**
     * @brief session close
     */
    closeConnection() {
        this.#connectionID = 0;
        SyncManager.socket.close();
    }
}
