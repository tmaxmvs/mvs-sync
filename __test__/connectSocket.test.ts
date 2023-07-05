// import WebSocket from "ws";
// import { SyncManager } from "./utils/util/SyncManager";
//
// // 웹소켓 서버 URL
// const serverUrl = "ws://192.168.153.146:30080/";
//
// describe("웹소켓 서버 테스트", () => {
//   let syncManager: SyncManager;
//
//   beforeEach(() => {
//     syncManager = new SyncManager(serverUrl);
//   });
//
//   afterEach(() => {
//     if (syncManager.socket.readyState === 1) {
//       syncManager.socket.close();
//     }
//   });
//
//   test("서버에 연결할 수 있는지 확인", (done) => {
//     syncManager.socket.onopen = () => {
//       expect(syncManager.socket.readyState).toBe(WebSocket.OPEN);
//       done();
//     };
//   });
// });
