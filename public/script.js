const socket = io();
const videoGrid = document.getElementById("video-grid");
//NOTE: removing settings from peer constructor solved join-room event not emitting!
const myPeer = new Peer();
let myName = "user";

let myVideoStream;
const myVideo = document.createElement("video");
myVideo.muted = true;
const peers = {};
navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {
    myVideoStream = stream;
    addVideoStream(myVideo, stream);
    myPeer.on("call", (call) => {
      call.answer(stream);
      const video = document.createElement("video");
      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
      });
    });

    socket.on("user-connected", (userId) => {
      console.log("New user!");
      connectToNewUser(userId, stream);
    });
    // input value
    let text = document.querySelector("#chat_message");
    // when press enter send message
    document.querySelector("html").addEventListener("keydown", (e) => {
      let value = text.value;
      if (e.keyCode == 13 && value.length !== 0) {
        socket.emit("message", { message: value, name: myName });
        text.value = "";
      }
    });
    socket.on("createMessage", (data) => {
      let messagesElement = document.querySelector("ul");
      messagesElement.innerHTML += `<li class="message"><b>${data.name}</b><br/>${data.message}</li>`;

      scrollToBottom();
    });
    socket.on("timer", (time) => {
      document.querySelector("#meetingTimer").innerHTML = time;
    });
  });

socket.on("user-disconnected", (userId) => {
  if (peers[userId]) peers[userId].close();
});

myPeer.on("open", (id) => {
  const userName = localStorage.getItem("userName");
  if (userName) {
    myName = userName;
  } else {
    setUserName();
  }

  socket.emit("join-room", ROOM_ID, { id: id, name: myName });
});

function connectToNewUser(userId, stream) {
  const call = myPeer.call(userId, stream);
  const video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream);
  });
  call.on("close", () => {
    video.remove();
  });

  peers[userId] = call;
}

function addVideoStream(video, stream) {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });
  videoGrid.append(video);
}

const scrollToBottom = () => {
  var d = document.querySelector(".main__chat_window");
  d.scrollTop = d.scrollHeight;
};

const muteUnmute = () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    setUnmuteButton();
  } else {
    setMuteButton();
    myVideoStream.getAudioTracks()[0].enabled = true;
  }
};

const playStop = () => {
  console.log("object");
  let enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    setPlayVideo();
  } else {
    setStopVideo();
    myVideoStream.getVideoTracks()[0].enabled = true;
  }
};

const setMuteButton = () => {
  const html = `
    <i class="fas fa-microphone"></i>
    <span>Mute</span>
  `;
  document.querySelector(".main__mute_button").innerHTML = html;
};

const setUnmuteButton = () => {
  const html = `
    <i class="unmute fas fa-microphone-slash"></i>
    <span>Unmute</span>
  `;
  document.querySelector(".main__mute_button").innerHTML = html;
};

const setStopVideo = () => {
  const html = `
    <i class="fas fa-video"></i>
    <span>Stop Video</span>
  `;
  document.querySelector(".main__video_button").innerHTML = html;
};

const setPlayVideo = () => {
  const html = `
  <i class="stop fas fa-video-slash"></i>
    <span>Play Video</span>
  `;
  document.querySelector(".main__video_button").innerHTML = html;
};

const setUserName = () => {
  var person = prompt("Please enter your name", "Harry Potter");
  if (person != null) {
    localStorage.setItem("userName", person);
  }
};
