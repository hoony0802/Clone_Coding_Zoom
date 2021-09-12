//  * 서버와의 연결
const socket = new WebSocket(`ws://${window.location.host}`);
const messageList = document.querySelector("ul");
const nickForm = document.querySelector("#nick");
const messageForm = document.querySelector("#message");

socket.addEventListener("open", () => {
  console.log("Connected to Server");
});

// * 서버로부터 메세지 받음
socket.addEventListener("message", (message) => {
  const li = document.createElement("li");
  li.innerText = message.data;
  messageList.append(li);
});

socket.addEventListener("close", () => {
  console.log("DisConnected from Server");
});

// * 서버로 메세지 전송
// setTimeout(() => {
//   socket.send("hello from the Browser!");
// }, 10000);

// * 서버와 통신하기 위해 객체로 변환 후 JSON으로 전송
const makeMessage = (type, payload) => {
  const msg = { type, payload };
  return JSON.stringify(msg);
};

const handleNickSubmit = (event) => {
  event.preventDefault();
  const input = nickForm.querySelector("input");
  socket.send(makeMessage("nickname", input.value));
};

const handleSubmit = (event) => {
  event.preventDefault();
  const input = messageForm.querySelector("input");
  socket.send(makeMessage("new_message", input.value));
  const li = document.createElement("li");
  li.innerText = `You: ${input.value}`;
  messageList.append(li);
  input.value = "";
};

nickForm.addEventListener("submit", handleNickSubmit);
messageForm.addEventListener("submit", handleSubmit);
