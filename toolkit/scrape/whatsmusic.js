import axios from 'axios';

async function whatsmusic(audioBuffer, termaiWeb, termaiKey) {
  try {
    const response = await axios.post(
      `${termaiWeb}/api/audioProcessing/whatmusic?key=${termaiKey}`,
      audioBuffer,
      {
        headers: { 'Content-Type': 'audio/mpeg' }
      }
    );

    if (response.data?.status && response.data.data) {
      const { title, artists, acrid } = response.data.data;
      return { success: true, title, artists, acrid };
    } else {
      return { success: false, message: 'Lagu tidak dikenali.' };
    }

  } catch (error) {
    return { success: false, message: 'Gagal request: ' + (error.response?.data?.message || error.message) };
  }
}

export default whatsmusic;