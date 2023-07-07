import {HeaderOffsetManager} from "../../interfaces/OffsetLength";
import {MessageId} from "../../interfaces/MessageId";
import {Buffer} from "buffer";

type Packet = {
    messageId:MessageId,
    packetSize:number
    messageBody:any
}
export class PacketReceiver {
    private constructor() { } // private constructor to prevent instantiation

    static receive(data: Buffer): Packet[] {

        let packetList = []
        let bufferData = data
        while(bufferData.byteLength>0){
            // @ts-ignore
            const dataView = new DataView(bufferData);
            const messageId = dataView.getInt16(HeaderOffsetManager.MESSAGE_ID_OFFSET, true);
            const packetSize = dataView.getInt16(HeaderOffsetManager.LENGTH_OFFSET, true)
            const bodySize = packetSize-HeaderOffsetManager.HEADER_SIZE;
            const messageBody = new Uint8Array(bufferData, HeaderOffsetManager.HEADER_SIZE, bodySize);
            bufferData = bufferData.slice(packetSize);
            packetList.push({
                messageId,
                packetSize,
                messageBody,
            })
        }
        return packetList
    }
}
