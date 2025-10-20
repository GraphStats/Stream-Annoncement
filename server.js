import express from "express";
import fs from "fs";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const FILE_PATH = path.join(__dirname, "annonces.json");

app.use(express.json());
app.use(express.static("public"));

// Lire les annonces depuis le JSON
function readAnnonces() {
  if (!fs.existsSync(FILE_PATH)) return [];
  return JSON.parse(fs.readFileSync(FILE_PATH, "utf8") || "[]");
}

// Écrire dans le JSON
function writeAnnonces(data) {
  fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2));
}

// --- Routes ---
app.get("/annonces", (req, res) => {
  res.json(readAnnonces());
});

app.post("/annonces", (req, res) => {
  const annonces = readAnnonces();
  annonces.push(req.body.text);
  writeAnnonces(annonces);
  io.emit("update", annonces);
  res.json({ success: true });
});

app.put("/annonces/:index", (req, res) => {
  const annonces = readAnnonces();
  const index = parseInt(req.params.index);
  const newText = req.body.text;
  if (index >= 0 && index < annonces.length && newText) {
    annonces[index] = newText;
    writeAnnonces(annonces);
    io.emit("update", annonces);
  }
  res.json({ success: true });
});

app.get("/admin", (_, res) => res.sendFile(__dirname + "/public/admin.html"));
app.get("/client", (_, res) => res.sendFile(__dirname + "/public/client.html"));

// --- WebSocket ---
io.on("connection", (socket) => {
  socket.emit("update", readAnnonces());
});

server.listen(3000, () =>
  console.log("✅ Serveur lancé sur http://localhost:3000"),
);
