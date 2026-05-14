import { publishReel, publishCarousel, publishPhoto } from "../services/instagram.js";
import { savePostRecord } from "../services/firebase.js";

export async function publishPost(contentPlan, captionResult, mediaUrls) {
  const { postType, topic } = contentPlan;
  const { caption, hashtags, cta } = captionResult;

  const fullCaption = `${caption}\n\n${cta}`;

  console.log(`\n📤 Publishing ${postType}: "${topic}"`);
  console.log(`📝 Caption: ${fullCaption.substring(0, 80)}...`);
  console.log(`🏷️  Hashtags: ${hashtags?.length || 0} tags`);

  let result;
  switch (postType) {
    case "reel":
      result = await publishReel(mediaUrls?.video, fullCaption, hashtags);
      break;
    case "carousel":
      result = await publishCarousel(mediaUrls?.images || [], fullCaption, hashtags);
      break;
    default:
      result = await publishPhoto(mediaUrls?.image, fullCaption, hashtags);
  }

  await savePostRecord({
    postType,
    topic,
    caption: fullCaption,
    hashtags,
    publishResult: result
  });

  console.log(`✅ Published! ${result.id ? `ID: ${result.id}` : "(simulated)"}`);
  return result;
}
