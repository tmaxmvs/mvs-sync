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