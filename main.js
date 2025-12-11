import fs from "fs";
import path from "path";
import pino from "pino";
import chalk from "chalk";
import readline from "readline";
import { Boom } from "@hapi/boom";
import { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } from "@whiskeysockets/baileys";
import { fileURLToPath } from "url";

import stg from "./toolkit/setting.js";
import makeInMemoryStore from "./toolkit/store.js";
import Cc from "./session/setCfg.js";
import { cekSholat } from "./toolkit/pengingat.js";
import emtData from "./toolkit/transmitter.js";
import evConnect from "./toolkit/connect.js";

const {
  replaceLid,
  messageContent,
  labvn,
  saveLidCache,
  checkSpam
} = emtData;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logger = pino({ level: "silent" });
const store = makeInMemoryStore();

let conn;

global.plugins = {};
global.categories = {};
global.lidCache = {};
global.initDB = global.initDB || (() => {});
global.initDB();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
const question = (q) => new Promise((res) => rl.question(q, res));

const startBot = async () => {
  try {
    const { version } = await fetchLatestBaileysVersion(); // pakai versi valid
    const { state, saveCreds } = await useMultiFileAuthState("./session");

    conn = makeWASocket({
      auth: state,
      version,
      logger,
      printQRInTerminal: true,
      syncFullHistory: false,
      markOnlineOnConnect: false,
      browser: ["Linux", "Chrome", "100.0"],
      messageCache: 1000,
    });

    conn.ev.on("creds.update", saveCreds);
    store.bind(conn.ev);

    evConnect(conn, startBot);

    conn.ev.on("messages.upsert", async ({ messages }) => {
      try {
        const msg = messages?.[0];
        if (!msg?.message) return;

        const { chatId, isGroup, senderId, pushName } = exCht(msg);

        let groupMeta;
        if (isGroup) {
          groupMeta = await getMetadata(chatId, conn);
          if (groupMeta) await saveLidCache(groupMeta);
        }

        replaceLid(msg);

        const { textMessage, mediaInfo } = messageContent(msg);
        if (!textMessage && !mediaInfo) return;

        const time = Format.indoTime("Asia/Jakarta", "HH:mm");
        const senderNumber = senderId.split("@")[0];

        if (!senderNumber) return;

        const userDb = getUser(senderId);
        const isPrem = userDb?.data?.isPremium?.isPrem;

        console.log(chalk.yellowBright(`🟡 [${time}] ${pushName || senderNumber}`));
        if (mediaInfo || textMessage) console.log(chalk.blueBright(`${mediaInfo || textMessage}`));

        if (banned(senderId)) return;

        if (await checkSpam(senderId, conn, chatId, msg)) return;

        // Filter group, badword, mute
        for (const fn of [groupFilter, badwordFilter, async () => mute(chatId, senderId)]) {
          if (await fn(conn, msg, chatId, senderId, isGroup)) return;
        }

        // handle AFK & notifications
        await cancelAfk(senderId, chatId, msg, conn);
        await afkTag(msg, conn);

        // execute plugins
        const tryRun = async (parsed, prefixUsed) => {
          if (!parsed) return;
          const { commandText, chatInfo } = parsed;
          for (const [fileName, plugin] of Object.entries(global.plugins)) {
            if (!plugin?.command?.includes(commandText)) continue;
            try {
              await plugin.run(conn, msg, { ...parsed, isPrefix: stg.isPrefix, store });
            } catch (err) {
              console.error(chalk.redBright(`❌ Plugin error: ${fileName}`), err);
            }
            break;
          }
        };

        for (const parse of [parseMessage(msg, stg.isPrefix), parseNoPrefix(msg)]) {
          await tryRun(parse, !!parse.prefix);
        }
      } catch (msgError) {
        console.error("❌ Message handler error:", msgError);
      }
    });

    conn.ev.on("group-participants.update", async (update) => {
      try {
        const { id, participants, action } = update;
        if (!participants) return;

        if (enWelcome(id) && action === "add") {
          for (const p of participants) {
            const mention = `@${p.split("@")[0]}`;
            await conn.sendMessage(id, {
              text: getWelTxt(id).replace(/%user/g, mention),
              mentions: [p],
            });
          }
        }
      } catch (gErr) {
        console.error("Group event error:", gErr);
      }
    });

  } catch (err) {
    console.error(chalk.redBright("❌ Error saat menjalankan bot:"), err);
  }
};

console.log(chalk.cyanBright.bold("Bot telah dimulai!"));
loadPlug();
startBot();
