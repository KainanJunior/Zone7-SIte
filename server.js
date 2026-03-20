import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const ADMIN_PASSWORD = "zone7admin";

/* ===== PASTAS ===== */
const publicDir = path.join(__dirname, "public");
const uploadsDir = path.join(__dirname, "uploads");
const dataDir = path.join(__dirname, "data");
const dbFile = path.join(dataDir, "db.json");

fs.mkdirSync(publicDir, { recursive: true });
fs.mkdirSync(uploadsDir, { recursive: true });
fs.mkdirSync(dataDir, { recursive: true });

/* ===== DB ===== */
const defaultDB = {
  settings: {},
  artists: [],
  shop: []
};

function readDB() {
  if (!fs.existsSync(dbFile)) {
    fs.writeFileSync(dbFile, JSON.stringify(defaultDB, null, 2), "utf8");
  }

  try {
    const raw = fs.readFileSync(dbFile, "utf8");
    const parsed = JSON.parse(raw);

    parsed.settings = parsed.settings || {};
    parsed.artists = Array.isArray(parsed.artists) ? parsed.artists : [];
    parsed.shop = Array.isArray(parsed.shop) ? parsed.shop : [];

    return parsed;
  } catch {
    fs.writeFileSync(dbFile, JSON.stringify(defaultDB, null, 2), "utf8");
    return structuredClone(defaultDB);
  }
}

function writeDB(data) {
  const safeData = {
    settings: data?.settings || {},
    artists: Array.isArray(data?.artists) ? data.artists : [],
    shop: Array.isArray(data?.shop) ? data.shop : []
  };

  fs.writeFileSync(dbFile, JSON.stringify(safeData, null, 2), "utf8");
}

/* ===== AUTH ===== */
const sessions = new Set();

function createToken() {
  return crypto.randomBytes(16).toString("hex");
}

function auth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : "";

  if (!sessions.has(token)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  req.token = token;
  next();
}

/* ===== MIDDLEWARE ===== */
app.use(cors());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(publicDir));
app.use("/uploads", express.static(uploadsDir));

/* ===== UPLOAD ===== */
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "");
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, safeName);
  }
});

const upload = multer({ storage });

app.post("/api/upload", auth, upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file" });
  }

  res.json({ url: `/uploads/${req.file.filename}` });
});

/* ===== LOGIN ===== */
app.post("/api/login", (req, res) => {
  if (req.body?.password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Senha errada" });
  }

  const token = createToken();
  sessions.add(token);

  res.json({ token });
});

app.post("/api/logout", auth, (req, res) => {
  sessions.delete(req.token);
  res.json({ ok: true });
});

/* ===== API ===== */
app.get("/api/public", (_req, res) => {
  res.json(readDB());
});

app.get("/api/admin", auth, (_req, res) => {
  res.json(readDB());
});

app.put("/api/admin", auth, (req, res) => {
  writeDB(req.body);
  res.json({ ok: true });
});

/* ===== FALLBACK SPA ===== */
app.use((req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

/* ===== START ===== */
app.listen(PORT, () => {
  console.log(`🔥 Server rodando em http://localhost:${PORT}`);
});