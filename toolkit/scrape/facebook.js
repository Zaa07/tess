import axios from "axios";

async function facebookScraper(url) {
  if (!/^https?:\/\/(www\.)?facebook\.(com|watch)\/.+/.test(url)) {
    throw new Error("Invalid Facebook video URL");
  }

  try {
    const response = await axios.get(`${siptzKey}/api/d/facebook`, {
      params: { url },
      headers: {
        accept: "*/*",
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36"
      }
    });

    const { status, data } = response.data;

    if (!status || !data?.data?.length) {
      throw new Error("No video URLs found or malformed response.");
    }

    return {
      status: true,
      title: data.title || "No title",
      thumbnail: data.thumbnail || null,
      duration: data.duration || 0,
      views: data.views || 0,
      comments: data.comments || 0,
      reactions: data.reactions || 0,
      video: data.data.map((item, i) => ({
        url: item.url,
        quality: item.resolution || `Video ${i + 1}`,
        format: item.format || "mp4"
      }))
    };
  } catch (error) {
    throw new Error(`Facebook scrape failed: ${error.message}`);
  }
}

export default facebookScraper;