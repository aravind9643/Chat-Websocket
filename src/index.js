const io = require("socket.io")(3001, {
  cors: { origin: "*" }
});
const PORT = process.env.PORT || 3000;
const INDEX = '/index.html';

const server = express()
  .use((req, res) => res.sendFile(INDEX, { root: __dirname }))
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

const users = [];

const getUsers = () => {
  const usersList = [];
  users.forEach((user) => {
    if (!user.username) {
      user.disconnect();
      return;
    }
    usersList.push({
      username: user.username || "",
      id: user.id
    });
  });
  return usersList;
};

io.sockets.on("connection", (socket) => {
  console.log("Client connected : ", socket.id);
  console.log("Users Count : ", users.length);
  socket.emit("connection", "Succesfully Connected");
  socket.on("disconnect", (socket) => {
    var i = users.indexOf(socket);
    users.splice(i, 1);
    console.log("Client disconnected : ", socket);
    console.log("Users Count : ", users.length);
    io.sockets.emit("users", getUsers());
  });
  socket.on("username", (data) => {
    if (users.find((user) => user.username === data)) {
      socket.emit("usernameExists", data);
      return;
    }

    socket.username = data;
    users.push(socket);
    console.log("Username added : ", data);
    socket.emit("usernameAdded", data);
    io.sockets.emit("users", getUsers());
  });
  socket.on("message", (data) => {
    const currentDate = new Date();
    let messageData = {
      username: socket.username,
      message: data,
      date: currentDate.toISOString(),
      id: "" + currentDate.getTime()
    };
    socket.broadcast.emit("message", {
      ...messageData,
      direction: "in"
    });
    socket.emit("message", {
      ...messageData,
      direction: "out"
    });
  });
});