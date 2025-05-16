import fs from 'fs';
import path from 'path';
import { createCarousel } from './carousel.service';
import { postToInstagram } from './instagram.service';
import { contentService, ScheduledPost } from './content.service';
import { getNutritionMythsContent } from '../templates/nutrition-myths';

/**
 * Scheduled job to post to Instagram
 * This will run based on the cron schedule defined in index.ts
 */
export const scheduledPostJob = async (): Promise<any> => {
  try {
    console.log('Running scheduled Instagram post job...');
    
    // Get content for today's post
    const postContent = await getPostContentForToday();
    
    // Check if this is a scheduled post from the content system
    const currentPost = contentService.getCurrentTimePost();
    const postId = currentPost?.id;
    
    // Create carousel images
    console.log(`Creating carousel for post: ${postContent.title}`);
    const carouselUrls = await createCarousel(
      postContent.title,
      postContent.slides,
      postContent.cta
    );
    
    // Post to Instagram with enhanced caption
    console.log('Posting to Instagram...');
    const result = await postToInstagram(postContent.title, carouselUrls, postContent.caption);
    
    // Mark the post as published in the content schedule if it's a scheduled post
    if (postId) {
      console.log(`Marking post ${postId} as published in content schedule`);
      contentService.markPostAsPublished(postId);
    }
    
    // Log the successful post
    await logSuccessfulPost(postContent.title);
    
    return {
      success: true,
      postContent,
      result,
      scheduledPostId: postId || null
    };
  } catch (error) {
    console.error('Error in scheduled post job:', error);
    throw error;
  }
};

/**
 * Get content for today's post based on the content schedule
 * Falls back to template if no scheduled content is found
 */
const getPostContentForToday = async (): Promise<{
  title: string;
  slides: string[];
  cta: string;
  caption: string;
}> => {
  // Try to get a post scheduled for the current time
  const scheduledPost = contentService.getCurrentTimePost();
  
  if (scheduledPost) {
    console.log(`Using scheduled post: ${scheduledPost.id} (${scheduledPost.category})`);
    return scheduledPost.content;
  }
  
  // Fallback to the nutrition myths template if no scheduled post is found
  console.log('No scheduled post found for current time, using fallback template');
  return getNutritionMythsContent();
};

/**
 * Log successful post to a file
 */
const logSuccessfulPost = async (title: string): Promise<void> => {
  try {
    const logsDir = path.join(__dirname, '../../logs');
    
    // Create logs directory if it doesn't exist
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    const logFile = path.join(logsDir, 'posts.log');
    const timestamp = new Date().toISOString();
    const logEntry = `${timestamp} - Posted: ${title}\n`;
    
    // Append to log file
    fs.appendFileSync(logFile, logEntry);
    
    console.log(`Post logged: ${title}`);
  } catch (error) {
    console.error('Error logging post:', error);
  }
};
