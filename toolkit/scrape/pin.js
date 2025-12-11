import axios from 'axios';

async function pinterestSearch(query, type = "image") {
  try {
    const res = await axios.post(`${siptzKey}/api/s/pinterest`, { query, type }, {
      headers: { "Content-Type": "application/json", accept: "*/*" }
    });

    if (!res.data?.status || !Array.isArray(res.data.data)) return [];

    return res.data.data.slice(0, 5).map(item => ({
      title: item.description || item.grid_title || "No title",
      url: item.image_url || item.link,
      pin: item.pin
    }));
  } catch (e) {
    console.error("Pinterest API error:", e.message);
    return [];
  }
}

export default pinterestSearch;