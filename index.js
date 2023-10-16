const express = require("express");
const app = express();
const http = require("http");
const port = process.env.PORT || 3000;
const { Server } = require("socket.io");
const cors = require("cors");
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.get("/", (req, res) => {
  res.send("Hello world");
});

server.listen(port, () => {
  console.log(`listening on *:${port}`);
});

const fs = require("fs");

const getIP = (socket) => {
  let result = socket.handshake.headers["x-forwarded-for"];
  if (!result) result = socket.handshake.address;
  return result;
};

const users = [];
const clickCooldownMinute = 1;

const gridSize = 50;
if (!fs.existsSync("./grid.json")) {
  let grid = [];
  for (let i = 0; i < gridSize; i++) {
    grid.push([]);
    for (let j = 0; j < gridSize; j++) {
      grid[i].push(0);
    }
  }
  fs.writeFile("grid.json", JSON.stringify(grid), (err) => {
    if (err) console.error(err);
  });
}

io.on("connection", (socket) => {
  console.log(`Connection from IP : ${getIP(socket)}`);

  socket.on("request-nextclicktime", () => {
    const user = users.find((user) => user.address === getIP(socket));
    const nextclicktime = user
      ? clickCooldownMinute * 60 * 1000 + user.lastClick
      : 0;
    console.log("request nextClickTime", getIP(socket), user);
    io.to(socket.id).emit("receive-nextclicktime", new Date(nextclicktime));
  });

  socket.on("request-grid", () => {
    // read grid.json
    fs.readFile("grid.json", (err, rawData) => {
      if (err) console.error(err);
      let data = JSON.parse(rawData);
      io.to(socket.id).emit("receive-grid", data);
    });
  });

  socket.on("send-grid", (clickPos) => {
    let user = users.find((user) => user.address === getIP(socket));
    if (user) {
      if (Date.now() - user.lastClick <= clickCooldownMinute * 60 * 1000) {
        console.log(`Cooldown : ${Date.now() - user.lastClick}`);
        return;
      }
    } else {
      users.push({
        address: getIP(socket),
      });
      user = users.find((user) => user.address === getIP(socket));
    }

    // read grid.json
    fs.readFile("grid.json", (err, rawData) => {
      if (err) console.error(err);
      let data = JSON.parse(rawData);
      data[clickPos.x][clickPos.y] = clickPos.color; // edit grid
      // write grid.json
      fs.writeFile("grid.json", JSON.stringify(data), (err) => {
        if (err) console.error(err);
        (user.lastClick = Date.now()), io.emit("receive-grid", data);
      });
    });
  });
});
