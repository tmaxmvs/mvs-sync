import {Buffer} from "buffer";
const struct_pb = require("../protoBuf/Struct_pb")

export class GroupId{
    private constructor(){}

    static getInstance(sceneNumber:number, channelId:number):Buffer{
        const groupId = new struct_pb.GroupID();
        groupId.setScenenumber(sceneNumber);
        groupId.setChannelid(channelId);
        return groupId
    }
}

export class Vector3{

    private constructor() {}

    static getInstance(x:Number, y:Number, z:Number):Buffer{
        const vector3 = new struct_pb.Vector3();
        vector3.setX(x);
        vector3.setY(y);
        vector3.setZ(z);
        return vector3
    }
}
export class Transform{

    private constructor() {}
    static getInstance(position:any, rotation:any, scale:any):Buffer{
        const transform = new struct_pb.Transform();
        transform.setPosition(position);
        transform.setRotation(rotation);
        transform.setScale(scale);

        return transform
    }
}

export class ObjectId{
    private constructor() {}

    static getInstance(prefabId:Number, instanceId:Number):Buffer{
        const objectId = new struct_pb.ObjectID();
        objectId.setPrefabid(prefabId);
        objectId.setInstanceid(instanceId);

        return objectId
    }
}

export class ObjectInfo{
    private constructor() {}

    static getInstance(ownerPlayerId:Number, objectId:Buffer, transform:Buffer, visible:boolean):Buffer{
        const objectInfo = new struct_pb.ObjectInfo();
        objectInfo.setOwnerplayerid(ownerPlayerId);
        objectInfo.setObjectid(objectId);
        objectInfo.setTransform(transform);
        objectInfo.setVisible(visible);

        return objectInfo;
    }
}