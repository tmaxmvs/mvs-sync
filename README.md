# MVS API 문서

# 개요

전반적으로 `SyncManager` 클래스에서 동기화를 관리함. 역할은

- MVS와의 연결 소켓 관리
- 클라이언트의 요청에 따른 메시지 작성 및 전송
- 응답 패킷의 메시지 ID에 따른 로직 구현
- 메시지 ID에 따른 콜백함수 자동 호출

## 코드 위치 및 사용

[http://192.168.153.214:32080/mv1/mvs/racing-test/](http://192.168.153.214:32080/mv1/mvs/racing-test/)

`npm i mvs-sync`

`import { SyncManager } from "mvs-sync/dist/utils/SyncManager";`

## 지원 기능

룸 생성, 룸 리스트, 룸 입장, 유저 아이디 발급, 그룹 리스트, 그룹 입장, 초기 객체 리스트, 객체 생성, 객체 파괴, 객체 동기화, 객체 소유권 이전, 채팅

객체는 숫자(number 타입)만 동기화

JS의 모든 숫자는 8바이트 double로 연산되는 것을 확인. 따라서 number로 API에 전달 및 API에서 반환함

## 클라이언트가 해야할 일

API 정상작동을 위해 해야할 일

1. 동기화 할 instance를 생성할 프리팹에 프리팹 ID 부여
2. 객체 관련 요청 함수 호출 시 매개변수를 API에서 지정한 양식으로 만들어야 함
3. 메시지 수신 시 API에서 메시지 ID에 따라 Mapper를 통해 결과 객체를 받아 사용함
4. 메시지 수신 시 API에서 메시지 ID에 따라 호출 될 콜백함수 작성

---

`SyncManager` 클래스에 다 포함되어 있습니다.

# 패키지 다운로드

`npm i mvs-sync`

`import { SyncManager } from "mvs-sync/dist/utils/SyncManager";`

# 웹팩 설정

**웹팩 설정 해주셔야 사용 가능합니다(6/26 기준 웹팩 설정까지 저장소에 적용,  `npm install` 후 .env설정만으로 사용 가능)**

[웹팩 설정](https://www.notion.so/fab341f246324292b6e5dec7da63a743?pvs=21)

- 링크 들어가기 귀찮으시면 목차로 확인!
    - mvs-sync는 `Buffer`를 사용하고 있어서 해당 플러그인을 추가해주셔야 합니다
    - 순서대로 하시면 사용 가능하실 것으로 예상됩니다.

  ### 웹팩 override 라이브러리 설치

    - `npm install buffer process stream-browserify react-app-rewired`

  ### scripts 수정

    ```tsx
    "scripts": {
        "start": "react-app-rewired start", // 에러 나시면 GENERATE_SOURCEMAP=false 추가해주시면 될 거 같습니다.
        "build": "GENERATE_SOURCEMAP=false react-app-rewired build",
        "test": "react-app-rewired test",
        "eject": "react-app-rewired eject"
      },
    ```

  ### 설정 파일 생성

    - root에 `config-overrides.js`  파일 생성

  ### 설정

    ```tsx
    const webpack = require("webpack");
    
    module.exports = function override(config, env) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        stream: require.resolve("stream-browserify"),
        buffer: require.resolve("buffer"),
    		'process/browser': require.resolve('process/browser'), // 14:50 수정. mx 스튜디오에서 three js 랑 충돌나서 추가했습니다 
      };
      config.resolve.extensions = [...config.resolve.extensions, ".ts", ".js"];
      config.plugins = [
        ...config.plugins,
        new webpack.ProvidePlugin({
          process: "process/browser",
          Buffer: ["buffer", "Buffer"],
        }),
      ];
    
      return config;
    };
    ```

  ### 재 실행

    - 재 실행 하면 될 것 같습니다.

  ### 혹시 안되시면 node_modules 삭제하고 다시 npm install 해봐주시면 감사하겠습니다

  안되시면 연락주세요!


# 웹 소켓 설정

- Webpack 설정 후 root에 .env 파일 생성. 아래와 같이 Server Url을 설정한 뒤 실행

```bash
// .env

REACT_APP_SERVER_URL=ws://<SERVER_URL>:<port>
```

process.env.REACT_APP_SERVER_URL으로 접근 가능하며 변경사항 적용시 프로젝트 재빌드 필요

# [연결(connect)](https://www.notion.so/MVS-API-37afd47990b64423b666dded36105391?pvs=21)

| method | params | explanation |
| --- | --- | --- |
| constructor | string _url | websocket 연결 |
| getConnectionID | void | 서버에 의해 할당된 연결 ID를 반환합니다. |
| closeConnection | void | websocket close |

## 생성자

### constructor

```tsx
constructor(_url: string) 

// 예제
const syncManager = new SyncManager(_url);
```

- **`_ws`**: 연결을 설정할 WebSocket URL.

## 매서드

### getConnectionID

```tsx
getConnectionID(): number

// 예제
const connectionID = syncManager.getConnectionID();
```

- 서버에 의해 할당된 연결 ID를 반환합니다.

### closeConnection

```tsx
closeConnection(): void

// 예제
const connectionID = syncManager.getConnectionID();
```

- 서버에 의해 할당된 연결 ID를 반환합니다.

# 요청(Request)

| method | params | explanation |
| --- | --- | --- |
| reqHeartBeat | void | HEART BEAT |
| reqRoomList | void | 현재 생성되어 있는 room 리스트 모두에 대한 정보를 요청 |
| reqGroupList | void | 입장한 room의 group 모두에 대한 정보를 요청 |
| reqPlayerId | void | group내에서 사용할 playerId를 생성 요청 |
| reqInitialObjects | void | 입장한 group내의 object 정보를 요청 |
| reqCreateRoom | number appId,
number waplRoomId,
string name | appId와 roomId, 그리고 roomName을 담아 room생성 요청 |
| reqJoinRoom | number roomNumber | roomNumber에 해당하는 room 입장 |
| reqJoinGroup | number sceneNumber
number channelId | sceneNumber와 channelId를 통해 groupId를 만들어 요청 |
| reqCreateObject | Buffer[] params | 추가할 objectList를 담아 객체 생성 요청 |
| reqRemoveObject | Buffer[] params | 삭제할 objectList를 담아 객체 제거 요청 |
| reqUpdateObject | Buffer[] params | 갱신할 objectList를 담아 객체 동기화 요청 |
| reqChangeObjectOwner | Buffer[] params | object 소유권 변경 |
| reqChat | string msg | 메시지 전송 요청 |

## 메서드

### reqRoomList

```tsx
reqRoomList():void

// 예제
syncManager.reqRoomList()
```

- 현재 생성된 룸 리스트를 요청한다.

### reqGroupList

```tsx
reqGroupList():void

// 예제
syncManager.reqGroupList();
```

- 그룹 리스트를 요청한다.

### reqPlayerId

```tsx
reqPlayerId():void

// 예제
syncManager.reqPlayerId();
```

- 플레이어 아이디를 요청한다.

### reqInitialObjects

```tsx
reqInitialObjects():void

//예제
syncManager.reqInitialObjects()
```

- 플레이어가 그룹에 들어온 이후의 ObjectList 상태를 요청한다.

### reqCreateRoom

```tsx
reqCreateRoom(appId:number, waplRoomId: number, name:string):void

// 예제
syncManager.reqCreateRoom(appID, waplRoomId, name)
```

- 룸 생성 요청을 보낸다.
- `appId` 앱 마다의 고유한 ID, `waplRoomId` wapl에서 발급받은 고유한 RoomID(현재는 직접 부여하고 있음), `name` 방 이름

### reqJoinRoom

```tsx
reqJoinRoom(roomNumber: number):void

// 예제
syncManager.reqJoinRoom(roomNumber);
```

- 룸 참여 요청을 보낸다.
- **`roomNumber`**: reqRoomList()에서 받아온 roomNumber

### reqJoinGroup

```tsx
reqJoinGroup(sceneNumber: number, channelId: number):void

// 예제
syncManager.reqJoinGroup(sceneNumber, channelId)
```

- 그룹 참여 요청을 보낸다.
- `sceneNumber` group 번호, `channelId` group내의 channel 번호

### reqCreateObject

```tsx
reqCreateObject(params: Buffer[]):void

// 예제
const newObject = ObjectInfo.getInstance(ownerPlayerId, objectId, transform, visible)
syncManager.reqCreateObject([...newObject]);
```

- 객체 생성 요청을 보낸다.
- **`params`**: 생성할 객체의 속성 정보를 포함한 배열.
    - `ownerPlayerId` : reqPlayerId로 요청해 받은 ID
    - `ObjectId` : `[ prefabId, instanceId ]` (생성할 객체의 ID)
    - `transform` : 오브젝트의 위치, 회전, 크기 정보
    - `visible` : 오브젝트의 visiblity


### reqRemoveObject

```tsx
reqRemoveObject(params: Buffer[]):void

// 예제
const removeObject = ObjectInfo.getInstance(ownerPlayerId, objectId, transform, true)
syncManager.reqRemoveObject([...removeObject]);
```

- 객체 삭제 요청을 보낸다.
- `params` : 삭제할 객체의 속성 정보를 포함한 배열
    - `ownerPlayerId` : reqPlayerId로 요청해 받은 ID
    - `ObjectId` : `[ prefabId, instanceId ]` (삭제할 객체의 ID)
    - `transform` : 오브젝트의 위치, 회전, 크기 정보
    - `visible` : 오브젝트의 visiblity


### reqUpdateObject

```tsx
reqUpdateObject(params: Buffer[]):void

// 예제
const newObject = ObjectInfo.getInstance(ownerPlayerId, objectId, transform, true);
syncManager.reqUpdateObject([...newObject]);
```

- 객체 동기화 요청을 보낸다.
- `params`: 동기화할 객체 정보.
    - `ownerPlayerId` : reqPlayerId로 요청해 받은 ID
    - `objectID` ****: `[ prefabId, instanceId ]` (동기화할 객체의 ID)
    - `transform` : 오브젝트의 위치, 회전, 크기 정보
    - `visible` : 오브젝트의 visiblity

# 응답(Response)

- #ReadProtocol에서 event를 받은 후 packet단위로 나눠줌

```jsx

#ReadProtocol(e: any) {
  const packetList = PacketReceiver.receive(e.data)
  for (const packet of packetList) {
    this.#onReceivePacket(packet.messageId, packet.messageBody)
  }
}
```

- 서버에서 response 되는 packet을 전역적으로 관리하기 위해 SyncManager내부에 abstract method 선언. 응답을 핸들링할 각 모듈에서 재정의해 사용한다.

```jsx
const pb = require("./Protocol_pb")

#onReceivePacket = (receiveMessageId:MessageId, messageBody:any) => {
  switch (receiveMessageId){
      case MessageId.PKT_S_HEART_BEAT: this.onHeartBeat(messageBody); break;
      case MessageId.PKT_S_TEST_ROOM_CREATE: this.onRoomCreate(pb.S_TEST_ROOM_CREATE.deserializeBinary(messageBody)); break;
      case MessageId.PKT_S_TEST_ROOM_LIST: this.onRoomList(pb.S_TEST_ROOM_LIST.deserializeBinary(messageBody)); break;
      case MessageId.PKT_S_ROOM_JOIN: this.onRoomJoin(pb.S_ROOM_JOIN.deserializeBinary(messageBody)); break;
      case MessageId.PKT_S_PLAYER_ID: this.onPlayerId(pb.S_PLAYER_ID.deserializeBinary(messageBody)); break;
      case MessageId.PKT_S_GROUP_LIST: this.onGroupList(pb.S_GROUP_LIST.deserializeBinary(messageBody)); break;
      case MessageId.PKT_S_GROUP_JOIN: this.onGroupJoin(pb.S_GROUP_JOIN.deserializeBinary(messageBody)); break;
      case MessageId.PKT_S_INITIAL_OBJECTS: this.onInitialObjects(pb.S_INITIAL_OBJECTS.deserializeBinary(messageBody)); break;
      case MessageId.PKT_S_OTHER_CLIENT_JOINED: this.onOtherClientJoined(pb.S_OTHER_CLIENT_JOINED.deserializeBinary(messageBody)); break;
      case MessageId.PKT_S_ADD_NETWORK_OBJECTS: this.onAddNetworkObject(pb.S_ADD_NETWORK_OBJECTS.deserializeBinary(messageBody)); break;
      case MessageId.PKT_S_REMOVE_NETWORK_OBJECTS: this.onRemoveNetworkObject(pb.S_REMOVE_NETWORK_OBJECTS.deserializeBinary(messageBody)); break;
      case MessageId.PKT_S_UPDATE_NETWORK_OBJECTS: this.onUpdateNetworkObject(pb.S_UPDATE_NETWORK_OBJECTS.deserializeBinary(messageBody)); break;
      case MessageId.PKT_S_CHANGE_OBJECTS_OWNER: this.onChangeObjectsOwner(pb.S_CHANGE_OBJECTS_OWNER.deserializeBinary(messageBody)); break;
      case MessageId.PKT_S_CHAT: this.onChat(pb.S_CHAT.deserializeBinary(messageBody)); break;
      default: break;
  }
}
```

## 메서드

| method | explanation |
| --- | --- |
| onHeartBeat | HEART BEAT |
| onRoomCreate | 서버에서 룸 생성 후 응답 |
| onRoomList | 존재하는 룸 리스트 반환 |
| onRoomJoin | 서버에서 룸 입장 후 응답 |
| onPlayerId | playerID생성 후 반환 |
| onGroupList | 존재하는 그룹 리스트 반환 |
| onGroupJoin | 서버에서 그룹 입장 후 응답 |
| onInitialObjects | 해당 채널에 존재하는 오브젝트 정보 반환 |
| onOtherClientJoined | 다른 사용자가 방에 입장하였을 때, 유저 정보 Broadcast |
| onAddNetworkObject | 오브젝트 생성 요청을 보낼 때 그룹 내 모든 유저에게 생성된 정보 Broadcast |
| onRemoveNetworkObject | 오브젝트 삭제 요청을 보낼 때 그룹 내 모든 유저에게 삭제된 정보 Broadcast |
| onUpdateNetworkObject | 오브젝트 갱신 요청을 보낼 때 그룹 내 모든 유저에게 갱신된 정보 Broadcast |
| onChangeObjectsOwner | 오브젝트 소유권 변경 요청에 대한 응답 |
| onChat | 패킷을 통해 채팅을 입력한 사용자 정보와 채팅 내용에 대해 확인 |

## 구현체 예시

### onHeatBeat

```tsx
/**
* @brief HEART BEAT
*/
syncManager.onHeartBeat = (message) => {

	const res:number = message.getResult();
}
```

### onRoomCreate

```tsx
/**
* @brief 룸 생성 응답
*/
syncManager.onRoomCreate = (message) => {

	const appID:number = message.getAppid();
	const waplroomId:number = message.getWaplroomid();
	const name:string = message.getName();
  const res:number = message.getResult();
}
```

### onRoomList

```jsx
/**
* @brief 룸 리스트 반환
*/
syncManager.onRoomList = (message) => {

  const roomInfo:any[] = message.getRoominfoslist();
	const res:number = message.getResult();
}
```

### onRoomJoin

```tsx
/**
* @brief 룸 입장 응답
*/
syncManager.onRoomJoin = (message) => {

	const res:number = message.getResult();
}
```

### onPlayerId

```tsx
/**
* @brief playerId를 부여받음
*/
syncManager.onPlayerId = (message) => {

	const playerId:number = message.getPlayerid();
	const res:number = message.getResult();
}
```

### onGroupList

```tsx
/**
* @brief 그룹 리스트 반환
*/
syncManager.onGroupList = (message) => {

  const groupList:any[] = message.getGroupinfosList());
	const res:number = message.getResult();
}
```

### onGroupJoin

```tsx
/**
* @brief 그룹 입장 응답
*/
syncManager.onGroupJoin = (message) => {

	const groupInfo = message.getGroupinfo();

		const groupId = groupInfo.getGroupId();
			const sceneNumber:number = groupId.getScenenumber();
			const channelId:number = groupId.getChannelId();
	
		const playerInfo:any[] = groupInfo.getPlayerinfoslist();
			const playerId:number = playerInfo[INDEX].getPlayerid();
			const name:string = playerInfo[INDEX].getName();

	const res:number = message.getResult();
}
```

### onInitialObjects

```tsx
/**
* @brief 채널의 현재 상태를 가져옴
*/
syncManager.onInitialObjects = (message) => {

	const objectInfo:any[] = message.getObjectinfoslist();

		const ownerPlayerId:number = objectInfo[INDEX].getOwnerplayerid();

		const objectId = objectInfo[INDEX].getObjectid();
			const prefabId:number = objectId.getPrefabid();
			const instanceId:number = objectId.getInstanceid();

		const transform = objectInfo[INDEX].getTransform();

			const position = transform.getPosition();
				const pos_x:number = position.getX();
				const pos_y:number = position.getY();
				const pos_z:number = position.getZ();

			const rotation = transform.getRotation();
				const rot_x:number = rotation.getX();
				const rot_y:number = rotation.getY();
				const rot_z:number = rotation.getZ();

			const scale = transform.getScale();
				const scl_x:number = scale.getX();
				const scl_y:number = scale.getY();
				const scl_z:number = scale.getZ();

		const visible:boolean = objectInfo[INDEX].getVisible();

	const res:number = message.getResult();
}
```

### onOtherClientJoined

```tsx
/**
* @brief 다른 클라이언트가 채널에 입장 시, 기존 인원에게 broadcast됨
*/
syncManager.onOtherClientJoined = (message) => {

	const playerInfo = message.getPlayerinfoslist();
		const playerId:number = playerInfo.getPlayerid();
		const name:string = playerInfo.getName();

	const groupId = message.getGroupId();
		const sceneNumber:number = groupId.getScenenumber();
		const channelId:number = groupId.getChannelId();
}
```

### onAddNetworkObject

```tsx
/**
* @brief object 생성 요청 후 응답
*/
syncManager.onAddNetworkObject = (body) => {
	const objectInfo:any[] = message.getObjectinfoslist();

		const ownerPlayerId:number = objectInfo[INDEX].getOwnerplayerid();

		const objectId = objectInfo[INDEX].getObjectid();
			const prefabId:number = objectId.getPrefabid();
			const instanceId:number = objectId.getInstanceid();

		const transform = objectInfo[INDEX].getTransform();

			const position = transform.getPosition();
				const pos_x:number = position.getX();
				const pos_y:number = position.getY();
				const pos_z:number = position.getZ();

			const rotation = transform.getRotation();
				const rot_x:number = rotation.getX();
				const rot_y:number = rotation.getY();
				const rot_z:number = rotation.getZ();

			const scale = transform.getScale();
				const scl_x:number = scale.getX();
				const scl_y:number = scale.getY();
				const scl_z:number = scale.getZ();

		const visible:boolean = objectInfo[INDEX].getVisible();

	const res:number = message.getResult();
}
```

### onRemoveNetworkObject

```tsx
/**
* @brief object 삭제 요청 후 응답
*/
syncManager.onRemoveNetworkObject = (body) => {
	const objectInfo:any[] = message.getObjectinfoslist();

		const ownerPlayerId:number = objectInfo[INDEX].getOwnerplayerid();

		const objectId = objectInfo[INDEX].getObjectid();
			const prefabId:number = objectId.getPrefabid();
			const instanceId:number = objectId.getInstanceid();

		const transform = objectInfo[INDEX].getTransform();

			const position = transform.getPosition();
				const pos_x:number = position.getX();
				const pos_y:number = position.getY();
				const pos_z:number = position.getZ();

			const rotation = transform.getRotation();
				const rot_x:number = rotation.getX();
				const rot_y:number = rotation.getY();
				const rot_z:number = rotation.getZ();

			const scale = transform.getScale();
				const scl_x:number = scale.getX();
				const scl_y:number = scale.getY();
				const scl_z:number = scale.getZ();

		const visible:boolean = objectInfo[INDEX].getVisible();

	const res:number = message.getResult();
}
```

### onUpdateNetworkObject

```tsx
/**
* @brief object 갱신 요청 후 응답
*/
syncManager.onUpdateNetworkObject = (body) => {

	const objectInfo:any[] = message.getObjectinfoslist();

		const ownerPlayerId:number = objectInfo[INDEX].getOwnerplayerid();

		const objectId = objectInfo[INDEX].getObjectid();
			const prefabId:number = objectId.getPrefabid();
			const instanceId:number = objectId.getInstanceid();

		const transform = objectInfo[INDEX].getTransform();

			const position = transform.getPosition();
				const pos_x:number = position.getX();
				const pos_y:number = position.getY();
				const pos_z:number = position.getZ();

			const rotation = transform.getRotation();
				const rot_x:number = rotation.getX();
				const rot_y:number = rotation.getY();
				const rot_z:number = rotation.getZ();

			const scale = transform.getScale();
				const scl_x:number = scale.getX();
				const scl_y:number = scale.getY();
				const scl_z:number = scale.getZ();

		const visible:boolean = objectInfo[INDEX].getVisible();

	const res:number = message.getResult();
}
```

### onChangeObjectsOwner

```tsx
/**
* @brief object 소유자 갱신 요청 후 응답
*/
syncManager.onChangeObjectsOwner = (body) => {

	const objectInfo:any[] = message.getObjectinfoslist();

		const ownerPlayerId:number = objectInfo[INDEX].getOwnerplayerid();

		const objectId = objectInfo[INDEX].getObjectid();
			const prefabId:number = objectId.getPrefabid();
			const instanceId:number = objectId.getInstanceid();

		const transform = objectInfo[INDEX].getTransform();

			const position = transform.getPosition();
				const pos_x:number = position.getX();
				const pos_y:number = position.getY();
				const pos_z:number = position.getZ();

			const rotation = transform.getRotation();
				const rot_x:number = rotation.getX();
				const rot_y:number = rotation.getY();
				const rot_z:number = rotation.getZ();

			const scale = transform.getScale();
				const scl_x:number = scale.getX();
				const scl_y:number = scale.getY();
				const scl_z:number = scale.getZ();

		const visible:boolean = objectInfo[INDEX].getVisible();

	const res:number = message.getResult();
}
```

### onChat

```tsx
/**
* @brief 채팅 응답
*/
syncManager.onChat = (message) => {

	const playerInfo = message.getPlayerinfoslist();
		const playerId:number = playerInfo.getPlayerid();
		const name:string = playerInfo.getName();

	const msg = message.getMsg();

	const res:number = message.getResult();
}
```

# 인터페이스

### OffsetLength

```tsx
export enum HeaderOffsetManager{
    HEADER_SIZE=4,
    MESSAGE_ID_OFFSET=0,
    LENGTH_OFFSET=2
}
```

- 응답 패킷에 대한 header 길이, offset 등 정보 확인

### MessageId

[MVS 프로토콜](https://www.notion.so/MVS-03713ef82a5c48cd9a418e7222a211cc?pvs=21)

```tsx
export enum MessageId{
    PKT_C_HEART_BEAT = 1000,
    PKT_S_HEART_BEAT = 1001,
    PKT_C_TEST_ROOM_CREATE = 1002,
    PKT_S_TEST_ROOM_CREATE = 1003,
    PKT_C_TEST_ROOM_LIST = 1004,
    PKT_S_TEST_ROOM_LIST = 1005,
    PKT_C_ROOM_JOIN = 1006,
    PKT_S_ROOM_JOIN = 1007,
    PKT_C_PLAYER_ID = 1008,
    PKT_S_PLAYER_ID = 1009,
    PKT_C_GROUP_LIST = 1010,
    PKT_S_GROUP_LIST = 1011,
    PKT_C_GROUP_JOIN = 1012,
    PKT_S_GROUP_JOIN = 1013,
    PKT_C_INITIAL_OBJECTS = 1014,
    PKT_S_INITIAL_OBJECTS = 1015,
    PKT_S_OTHER_CLIENT_JOINED = 1016,
    PKT_C_ADD_NETWORK_OBJECTS = 1017,
    PKT_S_ADD_NETWORK_OBJECTS = 1018,
    PKT_C_REMOVE_NETWORK_OBJECTS = 1019,
    PKT_S_REMOVE_NETWORK_OBJECTS = 1020,
    PKT_C_UPDATE_NETWORK_OBJECTS = 1021,
    PKT_S_UPDATE_NETWORK_OBJECTS = 1022,
    PKT_C_CHANGE_OBJECTS_OWNER = 1023,
    PKT_S_CHANGE_OBJECTS_OWNER = 1024,
    PKT_C_CHAT = 1025,
    PKT_S_CHAT = 1026,
}
```

- 요청과 응답 패킷의 MessageId에 해당하는 result number 확인

### ResultMessage

```tsx
export enum ResultMessage {
    SUCCESS = 0,
    FAILED = 1,

// Room 관련 에러
    FAILED_ROOM_NOT_EXISTS_ROOM = 10,
    FAILED_ROOM_ALREADY_EXISTS_ROOM = 11,
    FAILED_ROOM_NOT_IN_ROOM = 12, // Player 가 Room 에 들어와 있지 않음

// Group 관련 에러
    FAILED_GROUP_NOT_EXISTS_GROUP = 20, // 찾는 그룹이 존재하지 않음
    FAILED_GROUP_NOT_IN_GROUP = 21, // 현재 Player 가 그룹 내에 있지 않음
    FAILED_GROUP_ALREADY_EXISTS_GROUP = 22, // 추가하려는 그룹이 이미 존재
    FAILED_GROUP_SAME_GROUP = 23,
    FAILED_GROUP_NOT_EXISTS_PLAYER = 24, // 찾는 플레이어가 존재하지 않음
    FAILED_GROUP_ALREADY_EXISTS_PLAYER = 25, // 추가하려는 플레이어가 이미 존재
}
```

- 응답 패킷의 Result에 해당하는 응답 결과 확인

---

### 주의사항

1. enum, protocol, struct에 수정사항이 생기면 proto파일 수정 후 다시 컴파일 해주어야 한다.
    1. `bash src/utils/protoBuf/compile_pb.sh clean` 실행 후
    2. `bash src/utils/protoBuf/compile_pb.sh` 실행

[에러 모음](https://www.notion.so/82acd7fcb180460485d0bea7767960c1?pvs=21)