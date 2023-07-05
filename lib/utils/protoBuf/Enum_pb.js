// source: Enum.proto
/**
 * @fileoverview
 * @enhanceable
 * @suppress {messageConventions} JS Compiler reports an error if a variable or
 *     field starts with 'MSG_' and isn't a translatable message.
 * @public
 */
// GENERATED CODE -- DO NOT EDIT!

var jspb = require('google-protobuf');
var goog = jspb;
var global = Function('return this')();

goog.exportSymbol('proto.Protocol.Result', null, global);
/**
 * @enum {number}
 */
proto.Protocol.Result = {
  SUCCESS: 0,
  FAILED: 1,
  FAILED_ROOM_NOT_EXISTS_ROOM: 10,
  FAILED_ROOM_ALREADY_EXISTS_ROOM: 11,
  FAILED_ROOM_NOT_IN_ROOM: 12,
  FAILED_GROUP_NOT_EXISTS_GROUP: 20,
  FAILED_GROUP_NOT_IN_GROUP: 21,
  FAILED_GROUP_ALREADY_EXISTS_GROUP: 22,
  FAILED_GROUP_SAME_GROUP: 23,
  FAILED_GROUP_NOT_EXISTS_PLAYER: 24,
  FAILED_GROUP_ALREADY_EXISTS_PLAYER: 25
};

goog.object.extend(exports, proto.Protocol);
