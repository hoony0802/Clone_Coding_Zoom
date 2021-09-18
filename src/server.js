// import WebSocket from "ws";
// import { Server } from "socket.io";
// import { instrument } from "@socket.io/admin-ui";
import express from "express";
import http from "http";
import SocketIO from "socket.io";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (req, res) => res.render("home"));
app.get("/*", (req, res) => res.redirect("/"));

//  * http,WebSocket 둘 다 실행
const httpServer = http.createServer(app);
const wsServer = SocketIO(httpServer);

wsServer.on("connection", (socket) => {
  socket.on("join_room", (roomName) => {
    socket.join(roomName);
    socket.to(roomName).emit("welcome");
  });

  socket.on("offer", (offer, roomName) => {
    socket.to(roomName).emit("offer", offer);
  });

  socket.on("answer", (answer, roomName) => {
    socket.to(roomName).emit("answer", answer);
  });

  socket.on("ice", (ice, roomName) => {
    socket.to(roomName).emit("ice", ice);
  });
});

const handleListen = () => console.log(`Listening on http://localhost:3000`);
httpServer.listen(3000, handleListen);

// * socket.io 구현
/* // * Admin UI
const wsServer = new Server(httpServer, {
  cors: {
    origin: ["https://admin.socket.io"],
    credentials: true,
  },
});

instrument(wsServer, {
  auth: false,
});

const publicRooms = () => {
  const {
    sockets: {
      adapter: { sids, rooms },
    },
  } = wsServer;

  const publicRooms = [];

  rooms.forEach((_, key) => {
    // * private room은 sid와 키가 같다
    if (sids.get(key) === undefined) {
      publicRooms.push(key);
    }
  });

  return publicRooms;
};

// * 방 인원수
const countRoom = (roomName) => {
  return wsServer.sockets.adapter.rooms.get(roomName)?.size;
  // ===  wsServer.sockets.adapter.rooms.get ? 
  // return wsServer.sockets.adapter.rooms.get(roomName).size : reuturn undefined; 
};

wsServer.on("connection", (socket) => {
  socket.nickname = "Anon";

  // * socket.onAny는 미들웨어
  socket.onAny((event) => {
    console.log(`Socket Event: ${event}`);
  });

  // * 클라에서 받아온 roomName은 input.value
  // * 클라에서 받아온 done은 콜백 함수(보안 문제 때문에 클라에서 코드가 실행됨 => 서버는 함수만 호출: 트리거 역할)
  socket.on("enter_room", (roomName, done) => {
    // * socket.id는 유저의 아이디 기본적으로 socket.id와 동일한 private한 방이 있다.
    // * 방 참가
    socket.join(roomName);
    done();
    // * 방에 전체 메세지 전송
    socket.to(roomName).emit("welcome", socket.nickname, countRoom(roomName));

    wsServer.sockets.emit("room_change", publicRooms());
  });

  // * 클라가 서버와 연결이 끊어지기 전에 각각 방에 전체 메세지 전송 가능
  socket.on("disconnecting", () => {
    socket.rooms.forEach((room) =>
      socket.to(room).emit("bye", socket.nickname, countRoom(room) - 1)
    );
  });

  socket.on("disconnect", () => {
    wsServer.sockets.emit("room_change", publicRooms());
  });

  //  * 해당 방에 입력한 메세지 전송
  socket.on("new_message", (msg, room, done) => {
    socket.to(room).emit("new_message", `${socket.nickname}: ${msg}`);
    done();
  });

  socket.on("nickname", (nickname) => (socket.nickname = nickname));
}); */

// * WebSocket 구현
/* const wss = new WebSocket.Server({ server });
const sockets = [];

//  * 브라우저와의 연결
// * 이벤트 함수와 형태 비슷
wss.on("connection", (socket) => {
  // * 메세지는 sockets 배열로
  sockets.push(socket);
  // * 닉네임은 socket 객체의 nickname 키값 바뀔때마다 갱신
  socket.nickname = "Anon";
  console.log("Connected to Browser");
  socket.on("close", () => console.log("Disconnected from the Browser"));
  socket.on("message", (msg) => {
    // * 받은 JSON파일을 객체로 변환
    const message = JSON.parse(msg);
    switch (message.type) {
      case "new_message":
        sockets.forEach((aSocket) =>
          aSocket.send(`${socket.nickname}: ${message.payload}`)
          );
          break;
          
          case "nickname":
            socket.nickname = message.payload;
            break;
          }
        });
      }); */
// app.listen(3000, handleListen);
