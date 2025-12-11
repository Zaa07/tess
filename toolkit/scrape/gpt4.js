import fetch from 'node-fetch';

async function gpt4(text) {
  const apiUrl = `${global.siptzKey}/api/ai/gpt3`;

  try {
    const res = await fetch(`${apiUrl}?prompt=${global.logic}&content=${encodeURIComponent(text)}`);
    const json = await res.json();

    if (json?.status && json?.data) {
      return json.data;
    } else {
      return 'Terjadi kesalahan saat mengambil data.';
    }
  } catch (e) {
    console.error("Error in gpt4():", e.message);
    return 'Terjadi kesalahan koneksi atau server tidak merespons.';
  }
}

export default gpt4;