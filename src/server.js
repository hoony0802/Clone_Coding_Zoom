import express from "express";
import http from "http";
import WebSocket from "ws";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (req, res) => res.render("home"));
app.get("/*", (req, res) => res.redirect("/"));

const handleListen = () => console.log(`Listening on http://localhost:3000`);
// app.listen(3000, handleListen);

//  * http,WebSocket 둘 다 실행
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

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
});

server.listen(3000, handleListen);
