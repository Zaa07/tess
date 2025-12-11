import axios from 'axios';

export async function danbooru(query, mode = '18+') {
  try {
    const processedQuery = query.replace(/ /g, '_');
    const ratingFilter = mode === 'safe' ? ['s'] : ['q', 'e'];
    const url = `https://danbooru.donmai.us/posts.json?tags=${encodeURIComponent(processedQuery)}+rating:${ratingFilter.join(',')}&limit=100&random=true`;

    const { data: posts } = await axios.get(url, { timeout: 20000 });

    if (!posts || !Array.isArray(posts) || posts.length === 0) {
      throw new Error(`Tidak ada hasil dari Danbooru untuk: ${query}`);
    }

    const allowedExtensions = ['jpg', 'jpeg', 'png'];
    const filteredPosts = posts.filter(post =>
      post &&
      post.rating &&
      ratingFilter.includes(post.rating) &&
      post.file_ext &&
      allowedExtensions.includes(post.file_ext)
    );

    if (filteredPosts.length === 0) {
      throw new Error(`Tidak ditemukan gambar (foto) untuk: ${query}\n(Mungkin hasilnya hanya video/gif)`);
    }

    const pick = filteredPosts[Math.floor(Math.random() * filteredPosts.length)];

    if (!pick || !pick.file_url) {
      throw new Error('Postingan yang dipilih tidak memiliki URL media yang valid.');
    }

    const fullFileUrl = pick.file_url.startsWith('http') ? pick.file_url : `https://danbooru.donmai.us${pick.file_url}`;

    return {
      tags: pick.tag_string,
      source: pick.source,
      id: pick.id,
      full_file_url: fullFileUrl
    };

  } catch (error) {
    throw new Error(`Scrape Danbooru gagal: ${error.message}`);
  }
}