import axios from "axios";

export async function img2video(imageBuffer, termaiWeb, termaiKey) {
  return new Promise(async (resolve, reject) => {
    try {
      const urlReq = `${termaiWeb}/api/img2video/luma?key=${termaiKey}`;

      const response = await axios.post(urlReq, imageBuffer, {
        headers: { "Content-Type": "application/octet-stream" },
        responseType: "stream",
      });

      let lastUrl = null;

      response.data.on("data", (chunk) => {
        try {
          const eventString = chunk.toString();
          const eventData = eventString.match(/data: (.+)/);
          if (!eventData || !eventData[1]) return;

          const data = JSON.parse(eventData[1]);

          if (data.url) {
            lastUrl = data.url;
          }

          switch (data.status) {
            case "pending":
            case "processing":
            case "generating":
            case "queueing":
              break;
            case "failed":
              response.data.destroy();
              reject(data);
              break;
            case "completed":
              response.data.destroy();
              resolve(data.url ? data : { ...data, url: lastUrl });
              break;
          }
        } catch (err) {
          response.data.destroy();
          reject(err);
        }
      });

      response.data.on("error", (err) => reject(err));
    } catch (error) {
      reject(error);
    }
  });
}