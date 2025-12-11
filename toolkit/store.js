const makeInMemoryStore = () => {
  const messages = {};

  const loadMessage = async (remoteJid, stanzaId) =>
    messages[remoteJid]?.array?.find(m => m.key?.id === stanzaId) || null;

  const bind = (ev) => {
    ev.on('messages.upsert', ({ messages: newMsgs }) => {
      for (const msg of newMsgs) {
        const jid = msg.key?.remoteJid;
        if (!jid) continue;

        const store = messages[jid] ||= { array: [] };
        if (!store.array.find(m => m.key?.id === msg.key?.id)) {
          store.array.push(msg);
          if (store.array.length > 100) store.array.shift();
        }
      }
    });
  };

  return { messages, bind, loadMessage };
};

export default makeInMemoryStore