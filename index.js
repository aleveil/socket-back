const gridX = 20;
const gridY = 20;

let grid = [];

for (let y = 0; y < gridY; y++) {
  grid.push([]);
  for (let x = 0; x < gridX; x++) {
    grid[y].push(0);
  }
}

console.log(grid);

const port = 3000;
const io = require("socket.io")(port, {
  cors: {
    origin: ["http://localhost:5173"],
  },
});

io.on("connection", (socket) => {
  socket.on("request-grid", () => {
    io.to(socket.id).emit("receive-grid", grid);
  });

  socket.on("send-grid", (clickPos) => {
    grid[clickPos.x][clickPos.y] = clickPos.color;
    io.emit("receive-grid", grid);
  });
});
