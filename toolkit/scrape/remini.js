import axios from "axios";
import FormData from "form-data";
import fs from "fs";

async function remini(imagePathOrBuffer, scale = 4) {
  try {
    const form = new FormData();

    if (Buffer.isBuffer(imagePathOrBuffer)) {
      form.append("image", imagePathOrBuffer, {
        filename: "image.jpg",
        contentType: "image/jpeg",
      });
    } else {
      form.append("image", fs.createReadStream(imagePathOrBuffer));
    }

    form.append("scale", scale);

    const response = await axios.post(
     `${global.siptzKey}/api/iloveimg/upscale`,
      form,
      {
        headers: {
          ...form.getHeaders(),
          accept: "*/*",
        },
        responseType: "arraybuffer",
        timeout: 60000,
      }
    );

    return Buffer.from(response.data);
  } catch (error) {
    console.error(
      "Upscale error:",
      error.response?.status,
      error.response?.statusText
    );
    throw new Error(error?.response?.data?.message || error.message);
  }
}

export default remini;