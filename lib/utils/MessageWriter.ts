import * as protocol from "../interfaces/Dictionary";
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

// TODO: stack 메시지들을 담아 놓고, 1/60 초마다 담은 것을 보낸다.
// class batch
export class MessageWriter {
  #batch: ArrayBuffer;

  #batchHeader: Buffer;
  #batchBody: Buffer;

  #messageID: Buffer;
  #messageLen: Buffer;

  #messageHeader: Buffer;
  #messageBody: Buffer;

  // batchBody에 들어갈 하나의 메시지
  #message: Buffer;
  #messageStack: ArrayBuffer;

  // getter
  #getBatchBodyLength() {
    return this.#batchBody.byteLength;
  }

  // setter
  #setMessageID(_msgID: number) {
    const _messageID: Buffer = Buffer.alloc(
      protocol.eOffsetManager.MESSAGE_ID_LENGTH
    );

    _messageID.writeUInt32LE(_msgID, 0);

    this.#messageID = _messageID;
    return this;
  }

  // TODO: setMessageBody 테스트 및 변경
  setMessageBody(
    option: "zero" | "one" | "object" | "sync",
    params?: any[] | number
  ) {
    switch (option) {
      case "object":
      case "sync":
        let _messageBody;

        if (!Array.isArray(params)) {
          throw new Error("params에 배열을 넣어주세요");
        }

        for (const iterator of params) {
          let _objID = Buffer.alloc(4);
          if (option === "sync") {
            _objID.writeUInt32LE(iterator.objID, 0);
          } else {
            _objID.writeUInt16LE(iterator.objID, 2);
          }

          let _attribution;
          for (const key in iterator.attributes) {
            let _attributeID = Buffer.alloc(4);
            let _attributeLen = Buffer.alloc(4);
            let _attributeData = Buffer.allocUnsafe(8);

            _attributeID.writeUInt32LE((1 << 24) | parseInt(key, 0));

            const value: number = iterator.attributes[key];

            _attributeData.writeDoubleLE(value, 0);

            _attributeLen.writeUInt32LE(_attributeData.byteLength);

            _attribution = Buffer.concat([
              _attributeID,
              _attributeLen,
              _attributeData,
            ]);
            if (_messageBody !== undefined) {
              _messageBody = Buffer.concat([_messageBody, _attribution]);
            } else {
              _messageBody = Buffer.concat([_attribution]);
            }
          }

          _messageBody = Buffer.concat([_objID, _messageBody]);
        }
        this.#messageBody = Buffer.alloc(_messageBody.byteLength);
        this.#messageBody = _messageBody;
        break;
      case "one":
        this.#messageBody = Buffer.alloc(4);
        if (!Array.isArray(params)) {
          this.#messageBody.writeUInt32LE(params);
        }
        break;
      case "zero":
        this.#messageBody = Buffer.alloc(0);
        break;

      default:
        break;
    }
  }

  setMessageBodyZero() {
    this.#messageBody = Buffer.alloc(0);
    return this;
  }
  setMessageBodyOne(params: number) {
    this.#messageBody = Buffer.alloc(4);
    this.#messageBody.writeUInt32LE(params);
    return this;
  }

  setMessageBodyObject(params: any[]) {
    let _messageBody;
    for (const iterator of params) {
      let _objID = Buffer.alloc(4);
      _objID.writeUInt16LE(iterator.objID, 2);

      let _attribution;
      for (const key in iterator.attributes) {
        let _attributeID = Buffer.alloc(4);
        let _attributeLen = Buffer.alloc(4);
        let _attributeData = Buffer.allocUnsafe(8);

        // TODO: 1 값 동적으로
        _attributeID.writeUInt32LE((1 << 24) | parseInt(key, 0));

        const value: number = iterator.attributes[key];

        _attributeData.writeDoubleLE(value, 0);

        _attributeLen.writeUInt32LE(_attributeData.byteLength);

        _attribution = Buffer.concat([
          _attributeID,
          _attributeLen,
          _attributeData,
        ]);
        if (_messageBody !== undefined) {
          _messageBody = Buffer.concat([_messageBody, _attribution]);
        } else {
          _messageBody = Buffer.concat([_attribution]);
        }
      }

      _messageBody = Buffer.concat([_objID, _messageBody]);
    }
    this.#messageBody = Buffer.alloc(_messageBody.byteLength);
    this.#messageBody = _messageBody;
    return this;
  }

  setMessageBodySync(obj: any) {
    let _messageBody;

    let _attribution;

    let _objID = Buffer.alloc(4);
    _objID.writeUInt32LE(obj.objID, 0);

    for (const key in obj.attributes) {
      let _attributeID = Buffer.alloc(4);
      let _attributeLen = Buffer.alloc(4);
      let _attributeData;

      // 1바이트 kind, 나머지 3바이트
      _attributeID.writeUInt32LE((1 << 24) | parseInt(key, 0));
      const value = obj.attributes[key];
      _attributeData = Buffer.alloc(8);

      _attributeData.writeDoubleLE(value, 0);

      _attributeLen.writeUInt32LE(_attributeData.byteLength);

      _attribution = Buffer.concat([
        _attributeID,
        _attributeLen,
        _attributeData,
      ]);

      if (_messageBody !== undefined) {
        _messageBody = Buffer.concat([_messageBody, _attribution]);
      } else {
        _messageBody = Buffer.concat([_attribution]);
      }
    }
    _messageBody = Buffer.concat([_objID, _messageBody]);

    this.#messageBody = Buffer.alloc(_messageBody.byteLength);
    this.#messageBody = _messageBody;
    return this;
  }

  #setMessageLen() {
    const _msgBodyLength: Buffer = Buffer.alloc(
      protocol.eOffsetManager.MESSAGE_LEN_LENGTH
    );
    _msgBodyLength.writeUInt32LE(this.#messageBody.byteLength);

    this.#messageLen = _msgBodyLength;
    return this;
  }

  #setMessageHeader() {
    this.#messageHeader = Buffer.concat([this.#messageID, this.#messageLen]);
    return this;
  }

  #setBatchBody() {
    this.#batchBody = Buffer.concat([this.#messageHeader, this.#messageBody]);
    return this;
  }

  #setBatchHeader() {
    const _batchHeader = Buffer.alloc(
      protocol.eOffsetManager.BATCH_HEADER_LENGTH
    );
    _batchHeader.writeUInt32LE(this.#getBatchBodyLength());

    this.#batchHeader = _batchHeader;
    return this;
  }

  setBatch(_msgID: number) {
    this.#setMessageID(_msgID);
    this.#setMessageLen();
    this.#setMessageHeader();
    this.#setBatchBody();
    this.#setBatchHeader();

    this.#batch = Buffer.concat([this.#batchHeader, this.#batchBody]);
    return this.#batch;
  }

  #setMessage() {
    this.#message = Buffer.concat([this.#messageHeader, this.#messageBody]);
    return this;
  }

  setMessage(_msgID: number) {
    this.#setMessageID(_msgID);
    this.#setMessageLen();
    this.#setMessageHeader();
    this.#setMessage();
  }
  // this.#messageStack = Buffer.concat([this.#messageStack, this.#message]);
  // testing() {
  //   const newbuffer = msgpack.encode({
  //     transform: {
  //       scale: {
  //         // 1
  //         x: -26.649295030454404,
  //         y: -26.649295030454404,
  //         z: -26.649295030454404,
  //       },
  //       position: {
  //         // 2
  //         x: -26.649295030454404, // 0000 1010 0000 0000 0000 0000 0000 1101
  //         y: -26.649295030454404,
  //         z: -30.348903732394767,
  //       },
  //       rotation: {
  //         // 3
  //         x: -26.649295030454404,
  //         y: -26.649295030454404,
  //         z: -26.649295030454404,
  //       },
  //     },
  //   });
  //   const a = Buffer.alloc(newbuffer.length);
  //   a.fill(newbuffer);
  //   console.log(a);
  //   console.log(msgpack.decode(a));
  //   return newbuffer;
  // }
}
