# MVS API 문서

전반적으로 `SyncManager` 클래스에서 동기화를 관리함. 역할은

- MVS와의 연결 소켓 관리
- 클라이언트의 요청에 따른 메시지 작성 및 전송
- 메시지 ID에 따른 콜백함수 자동 호출

### 코드 위치

[http://192.168.153.214:32080/mv1/mvs/racing-test/](http://192.168.153.214:32080/mv1/mvs/racing-test/-/tree/dev/src/utils)

위 레포지토리의 `src/utils` 에 있는 `MessageWriter` , `SyncManager` 를 본인의 프로젝트에 복사해서 사용.

`src/interfaces` 에 있는 `Dictionary.ts` 파일 내부의 `eMessageID` 값 import.

### 지원 기능

룸 생성 및 입장, 룸 입장, 객체 생성, 객체 파괴, 객체 동기화

### 클라이언트가 해야할 일

API 정상작동을 위해 해야할 일

1. 동기화 할 instance를 생성할 클래스에 프리팹 ID 부여
2. 객체의 속성을 맵으로 관리
3. 객체 관련 요청 함수 호출 시 매개변수를 API에서 지정한 양식으로 만들어야 함
4. 메시지 수신 시 API에서 메시지 ID에 따라 호출 될 콜백함수 작성

---

`SyncManager` 클래스에 다 포함되어 있습니다.

# 연결(connect)

| method          | params      | explation                                |
| --------------- | ----------- | ---------------------------------------- |
| constructor     | string \_ws | websocket 연결                           |
| getConnectionID | -           | 서버에 의해 할당된 연결 ID를 반환합니다. |

## 생성자

### constructor

```tsx
constructor(_ws: string)

// 예제
const syncManager = new SyncManager(_ws);
```

- **`_ws`**: 연결을 설정할 WebSocket URL.

## 메서드

### getConnectionID

```tsx
getConnectionID(): number

// 예제
const connectionID = syncManager.getConnectionID();
```

- 서버에 의해 할당된 연결 ID를 반환합니다.

# 요청(Request)

| method                          | params                                         | explation                                                                                                                 |
| ------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | -------------- |
| reqCreateAndJoinRoom            | num sceneID                                    | scene ID로 새로운 방을 생성하고 참가하는 요청을 보냅니다.                                                                 |
| reqJoinRoom                     | string roomNumber                              | roomNumber : hex 값                                                                                                       |
| 기존 룸 번호에 해당하는 룸 입장 |
| sceneLoadedComplete             | -                                              | 씬 로드가 완료되어 초기 동기화 상태를 서버에게 요청. 룸 입장시에만 사용. ReqJoin() 과는 반드시 시간차를 두고 사용해야 함. |
| reqCreateObject                 | SyncType[]                                     | any[] params                                                                                                              | 객체 생성 요청 |
| // TODO: SyncType[]             | any[] ⇒ 생성할 객체 형태에 맞게 타입 변경 예정 |
| reqRemoveObject                 | num objectID                                   | 객체 제거 요청                                                                                                            |
| reqSyncObject                   | SyncType obj                                   | 객체 동기화 요청                                                                                                          |

## 메서드

### reqCreateAndJoinRoom

```tsx
reqCreateAndJoinRoom(sceneID: number): SyncManager

// 예제
syncManager.reqCreateAndJoinRoom(1);
```

- 새로운 방을 생성하고 참가하는 요청을 보냅니다.
- **`sceneID`**: 씬 ID.

### reqJoinRoom

```tsx
reqJoinRoom(roomNumber: string)

// 예제
syncManager.reqJoinRoom('1c');
```

- 기존 룸 번호에 해당하는 룸 입장
- roomNumber : hex 값
- **`roomNumber`**: 참가할 룸 번호.

### sceneLoadedComplete

```tsx
sceneLoadedComplete();

// 예제
syncManager.sceneLoadedComplete();
```

- 씬 로드가 완료되어 초기 동기화 상태를 서버에게 요청. 룸 입장시에만 사용.
- `ReqJoin()` 과는 반드시 시간차를 두고 사용해야 함.

### reqCreateObject

```tsx
reqCreateObject(params: SyncType[] | any[])

// 예제
const testObj = [
        {
          objID: 1,
          attributes: {
            1: 0,
            2: 0,
            3: 1,
          },
        },
      ];
syncManager.reqCreateObject(testObj);
```

- 객체 생성 요청을 보냅니다.
- **`params`**: 생성할 객체의 속성 정보를 포함한 배열.
  - `SyncType`에 관해서는 아래에서 확인 가능합니다. ([클릭으로 이동](https://www.notion.so/MVS-API-37afd47990b64423b666dded36105391))

### reqRemoveObject

```tsx
reqRemoveObject(objectID: number)

// 예제
syncManager.reqRemoveObject(65537);
```

- 객체 삭제 요청을 보냅니다.
- **`objectID`**: 삭제할 객체의 ID.

### reqSyncObject

```tsx
reqSyncObject(obj: SyncType)

// 예제
const testObj = {
          objID: 65537,
          attributes: {
            1: 0,
            2: 0,
            3: 1,
          },
        }
syncManager.reqCreateObject(testObj);
```

- 객체 동기화 요청을 보냅니다.
- **`obj`**: 동기화할 객체 정보.
  - `SyncType`에 관해서는 아래에서 확인 가능합니다. ([클릭으로 이동](https://www.notion.so/MVS-API-37afd47990b64423b666dded36105391))

# 응답(Response)

| method                                      | params             | explation                                                                                     |
| ------------------------------------------- | ------------------ | --------------------------------------------------------------------------------------------- |
| onCreateRoom                                | string roomId      | roomId: hex값                                                                                 |
| 룸 번호를 현재 룸 상태 어딘가에 저장해야 함 |
| onJoinRoom                                  | num sceneID        | 해당하는 씬ID를 로드해야 함. 서버에 잘못된 룸 번호를 전달했을 경우, sceneID에 0xFFFFFFFF 전달 |
| onCreateObject                              | object obj         | 객체 생성                                                                                     |
| onRemoveObject                              | num removeObjectId | 객체 제거                                                                                     |
| onSyncObject                                | object syncObj     | 객체 동기화                                                                                   |

## 메서드

### onCreateRoom

```tsx
this.onCreateRoom(roomId);
```

- 새로운 방을 생성하고 참가하는 응답을 서버로부터 받습니다.
- **`roomID`**: Room Id를 Call back함수에 담아 front-end에 넘겨줍니다.

### onJoinRoom

```tsx
this.onJoinRoom(sceneId);
```

- 기존 룸 번호에 해당하는 룸 입장 응답을 서버로부터 받습니다.
- **`sceneID`**: 씬 ID를 Callback 함수에 담아 front-end에 넘겨줍니다.

### onCreateObject

```tsx
this.onCreateObject([obj]);
```

- 객체 생성 응답을 서버로부터 받습니다.
- **`obj`**: 서버로 부터 받은 데이터를 object Id, owner Id, 그리고 attributes를 리스트에 담아 Callback 함수에 담아 front-end에 넘겨줍니다.

### onRemoveObject

```tsx
this.onRemoveObject(removeObjId);
```

- 객체 삭제 응답을 서버로부터 받습니다.
- **`removObjId`**: 삭제할 objectID에 담아 Callback 함수에 담아 front-end에 넘겨줍니다.

### onSyncObject

```tsx
this.onSyncObject([syncObj]);
```

- 객체 동기화 응답을 서버로부터 받습니다.
- **`syncObj`**: 동기화할 객체 정보를 리스트에 넣고, callback 함수에 담아 front-end에 넘겨줍니다.,

# 인터페이스

### SyncType

```tsx
interface SyncType {
  objID: number;
  attributes: { [key: number]: number };
}
```

- **`SyncType`** 인터페이스는 동기화할 객체 정보를 표현하며, 다음과 같은 구조를 가지고 있습니다.
  ### Properties
  - **`objID`** (number) : 동기화할 객체의 ID
  - **`attributes`** ({ [key: number]: number }) : 객체의 속성을 표현하는 key-value 형태의 객체. key는 속성의 ID를 나타내고, value는 해당 속성의 값입니다.
    - 현재 key는 uint 타입의 256^3 미만의 수로만 입력해 주어야 합니다.
    - value는 double 타입까지 입력이 가능합니다.
  **`SyncType`** 인터페이스는
  **`reqCreateObject`** 함수에서 동기화할 객체 정보를 생성할 때 서버로 보내기 위해 사용되며, **`reqSyncObject`** 함수에서 객체의 속성을 동기화하기 위한 정보로 사용됩니다.
  이러한 구조를 사용함으로써, 서로 다른 클라이언트 간에 객체 상태를 쉽게 동기화할 수 있습니다.

# 기타

### 주의사항

1. CreateAndJoinRoom(또는 JoinRoom) 을 연달아 호출하지 말 것
   1. 반드시 연결해제 후(새로고침 후) 다시 Create 또는 Join을 호출할 것

### 지원 예정

지원 예정: 룸 현황, 룸 접속 인원 및 리스트, 룸 나가기, **클래스 속성 맵 관리**, IdConverter 클래스 작성.

---

# 클라이언트 예제 코드 안내

## 경마 데모 클라이언트 동작 시나리오

1. 유저1이 방을 생성(생성과 동시에 입장)
2. 유저 1이 말을 생성
3. 유저 2가 생성된 방에 입장 ⇒ 유저 1이 만든 말의 객체가 화면에 생성되는지 확인
4. 유저 2가 말을 생성 ⇒ 유저 1의 화면에 유저 2가 만든 말이 화면에 생성되는지 확인
5. 유저 1과 유저 2가 말을 움직임 ⇒ 동기화 확인
6. 결승선에 도달하면 말이 사라짐 ⇒ remove 동기화 확인

## 클라이언트 디렉토리 구조

- `src/pages/Home/` : 타입 및 state 정의, response callback 함수 정의 및 호출
- `src/components/Field/` : 경마장 UI 컴포넌트
- `src/components/Game/` : 말 및 맵 클래스 코드
- `src/components/Room/` : 룸 입장, 생성 버튼 UI

request에 대한 API 사용은 `src/components/Game/GameTest.ts`

response에 대한 API 사용은 `src/components/Home/index.ts` 에서 코드 작성

## 시나리오 코드 상세 설명

request에 따른 response를 API에서 parameter로 전달해줌.

ex)

```tsx
// SyncManager.ts
...
case protocol.eMessageID.ROOM_CREATE_RES:
          const roomId: string = serverData[3].toString(16);
          this.onCreateRoom(roomId);
          offset += protocol.eOffsetManager.OFFSET_LENGTH;
          break;
...
```

전달받은 값을 클라이언트에서 콜백함수로 짜서 활용함.

ex)

```tsx
// index.tsx
const Home = () => {
...
	syncManager.onCreateRoom = (RoomID) => {
    setCreatedRoomNum(RoomID);
    setRoomNum(RoomID);
    if (initObjs.length > 0) {
      syncManager.reqCreateObject(initObjs);
    }
  };
...
}

```

# 시나리오별 예제

- 소켓 IP 설정
  ```tsx
  // socket.ts

  import { SyncManager } from "./SyncManager";

  const syncManager = new SyncManager("웹소켓 설정할 IP 입력");

  export default syncManager;
  ```
  ```tsx
  // index.tsx
  ...
  	syncManager.listner();
  ...
  ```
- 유저 1이 방을 생성 (생성과 동시에 입장함)
  ```tsx
  // RoomCreateButton.tsx
  const createRoom = () => {
      syncManager.reqCreateAndJoinRoom(1);
      return;
    };

  return (
  			<button
          className="btn-create-room"
          onClick={createRoom}
          disabled={isRoomJoined ? true : false}
        >
  )
  ```
  ```tsx
  // index.tsx
  syncManager.onCreateRoom = (RoomID) => {
    setCreatedRoomNum(RoomID);
    setRoomNum(RoomID);

    if (initObjs.length > 0) {
      // init 할 객체가 있을 경우 실행
      syncManager.reqCreateObject(initObjs);
    }
  };
  ```
- 유저 1이 말을 생성
  ```tsx
  function createObject() {
  	...
    const newObject = [
      {
        objID: 1,
  			// Definition of attributes must be done in advance.
        attributes: {
          1: 0,
          2: 0,
          3: 1,
        },
      },
    ];
    syncManager.reqCreateObject(newObject);
  	...
  }
  ```
  ```tsx
  // index.tsx
  syncManager.onCreateObject = (createdObj: HorseType[]) => {
    if (syncedObjMap) {
      const arr2 = syncedObjMap.entries();
      const map = new Map(arr2);
      createdObj.map((obj) => {
        map.set(obj.objId, {
          attributes: obj.attributes,
          ownerId: obj.ownerId,
        });
      });
      setSyncedObjMap(map);
    }
  };
  ```
- 유저 2가 생성된 방에 입장
  ```tsx
  // RoomJoinButton.tsx
  const RoomJoinButton = ({
    inputNum,
    isRoomJoined,
  }: {
    inputNum: string;
    isRoomJoined: boolean;
  }) => {
    const onClickBtn = () => {
      syncManager.reqJoinRoom(inputNum);
    };

    return (
      <button
        className="btn-join-room"
        onClick={onClickBtn}
        disabled={isRoomJoined ? true : false}
      >
        룸 들어가기
      </button>
    );
  };
  ```
  ```tsx
  // index.tsx

  syncManager.onJoinRoom = (SceneID) => {
    if (SceneID) {
      setSceneID(SceneID);
      syncManager.sceneLoadedComplete();
      setRoomNum(inputNum);
    }
  };
  ```
- 유저 2가 말을 생성
  CreateObject가 브로드캐스팅 되며 모든 유저에게 다른 유저가 생성한 말 객체를 생성하도록 함.
  onCreateObject를 통해 브로드캐스팅 받은 data 활용
  유저 1이 말을 생성할 때와 생성 로직 동일
- 유저 1과 유저 2가 말을 움직임
  ```tsx
  // Movement.tsx
  function handle(event: KeyboardEvent) {
  	switch (event.code) {
      case "ArrowLeft":
        event.preventDefault();
        syncedObjArray.forEach((value, key, map) => {
  				// userId check
          if (value.ownerId === connectionID) {
            const updateObject =
            {
              objID: key,
              attributes: {
                1: value.attributes[1] - 70,
              },
            };
  					// send updateObject
            syncManager.reqSyncObject(updateObject)
          }
        })
        break;
  		...
    }
  }
  ```
  ```tsx
  // index.tsx

  syncManager.onSyncObject = (syncedObjsArr: any[]) => {
    const arr2 = syncedObjMap.entries();
    const map = new Map(arr2);
    syncedObjsArr.map((obj) => {
      if (map.has(obj.objId)) {
        map.set(obj.objId, {
          ...map.get(obj.objId),
          attributes: { ...map.get(obj.objId).attributes, ...obj.attributes },
          ...obj.ownerId,
        });
        setSyncedObjMap(map);
      }
    });
  };
  ```
- 결승선에 도달하면 말이 사라짐
  ```tsx
  // GameTest.tsx
  const draw = () => {
  	...
  	if (players.length > 0) {
      for (let i = 0; players.length > i; i++) {
        players[i].draw(canvas, context);
        if (players[i].position.x === 630) {
          syncManager.reqRemoveObject(players[i].objectId.s);
        }
      }
    }
  	...
  }
  ```
  ```tsx
  // index.tsx
  syncManager.onRemoveObject = (removeObjId) => {
    const arr = syncedObjArray.entries();
    const map = new Map(arr);
    if (syncedObjArray) {
      map.delete(removeObjId);
    }
    setSyncedObjArray(map);
  };
  ```

### 객체 동기화용 타입

```tsx
interface HorseType {
  objId: number;

  // attributes의 key값은 추후 string으로 사용 가능하게 할 예정
  attributes: {
    1?: number;
    2?: number;
    3?: number;
  };

  ownerId?: number;
}
```

###

### 주요 state

- `src/pages/Home/index.ts`
  - syncedObjMap : 동기화가 필요한 객체를 Map 형태로 담고있는 state
    - 오브젝트의 다형성을 위해 Map을 사용
    - reqSyncObject 의 response는 **object의 바뀐 부분만 반환**해주므로 state를 변경하기 용이하도록 Map을 사용하였음.
    - syncedObjMap을 새로운 변수에 저장 → 새로운 변수에 응답받은 데이터 할당 → setSyncedObjMap을 통해 새로운 데이터 state에 저장

```tsx
// 사용된 React state

const [inputNum, setInputNum] = useState<string>("");
const [createdRoomNum, setCreatedRoomNum] = useState<string>("");
const [roomNum, setRoomNum] = useState<string>("");
const [isRoomJoined, setIsRoomJoined] = useState<boolean>(false);
const [sceneID, setSceneID] = useState<number>(1);
const [syncedObjMap, setSyncedObjMap] = useState<Map<number, HorseType>>(
  new Map()
);
```

### 참고 사항

**Canvas 렌더링을 위한 GameMap 컴포넌트**

**`GameMap`** 컴포넌트는 게임 화면을 그리고, 오브젝트를 생성하거나 동기화하는 기능을 제공합니다.

| method         | params | explanation                                                 |
| -------------- | ------ | ----------------------------------------------------------- |
| createObject() | -      | 말 오브젝트를 생성하는 함수, 생성하고 말 정보를 서버에 전송 |
| syncObject()   | -      | 서버에 동기화할 오브젝트를 요청하고 정보를 받는 함수        |
| useKeyDown()   | -      | 키보드 이벤트 처리 함수                                     |
