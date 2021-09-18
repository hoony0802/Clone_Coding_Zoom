const socket = io();

const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const camerasSelect = document.getElementById("cameras");
const call = document.getElementById("call");

call.hidden = true;

let myStream;
let muted = false;
let cameraOff = false;
let roomName;
let myPeerConnection;
let myDataChannel;

async function getCameras() {
  try {
    // * 카메라 기기만 필터
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter((device) => device.kind === "videoinput");
    const currentCamera = myStream.getVideoTracks()[0];

    cameras.forEach((camera) => {
      const option = document.createElement("option");
      option.value = camera.deviceId;
      option.innerText = camera.label;

      if (currentCamera.label === camera.label) {
        option.selected = true;
      }

      camerasSelect.appendChild(option);
    });
  } catch (e) {
    console.log(e);
  }
}

async function getMedia(deviceId) {
  const initialConstraints = {
    audio: true,
    // * 모바일 브라우저 실행했을때 셀카로 default
    video: { facingMode: "user" },
  };

  const cameraConstraints = {
    audio: true,
    // * 선택한 카메라 설정
    video: { deviceId: { exact: deviceId } },
  };

  try {
    // * 오디오, 비디오 사용 허가
    myStream = await navigator.mediaDevices.getUserMedia(
      deviceId ? cameraConstraints : initialConstraints
    );

    myFace.srcObject = myStream;

    // * 처음 렌더링 될때만 실행됨
    if (!deviceId) {
      await getCameras();
    }
  } catch (e) {
    console.log(e);
  }
}

function handleMuteClick() {
  // * 오디오 상태 변환
  myStream
    .getAudioTracks()
    .forEach((track) => (track.enabled = !track.enabled));

  if (!muted) {
    muteBtn.innerText = "Unmute";
    muted = true;
  } else {
    muteBtn.innerText = "Mute";
    muted = false;
  }
}

function handleCameraClick() {
  // * 비디오 상태 변환
  myStream
    .getVideoTracks()
    .forEach((track) => (track.enabled = !track.enabled));

  if (cameraOff) {
    cameraBtn.innerText = "Turn Camera Off";
    cameraOff = false;
  } else {
    cameraBtn.innerText = "Turn Camera On";
    cameraOff = true;
  }
}

async function handleCameraChange() {
  await getMedia(camerasSelect.value);

  if (myPeerConnection) {
    const videoTrack = myStream.getVideoTracks()[0];
    const videoSender = myPeerConnection
      .getSenders()
      .find((sender) => sender.track.kind === "video");

    videoSender.replaceTrack(videoTrack);
  }
}

muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
camerasSelect.addEventListener("input", handleCameraChange);

// * Welcome Form (방 참가)
const welcome = document.querySelector("#welcome");
const welcomeForm = welcome.querySelector("form");

async function initCall() {
  welcome.hidden = true;
  call.hidden = false;
  await getMedia();
  makeConnection();
}

async function handleWelcomeSubmit(event) {
  event.preventDefault();
  const input = welcomeForm.querySelector("input");
  await initCall();
  socket.emit("join_room", input.value);
  roomName = input.value;
  input.value = "";
}

welcomeForm.addEventListener("submit", handleWelcomeSubmit);

// * Socket code
// Peer A
socket.on("welcome", async () => {
  // * Data Channel
  myDataChannel = myPeerConnection.createDataChannel("chat");
  myDataChannel.addEventListener("message", console.log);
  console.log("made data channel");

  const offer = await myPeerConnection.createOffer();
  myPeerConnection.setLocalDescription(offer);
  console.log("sent the offer");
  socket.emit("offer", offer, roomName);
});

// Peer B
socket.on("offer", async (offer) => {
  // * Data Channel
  myPeerConnection.addEventListener("datachannel", (event) => {
    myDataChannel = event.channel;
    myDataChannel.addEventListener("message", console.log);
  });

  console.log("received the offer");
  myPeerConnection.setRemoteDescription(offer);
  const answer = await myPeerConnection.createAnswer();
  myPeerConnection.setLocalDescription(answer);
  socket.emit("answer", answer, roomName);
  console.log("sent the answer");
});

// to Peer A
socket.on("answer", (answer) => {
  console.log("received the answer");
  myPeerConnection.setRemoteDescription(answer);
});

socket.on("ice", (ice) => {
  console.log("received candidate");
  myPeerConnection.addIceCandidate(ice);
});

// * webRTC code
function makeConnection() {
  // * 임시 Stun Server
  myPeerConnection = new RTCPeerConnection({
    iceServers: [
      {
        urls: [
          "stun:stun.l.google.com:19302",
          "stun:stun1.l.google.com:19302",
          "stun:stun2.l.google.com:19302",
          "stun:stun3.l.google.com:19302",
          "stun:stun4.l.google.com:19302",
        ],
      },
    ],
  });
  myPeerConnection.addEventListener("icecandidate", handleIce);
  myPeerConnection.addEventListener("addstream", handleAddStream);
  myStream
    .getTracks()
    .forEach((track) => myPeerConnection.addTrack(track, myStream));
}

function handleIce(data) {
  console.log("sent the candidate");
  socket.emit("ice", data.candidate, roomName);
}

function handleAddStream(data) {
  const peerFace = document.querySelector("#peerFace");
  peerFace.srcObject = data.stream;
}

// * socket.io
/* const welcome = document.querySelector("#welcome");
const room = document.querySelector("#room");
const form = welcome.querySelector("form");

room.hidden = true;

let roomName;

const addMessage = (message) => {
  const ul = room.querySelector("ul");
  const li = document.createElement("li");
  li.innerText = message;
  ul.append(li);
};

const handleMessageSubmit = (event) => {
  event.preventDefault();
  const input = room.querySelector("#msg input");
  const value = input.value;

  socket.emit("new_message", input.value, roomName, () => {
    addMessage(`You: ${value}`);
  });
  input.value = "";
};

const handleNicknameSubmit = (event) => {
  event.preventDefault();
  const input = room.querySelector("#name input");
  socket.emit("nickname", input.value);
};

const showRoom = () => {
  welcome.hidden = true;
  room.hidden = false;

  const h3 = room.querySelector("h3");
  h3.innerText = `Room ${roomName}`;

  const msgForm = room.querySelector("#msg");
  const nameForm = room.querySelector("#name");
  msgForm.addEventListener("submit", handleMessageSubmit);
  nameForm.addEventListener("submit", handleNicknameSubmit);
};

const handleRoomSubmit = (event) => {
  event.preventDefault();
  const input = form.querySelector("input");
  // * 메세지 전송
  // * 첫번째 인자: 이벤트 이름(e.g. enter_room) 아무거나 가능
  // * 두번째 인자: 객체일 경우 형변환 안해도 자동 변환됨
  // * 세번째 인자: 서버에서 호출하는 콜백 함수 (콜백 함수는 무적권 맨 뒤에 있어야함!!!)
  socket.emit("enter_room", input.value, showRoom);
  roomName = input.value;
  input.value = "";
};

form.addEventListener("submit", handleRoomSubmit);

socket.on("welcome", (user, newCount) => {
  const h3 = room.querySelector("h3");
  h3.innerText = `Room ${roomName} (${newCount})`;
  addMessage(`${user} Joined!`);
});

socket.on("bye", (left, newCount) => {
  const h3 = room.querySelector("h3");
  h3.innerText = `Room ${roomName} (${newCount})`;
  addMessage(`${left} left ㅠㅠ`);
});

socket.on("new_message", addMessage);

// * Open room 확인 가능
socket.on("room_change", (rooms) => {
  const roomList = welcome.querySelector("ul");

  roomList.innerHTML = "";
  if (!rooms.length) {
    return;
  }

  rooms.forEach((room) => {
    const li = document.createElement("li");
    li.innerText = room;
    roomList.append(li);
  });
}); */

// * WebSocket 구현
/* //  * 서버와의 연결
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
 */
