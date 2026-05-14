import axios from "axios";

const BASE = "https://graph.facebook.com/v22.0";

export async function publishReel(videoUrl, caption, hashtags) {
  const userId = process.env.INSTAGRAM_USER_ID;
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;

  if (!userId || !token) {
    console.warn("⚠ Instagram API not configured — skipping publish");
    return { simulated: true, caption, hashtags };
  }

  // Step 1: Create media container
  const createRes = await axios.post(`${BASE}/${userId}/media`, {
    media_type: "REELS",
    video_url: videoUrl,
    caption: `${caption}\n\n${hashtags.join(" ")}`,
    access_token: token
  });

  const containerId = createRes.data.id;

  // Step 2: Poll until media is ready
  let status = "IN_PROGRESS";
  while (status === "IN_PROGRESS") {
    await new Promise(r => setTimeout(r, 5000));
    const statusRes = await axios.get(`${BASE}/${containerId}`, {
      params: { fields: "status_code", access_token: token }
    });
    status = statusRes.data.status_code;
  }

  if (status !== "FINISHED") throw new Error(`Media publish failed: ${status}`);

  // Step 3: Publish
  const publishRes = await axios.post(`${BASE}/${userId}/media_publish`, {
    creation_id: containerId,
    access_token: token
  });

  return { id: publishRes.data.id, url: `https://instagram.com/p/${publishRes.data.id}` };
}

export async function publishCarousel(images, caption, hashtags) {
  const userId = process.env.INSTAGRAM_USER_ID;
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;

  if (!userId || !token) {
    console.warn("⚠ Instagram API not configured — skipping publish");
    return { simulated: true, images: images.length, caption, hashtags };
  }

  // Create containers for each image
  const childIds = [];
  for (const img of images) {
    const res = await axios.post(`${BASE}/${userId}/media`, {
      image_url: img,
      is_carousel_item: true,
      access_token: token
    });
    childIds.push(res.data.id);
  }

  // Create carousel container
  const carRes = await axios.post(`${BASE}/${userId}/media`, {
    media_type: "CAROUSEL",
    children: childIds.join(","),
    caption: `${caption}\n\n${hashtags.join(" ")}`,
    access_token: token
  });

  const containerId = carRes.data.id;

  // Wait for processing
  let status = "IN_PROGRESS";
  while (status === "IN_PROGRESS") {
    await new Promise(r => setTimeout(r, 5000));
    const statusRes = await axios.get(`${BASE}/${containerId}`, {
      params: { fields: "status_code", access_token: token }
    });
    status = statusRes.data.status_code;
  }

  if (status !== "FINISHED") throw new Error(`Carousel publish failed: ${status}`);

  const publishRes = await axios.post(`${BASE}/${userId}/media_publish`, {
    creation_id: containerId,
    access_token: token
  });

  return { id: publishRes.data.id };
}

export async function publishPhoto(imageUrl, caption, hashtags) {
  const userId = process.env.INSTAGRAM_USER_ID;
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;

  if (!userId || !token) {
    console.warn("⚠ Instagram API not configured — skipping publish");
    return { simulated: true, imageUrl, caption, hashtags };
  }

  const createRes = await axios.post(`${BASE}/${userId}/media`, {
    image_url: imageUrl,
    caption: `${caption}\n\n${hashtags.join(" ")}`,
    access_token: token
  });

  const containerId = createRes.data.id;

  let status = "IN_PROGRESS";
  while (status === "IN_PROGRESS") {
    await new Promise(r => setTimeout(r, 5000));
    const statusRes = await axios.get(`${BASE}/${containerId}`, {
      params: { fields: "status_code", access_token: token }
    });
    status = statusRes.data.status_code;
  }

  if (status !== "FINISHED") throw new Error(`Photo publish failed: ${status}`);

  const publishRes = await axios.post(`${BASE}/${userId}/media_publish`, {
    creation_id: containerId,
    access_token: token
  });

  return { id: publishRes.data.id };
}
