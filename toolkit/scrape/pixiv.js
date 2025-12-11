import axios from 'axios';
import https from 'https';

async function pixiv(characterName, r18 = false) {
  const agent = new https.Agent({ rejectUnauthorized: false })
  const encodedCharacterName = encodeURIComponent(characterName)
  const mode = r18 ? 'r18' : 'all'
  const searchUrl = `https://www.pixiv.net/ajax/search/artworks/${encodedCharacterName}?word=${encodedCharacterName}&order=date_d&mode=${mode}&p=1&s_mode=s_tag_full&type=illust&lang=en`

  try {
    const searchResponse = await axios.get(searchUrl, {
      httpsAgent: agent,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.pixiv.net/'
      },
      timeout: 10000
    })

    const data = searchResponse.data
    if (!data.body?.illustManga?.data?.length) return null

    const artwork = data.body.illustManga.data[Math.floor(Math.random() * data.body.illustManga.data.length)]
    const detailUrl = `https://www.pixiv.net/ajax/illust/${artwork.id}`
    const detailResponse = await axios.get(detailUrl, {
      httpsAgent: agent,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': `https://www.pixiv.net/artworks/${artwork.id}`
      }
    })

    const hdUrl = detailResponse.data.body.urls.original
    const imageResponse = await axios.get(hdUrl.replace('_webp', ''), {
      responseType: 'arraybuffer',
      httpsAgent: agent,
      headers: {
        'Referer': 'https://www.pixiv.net/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 15000
    })

    return {
      buffer: Buffer.from(imageResponse.data),
      caption:
        `${characterName} - Artwork${r18 ? ' (R-18)' : ''}\n` +
        `Judul: ${artwork.title}\n` +
        `Author: ${artwork.userName}\n` +
        `https://www.pixiv.net/artworks/${artwork.id}`
    }
  } catch (error) {
    throw error
  }
}

export default pixiv;