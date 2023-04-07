export interface SyncType {
  syncObjID: number;
  attributes: { [key: number]: number };
}

export interface ObjType {
  syncObjID: number;
  [key: string]: any;
}

export interface OtherClientJoined {
  clientId: number;
  clientType: number;
  clientName: string;
}
