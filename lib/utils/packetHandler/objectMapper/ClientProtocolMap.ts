import {MessageId} from "../../../interfaces/MessageId";
import {
    ClientAddNetworkObject, ClientChangeObjectOwner, ClientChat, ClientGroupJoin,
    ClientGroupList, ClientHeartBeat, ClientInitialObject, ClientPlayerId,
    ClientRemoveNetworkObject, ClientRoomCreate, ClientRoomJoin,
    ClientRoomList, ClientUpdateNetworkObject
} from "../../bufferStructure/ClientProtocolBuffer";
export const ClientProtocolMap = {
    [MessageId.PKT_C_HEART_BEAT]: ClientHeartBeat,
    [MessageId.PKT_C_TEST_ROOM_CREATE]: ClientRoomCreate,
    [MessageId.PKT_C_TEST_ROOM_LIST]: ClientRoomList,
    [MessageId.PKT_C_ROOM_JOIN]: ClientRoomJoin,
    [MessageId.PKT_C_PLAYER_ID]: ClientPlayerId,
    [MessageId.PKT_C_GROUP_LIST]: ClientGroupList,
    [MessageId.PKT_C_GROUP_JOIN]: ClientGroupJoin,
    [MessageId.PKT_C_INITIAL_OBJECTS]: ClientInitialObject,
    [MessageId.PKT_C_ADD_NETWORK_OBJECTS]: ClientAddNetworkObject,
    [MessageId.PKT_C_REMOVE_NETWORK_OBJECTS]: ClientRemoveNetworkObject,
    [MessageId.PKT_C_UPDATE_NETWORK_OBJECTS]: ClientUpdateNetworkObject,
    [MessageId.PKT_C_CHANGE_OBJECTS_OWNER]: ClientChangeObjectOwner,
    [MessageId.PKT_C_CHAT]: ClientChat,
};
