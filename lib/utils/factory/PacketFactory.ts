import {Buffer} from "buffer";
import {MessageId} from "../../interfaces/MessageId";
import {ClientProtocolMap} from "../packetHandler/objectMapper/ClientProtocolMap";

export class PacketFactory {
    static generatePacket(messageId:MessageId, params:any):Buffer{
        // @ts-ignore
        const ProtocolClass = ClientProtocolMap[messageId];
        const packetInstance = new ProtocolClass(params)

        return packetInstance.generatePacket();
    }
}