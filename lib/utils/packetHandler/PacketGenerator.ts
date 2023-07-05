import {HeaderOffsetManager} from "../../interfaces/OffsetLength";
export class PacketGenerator {
    private constructor() { } // private constructor to prevent instantiations

    static generatePacket(messageId: number, body: any): Buffer {
        const length = HeaderOffsetManager.HEADER_SIZE + body.length;
        const header = Buffer.alloc(HeaderOffsetManager.HEADER_SIZE);

        header.writeUInt16LE(messageId, HeaderOffsetManager.MESSAGE_ID_OFFSET);
        header.writeUInt16LE(length, HeaderOffsetManager.LENGTH_OFFSET);

        return Buffer.concat([header, body]);
    }
}
