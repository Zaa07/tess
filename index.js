import fs from "fs";
import path from "path";
import https from "https";
import { fork } from "child_process";
import { fileURLToPath, pathToFileURL } from "url";

// Tampilkan startup banner
console.log("Starting...\n");

// Set dirname
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Tampilkan LICENSE kalau ada
const licensePath = path.join(__dirname, "LICENSE");
if (fs.existsSync(licensePath)) {
  console.log(fs.readFileSync(licensePath, "utf8") + "\n");
} else {
  console.warn("⚠ LICENSE tidak ditemukan.");
}

// Pastikan folder session & temp ada
["session", "temp"].forEach((dir) => {
  const full = path.join(__dirname, dir);
  if (!fs.existsSync(full)) fs.mkdirSync(full, { recursive: true });
});

// Fungsi download dengan timeout & fallback
const downloadAndSave = (url, dest, timeout = 15000) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const request = https.get(url, (res) => {
      if (res.statusCode !== 200) {
        file.close();
        fs.unlinkSync(dest, { force: true });
        return reject(new Error(`Status code: ${res.statusCode}`));
      }
      res.pipe(file).on("finish", () => file.close(resolve));
    });

    // Timeout
    request.setTimeout(timeout, () => {
      request.destroy(new Error("Request timeout"));
      reject(new Error("Download timeout"));
    });

    request.on("error", (err) => {
      fs.existsSync(dest) && fs.unlinkSync(dest);
      reject(err);
    });
  });
};

// Start child process
const startBot = () => {
  const child = fork(path.join(__dirname, "main.js"), process.argv.slice(2), {
    stdio: ["inherit", "inherit", "inherit", "ipc"],
  });

  // Handle messages from child
  child.on("message", (msg) => {
    if (msg === "reset") {
      console.info("🔄 Restarting...");
      child.kill();
    } else if (msg === "uptime") {
      child.send(process.uptime());
    }
  });

  // Restart logic with delay
  child.on("exit", (code) => {
    console.warn(`Child exited with code ${code}. Restarting in 5s...`);
    setTimeout(() => startBot(), 5000);
  });
};

// URL konfigurasi remote
const remoteURL =
  "https://raw.githubusercontent.com/MaouDabi0/Dabi-Ai-Documentation/main/setCfg.js";
const localFile = path.join(__dirname, "session", "setCfg.js");

// Download dengan retry sekali
(async () => {
  try {
    await downloadAndSave(remoteURL, localFile);
    console.log("✔ Remote config berhasil diunduh.");
    await import(pathToFileURL(localFile).href);
    startBot();
  } catch (error) {
    console.error("❌ Gagal memuat remote config:", error.message);
    console.warn("⚠ Lanjut menjalankan bot tanpa config remote.");
    startBot();
  }
})();
