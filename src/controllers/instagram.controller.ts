import { Request, Response } from 'express';
import { createCarousel } from '../services/carousel.service';
import { postToInstagram } from '../services/instagram.service';
import { scheduledPostJob } from '../services/cron.service';

/**
 * Controller to create and post a carousel to Instagram
 */
export const createCarouselPost = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, slides, cta } = req.body;

    if (!title || !slides || !Array.isArray(slides) || slides.length === 0) {
      res.status(400).json({ 
        success: false, 
        message: 'Invalid request body. Title and slides array are required.' 
      });
      return;
    }

    // Create carousel images
    const carouselUrls = await createCarousel(title, slides, cta);
    
    // Post to Instagram
    const result = await postToInstagram(title, carouselUrls);
    
    res.status(200).json({
      success: true,
      message: 'Carousel post created successfully',
      data: result
    });
  } catch (error) {
    console.error('Error creating carousel post:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create carousel post',
      error: (error as Error).message
    });
  }
};

/**
 * Controller to manually trigger the scheduled post
 */
export const triggerScheduledPost = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Manually triggering scheduled post...');
    const result = await scheduledPostJob();
    
    res.status(200).json({
      success: true,
      message: 'Scheduled post triggered successfully',
      data: result
    });
  } catch (error) {
    console.error('Error triggering scheduled post:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to trigger scheduled post',
      error: (error as Error).message
    });
  }
};
