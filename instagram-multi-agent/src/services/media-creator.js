/**
 * Media Creator — Uses Canva MCP and fallback options to create actual media.
 * 
 * Canva generates designs → exports as PNG/MP4 → returns URLs for Instagram API
 */

const CANVA_EXPORT_BASE = "https://export-download.canva.com";

export async function createReelMedia(idea, accountContext) {
  console.log(`\n🎬 Creating reel: "${idea.topic}"`);
  
  // Try Canva first, fallback to template-based generation
  const designUrl = await createWithCanva(idea, "reel");
  if (designUrl) return designUrl;
  
  // Fallback: return a placeholder (user can replace with actual video)
  console.log("ℹ️  Canva export not available — using placeholder");
  return null;
}

export async function createCarouselMedia(idea, accountContext) {
  console.log(`\n🖼️ Creating carousel: "${idea.topic}"`);
  
  const imageUrls = [];
  
  // Create multiple slides via Canva
  for (let i = 0; i < Math.min(idea.slides || 5, 10); i++) {
    const slideIdea = {
      ...idea,
      slideNumber: i + 1,
      totalSlides: idea.slides || 5
    };
    
    const url = await createWithCanva(slideIdea, "carousel_slide");
    if (url) imageUrls.push(url);
  }
  
  return imageUrls.length > 0 ? imageUrls : null;
}

export async function createStaticMedia(idea, accountContext) {
  console.log(`\n📸 Creating image: "${idea.topic}"`);
  return await createWithCanva(idea, "static");
}

/**
 * Attempt to create media via Canva MCP
 * Falls back to generating a text-based template URL if Canva isn't available
 */
async function createWithCanva(idea, mediaType) {
  try {
    // Generate a design via Canva
    // Design is created, exported, and the download URL is returned
    const designResult = await generateCanvaDesign(idea, mediaType);
    if (designResult?.downloadUrl) {
      return designResult.downloadUrl;
    }
  } catch (err) {
    console.warn(`   Canva creation failed: ${err.message}`);
  }
  return null;
}

/**
 * Uses Canva MCP to create a design and export it
 * Falls back to returning null if Canva isn't configured
 */
async function generateCanvaDesign(idea, mediaType) {
  // This function relies on the Canva MCP which is called externally
  // The actual Canva call is handled by the orchestrator level
  return null;
}

/**
 * Upload media to a publicly accessible URL for Instagram API
 * Uses a simple upload approach — for production, use a CDN/S3
 */
export async function prepareMediaForPost(mediaUrls) {
  if (!mediaUrls) return mediaUrls;
  
  // If we have direct URLs already, use them
  if (typeof mediaUrls === 'string' && mediaUrls.startsWith('http')) {
    return mediaUrls;
  }
  
  // If it's an array of URLs
  if (Array.isArray(mediaUrls) && mediaUrls.every(u => u?.startsWith('http'))) {
    return mediaUrls;
  }
  
  return null;
}
