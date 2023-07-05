import {MessageId} from "../../interfaces/MessageId";
import {PacketGenerator} from "../packetHandler/PacketGenerator";
import {Buffer} from "buffer";
import {GroupId} from "./StructBuffer";
const pb = require( "../protoBuf/Protocol_pb")

export abstract class ClientProtocol{
    protected constructor() {
        this.setMessageId()
        this.setMessage()
    }
    message:any
    messageId:MessageId

    abstract setMessageId():void
    abstract setMessage():void
    generatePacket():Buffer{
        return PacketGenerator.generatePacket(this.messageId, this.message.serializeBinary())
    }
}

export class ClientHeartBeat extends ClientProtocol{
    constructor() {
        super();
    }
    setMessageId() {
        this.messageId = MessageId.PKT_C_HEART_BEAT
    }

    setMessage(): void {
        this.message = new pb.C_HEART_BEAT();
    }
}

export class ClientRoomCreate extends ClientProtocol{
    #appId:Number
    #waplRoomId:Number
    #name:String
    /**
    @params waplRoomId와 name을 가지고 있는 배열
     */
    constructor(waplRoomIdAndName:any[]) {
        super();
        this.#appId = waplRoomIdAndName[0];
        this.#waplRoomId = waplRoomIdAndName[1];
        this.#name = waplRoomIdAndName[2]
    }
    setMessage(): void {
        this.message = new pb.C_TEST_ROOM_CREATE();
    }

    setMessageId(): void {
        this.messageId = MessageId.PKT_C_TEST_ROOM_CREATE;
    }
    generatePacket(): Buffer {
        this.message.setAppid(this.#appId);
        this.message.setWaplroomid(this.#waplRoomId);
        this.message.setName(this.#name);
        return super.generatePacket();
    }

}

export class ClientRoomList extends ClientProtocol{
    constructor() {
        super();
    }
    setMessage(): void {
        this.message = new pb.C_TEST_ROOM_LIST();
    }

    setMessageId(): void {
        this.messageId = MessageId.PKT_C_TEST_ROOM_LIST;
    }
}

export class ClientRoomJoin extends ClientProtocol{
    #waplRoomId:Number
    constructor(waplRoomId:Number) {
        super();
        this.#waplRoomId = waplRoomId;
    }
    setMessage(): void {
        this.message = new pb.C_ROOM_JOIN();
    }

    setMessageId(): void {
        this.messageId = MessageId.PKT_C_ROOM_JOIN;
    }
    generatePacket(): Buffer {
        this.message.setWaplroomid(this.#waplRoomId)
        return super.generatePacket();
    }
}

export class ClientPlayerId extends ClientProtocol{
    constructor() {
        super();
    }
    setMessage(): void {
        this.message = new pb.C_PLAYER_ID();
    }

    setMessageId(): void {
        this.messageId = MessageId.PKT_C_PLAYER_ID;
    }
}

export class ClientGroupList extends ClientProtocol{
    constructor() {
        super();
    }
    setMessage(): void {
        this.message = new pb.C_GROUP_LIST();
    }

    setMessageId(): void {
        this.messageId = MessageId.PKT_C_GROUP_LIST
    }
}

export class ClientGroupJoin extends ClientProtocol{

    #sceneNumber:number
    #channelId:number
    constructor(groupJoinInfo:number[]) {
        super();
        this.#sceneNumber = groupJoinInfo[0]
        this.#channelId = groupJoinInfo[1]
    }
    setMessage(): void {
        this.message = new pb.C_GROUP_JOIN();
    }

    setMessageId(): void {
        this.messageId = MessageId.PKT_C_GROUP_JOIN
    }
    generatePacket(): Buffer {
        this.message.setGroupid(GroupId.getInstance(this.#sceneNumber, this.#channelId));
        return super.generatePacket();
    }
}

export class ClientInitialObject extends ClientProtocol{
    constructor() {
        super();
    }
    setMessage(): void {
        this.message = new pb.C_INITIAL_OBJECTS();
    }

    setMessageId(): void {
        this.messageId = MessageId.PKT_C_INITIAL_OBJECTS
    }
}

export class ClientAddNetworkObject extends ClientProtocol{
    #objectInfosList:Buffer[];

    constructor(object:Buffer[]) {
        super();
        this.#objectInfosList = object
    }

    setMessage(): void {
        this.message = new pb.C_ADD_NETWORK_OBJECTS();
    }

    setMessageId(): void {
        this.messageId = MessageId.PKT_C_ADD_NETWORK_OBJECTS
    }

    generatePacket(): Buffer {
        this.message.setObjectinfosList(this.#objectInfosList);
        return super.generatePacket();
    }
}

export class ClientRemoveNetworkObject extends ClientProtocol{
    #objectInfosList:Buffer[];
    constructor(object:Buffer[]) {
        super();
        this.#objectInfosList = object
    }

    setMessage(): void {
        this.message = new pb.C_REMOVE_NETWORK_OBJECTS();
    }

    setMessageId(): void {
        this.messageId = MessageId.PKT_C_REMOVE_NETWORK_OBJECTS
    }

    generatePacket(): Buffer {
        this.message.setObjectinfosList(this.#objectInfosList);
        return super.generatePacket();
    }
}

export class ClientUpdateNetworkObject extends ClientProtocol{
    #objectInfosList:Buffer[];
    constructor(object:Buffer[]) {
        super();
        this.#objectInfosList = object
    }

    setMessage(): void {
        this.message = new pb.C_UPDATE_NETWORK_OBJECTS();
    }

    setMessageId(): void {
        this.messageId = MessageId.PKT_C_UPDATE_NETWORK_OBJECTS
    }

    generatePacket(): Buffer {
        this.message.setObjectinfosList(this.#objectInfosList);
        return super.generatePacket();
    }
}

export class ClientChangeObjectOwner extends ClientProtocol{
    #objectInfosList:Buffer[];
    #playerId:Number
    constructor(object:Buffer[], playerId:number) {
        super();
        this.#objectInfosList = object
        this.#playerId = playerId
    }

    setMessage(): void {
        this.message = new pb.C_CHANGE_OBJECTS_OWNER();
    }

    setMessageId(): void {
        this.messageId = MessageId.PKT_C_CHANGE_OBJECTS_OWNER
    }

    generatePacket(): Buffer {
        this.message.setObjectinfosList(this.#objectInfosList);
        this.message.setNewownerplayerid(this.#playerId);
        return super.generatePacket();
    }
}

export class ClientChat extends ClientProtocol {
    #message:String
    constructor(message:String) {
        super();
        this.#message=message
    }
    setMessage(): void {
        this.message = new pb.C_CHAT();
    }

    setMessageId(): void {
        this.messageId = MessageId.PKT_C_CHAT;
    }
    generatePacket(): Buffer {
        this.message.setMsg(this.#message);
        return super.generatePacket();
    }
}
