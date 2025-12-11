import fetch from 'node-fetch';

async function youtube(url, type = 'mp4') {
  const isValid = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/.test(url);
  if (!isValid) throw new Error('URL YouTube tidak valid');

  try {
    const res = await fetch(`${termaiWeb}/api/downloader/youtube?type=${type}&url=${encodeURIComponent(url)}&key=${termaiKey}`);
    const json = await res.json();

    if (!json.status || !json.data || json.data.status !== 'success') {
      throw new Error('Gagal mengambil data dari API Termai');
    }

    return {
      title: json.data.caption,
      videoId: json.data.vid,
      thumbnail: json.data.thumb,
      type: json.data.fileType,
      quality: json.data.fileQuality,
      downloadLink: json.data.dlink,
      info: json.data.info
    };
  } catch (err) {
    console.error('Scrape Error:', err.message);
    throw err;
  }
}

export default youtube;