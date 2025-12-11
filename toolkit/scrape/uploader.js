import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

async function uploadToCatbox(filePath) {
  try {
    const form = new FormData();
    form.append("reqtype", "fileupload");
    form.append("userhash", "");
    form.append("fileToUpload", fs.createReadStream(filePath), {
      filename: "image.jpg",
      contentType: "image/jpeg",
    });

    const response = await axios.post("https://catbox.moe/user/api.php", form, {
      headers: {
        ...form.getHeaders(),
      },
      timeout: 30000,
    });

    if (response.data.startsWith("https://")) {
      return response.data;
    } else {
      throw new Error(`Gagal mengunggah ke Catbox: ${response.data}`);
    }
  } catch (error) {
    throw new Error(`Error saat mengunggah ke Catbox: ${error.message}`);
  }
}

export default uploadToCatbox;