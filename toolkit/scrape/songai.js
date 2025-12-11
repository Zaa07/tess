import axios from 'axios';

export async function songAiStream(prompt) {
  try {
    const response = await axios({
      method: 'post',
      url: `${global.termaiWeb}/api/audioProcessing/song-generator`,
      params: { prompt, key: global.termaiKey },
      responseType: 'stream'
    });

    return response.data;
  } catch (err) {
    throw new Error(err.message || 'Gagal menghubungi API SongAI');
  }
}