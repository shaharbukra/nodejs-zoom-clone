const express = require("express");
const app = express();
// const cors = require('cors')
// app.use(cors())
const server = require("http").Server(app);
const io = require("socket.io")(server);
const { ExpressPeerServer } = require("peer");
const peerServer = ExpressPeerServer(server, {
  debug: true,
});
const User = require("./user.js");
const { v4: uuidV4 } = require("uuid");

let USER_LIST = {};

app.use("/peerjs", peerServer);

app.set("view engine", "ejs");
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.redirect(`/${uuidV4()}`);
});

app.get("/:room", (req, res) => {
  res.render("room", { roomId: req.params.room });
});

/**
 * @description Emits message to all users in a specific room
 * @param room {string} - Room name/id
 * @param emit {string} - Name of message to emit
 * @param message {any} - Message to be sent
 **/
const sendTimeToAllRooms = (timer) =>{
  for (let i in USER_LIST) {
    sendToAllRoom(USER_LIST[i].room,'timer',timer);
  }
}
const sendToAllRoom = (room, emit, message) => {
  if (Array.isArray(USER_LIST)) {
    const data = USER_LIST.filter((u) => u.room === room);
    if (data) {
      USER_LIST[data.room].socket.emit(emit, message);
    }
  } else {
    for (let i in USER_LIST) {
      if (USER_LIST[i] && USER_LIST[i].room == room) {
        USER_LIST[i].socket.emit(emit, message);
      }
    }
  }
};

io.on("connection", (socket) => {
  //DEBUG: JOIN-ROOM NOT BEING SENT
  //FIXED: JOIN-ROOM SENT CREATED HELPER FUNCTION ABOVE CALLED SENDTOALLROOM
  socket.on("join-room", (roomId, userId) => {
    socket.id = userId;
    socket.room = roomId;
    socket.join(roomId);

    sendToAllRoom(roomId, "user-connected", userId);
    console.log(`joined ${roomId}`);

    USER_LIST[socket.id] = new User({
      name: `User_${USER_LIST.length}`,
      socket: socket,
    });
  });

  // messages
  socket.on("message", (data) => {
    if (USER_LIST[socket.id]) {
      console.log(data.message, USER_LIST[socket.id].room);
      //send message to the same room
      sendToAllRoom(USER_LIST[socket.id].room, "createMessage", data);
    }
  });

  socket.on("disconnect", () => {
    if (USER_LIST[socket.id]) {
      sendToAllRoom(USER_LIST[socket.id].room, "user-disconnected", socket.id);
      delete USER_LIST[socket.id];
    }
  });
});

let timeLeft = 30;
setInterval(countdown, 1000);
    
function countdown() {
  if (timeLeft == -1) {
    timeLeft = 30;
  } else {
    //elem.innerHTML = timeLeft + ' seconds remaining';
    sendTimeToAllRooms(timeLeft);
    timeLeft--;
  }
}

server.listen(process.env.PORT || 3030);
console.log("server started");
