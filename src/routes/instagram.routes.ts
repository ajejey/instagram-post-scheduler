import express, { RequestHandler, Request, Response } from 'express';
import { createCarouselPost, triggerScheduledPost } from '../controllers/instagram.controller';
import { scheduledPostJob } from '../services/cron.service';
import axios from 'axios';

const router = express.Router();

// Route to manually create and post a carousel
router.post('/post-carousel', createCarouselPost as RequestHandler);

// Route to manually trigger the scheduled post
router.post('/trigger-scheduled', triggerScheduledPost as RequestHandler);

/**
 * @route GET /status
 * @desc Check Instagram API status
 * @access Public
 */
router.get('/status', (req: Request, res: Response): void => {
  res.json({ status: 'Instagram API routes are working' });
});

/**
 * @route GET /verify-credentials
 * @desc Verify Instagram API credentials without posting content
 * @access Public
 */
router.get('/verify-credentials', async (req: Request, res: Response): Promise<void> => {
  try {
    const accessToken = process.env.FACEBOOK_ACCESS_TOKEN;
    const igBusinessId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
    
    if (!accessToken || !igBusinessId) {
      res.status(500).json({
        success: false,
        error: 'Missing Instagram credentials in environment variables'
      });
      return;
    }
    
    console.log('Verifying Instagram API credentials...');
    
    // Test the credentials by making a simple API call to get account info
    const response = await axios.get(
      `https://graph.facebook.com/v18.0/${igBusinessId}`,
      {
        params: {
          fields: 'id,username,name,profile_picture_url',
          access_token: accessToken
        }
      }
    );
    
    res.json({
      success: true,
      message: 'Instagram API credentials are valid',
      accountInfo: response.data
    });
  } catch (error: any) {
    console.error('Error verifying Instagram credentials:');
    if (error.response) {
      console.error('API Error Response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
      
      res.status(error.response.status).json({
        success: false,
        error: error.response.data?.error?.message || 'Unknown API error',
        details: error.response.data
      });
    } else {
      console.error('Request error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
});

// Test route to run the scheduledPostJob function and see the image creation process
router.get('/test-job', async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Testing scheduled post job...');
    // Don't force development mode to ensure real API calls
    
    const result = await scheduledPostJob();
    
    res.status(200).json({
      success: true,
      message: 'Test job completed successfully',
      data: result
    });
  } catch (error) {
    console.error('Error running test job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to run test job',
      error: (error as Error).message
    });
  }
});

/**
 * @route GET /api/instagram/test-single
 * @desc Test posting a single image to Instagram
 * @access Public
 */
router.get('/test-single', async (req: Request, res: Response): Promise<void> => {
  try {
    // Test image URL
    const testImageUrl = 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=1153&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';
    const caption = 'Test post from Instagram API';
    
    // Step 1: Create media container
    console.log('Creating media container...');
    const accessToken = process.env.FACEBOOK_ACCESS_TOKEN;
    const igBusinessId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

    if (!accessToken || !igBusinessId) {
      throw new Error('Missing Instagram credentials');
    }

    // Create media container
    const containerResponse = await axios.post(
      `https://graph.facebook.com/v18.0/${igBusinessId}/media`,
      null,
      {
        params: {
          image_url: testImageUrl,
          caption: caption,
          access_token: accessToken
        }
      }
    );

    if (!containerResponse.data || !containerResponse.data.id) {
      throw new Error('Failed to create media container');
    }

    const containerId = containerResponse.data.id;
    console.log(`Created media container with ID: ${containerId}`);

    // Step 2: Wait for processing
    console.log('Waiting for Instagram to process the image...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Step 3: Publish the post
    console.log('Publishing post...');
    const publishResponse = await axios.post(
      `https://graph.facebook.com/v18.0/${igBusinessId}/media_publish`,
      null,
      {
        params: {
          creation_id: containerId,
          access_token: accessToken
        }
      }
    );

    if (!publishResponse.data || !publishResponse.data.id) {
      throw new Error('Failed to publish post');
    }

    console.log('Successfully published post!', publishResponse.data);
    res.json({
      success: true,
      message: 'Successfully posted to Instagram',
      postId: publishResponse.data.id
    });

  } catch (error: any) {
    console.error('Error in test single post:', error);
    res.status(500).json({
      success: false,
      error: error.response?.data?.error?.message || error.message,
      details: error.response?.data
    });
  }
});

/**
 * @route GET /api/instagram/test-carousel-simple
 * @desc Test posting a simple carousel with three images to Instagram
 * @access Public
 */
router.get('/test-carousel-simple', async (req: Request, res: Response): Promise<void> => {
  try {
    // Test image URLs
    const imageUrls = [
      'https://res.cloudinary.com/dv5i5jojg/image/upload/v1747338713/instagram-carousel/x6ag3nup5mkqklgagfww.png',
      'https://res.cloudinary.com/dv5i5jojg/image/upload/v1747338714/instagram-carousel/zerjqspira1xoudm0bvp.png',
      'https://res.cloudinary.com/dv5i5jojg/image/upload/v1747338715/instagram-carousel/gnzm5xqulibr1eugkmca.png'
    ];
    const caption = 'Test carousel post from Instagram API';
    
    // Get credentials
    const accessToken = process.env.FACEBOOK_ACCESS_TOKEN;
    const igBusinessId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

    if (!accessToken || !igBusinessId) {
      throw new Error('Missing Instagram credentials');
    }

    console.log('Creating carousel with 3 images...');
    
    // Step 1: Create media containers for each image
    console.log('Creating media containers for each image...');
    
    const containerIds = [];
    for (let i = 0; i < imageUrls.length; i++) {
      const url = imageUrls[i];
      console.log(`Creating container ${i+1}/${imageUrls.length} for image: ${url.substring(0, 50)}...`);
      
      try {
        const containerResponse = await axios.post(
          `https://graph.facebook.com/v18.0/${igBusinessId}/media`,
          null,
          {
            params: {
              image_url: url,
              is_carousel_item: true,
              access_token: accessToken
            }
          }
        );

        if (!containerResponse.data || !containerResponse.data.id) {
          console.error(`Failed to create container for image ${i+1}. Response:`, containerResponse.data);
          throw new Error(`Failed to create media container for URL: ${url}`);
        }

        console.log(`Container ${i+1} created successfully with ID: ${containerResponse.data.id}`);
        containerIds.push(containerResponse.data.id);
        
        // Add a small delay between container creations
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error: any) {
        console.error(`Error creating container ${i+1}:`, error.response?.data || error.message);
        throw new Error(`Failed to create container ${i+1}: ${error.response?.data?.error?.message || error.message}`);
      }
    }

    if (containerIds.length === 0) {
      throw new Error('Failed to create any media containers');
    }
    
    console.log(`Successfully created ${containerIds.length} media containers`);

    // Step 2: Create a carousel container
    console.log('Creating carousel container...');
    let carouselContainerId;
    try {
      // Add a delay before creating carousel container
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const carouselResponse = await axios.post(
        `https://graph.facebook.com/v18.0/${igBusinessId}/media`,
        null,
        {
          params: {
            media_type: 'CAROUSEL',
            children: containerIds.join(','),
            caption: caption,
            access_token: accessToken
          }
        }
      );

      if (!carouselResponse.data || !carouselResponse.data.id) {
        console.error('Failed to create carousel container. Response:', carouselResponse.data);
        throw new Error('Failed to create carousel container');
      }

      carouselContainerId = carouselResponse.data.id;
      console.log(`Created carousel container with ID: ${carouselContainerId}`);
    } catch (error: any) {
      console.error('Error creating carousel container:', error.response?.data || error.message);
      throw new Error(`Failed to create carousel container: ${error.response?.data?.error?.message || error.message}`);
    }

    // Step 3: Publish the carousel with retry mechanism
    console.log('Publishing carousel to Instagram...');
    
    // Function to attempt publishing with retry logic
    const attemptPublish = async (retryCount = 0, maxRetries = 3, delayMs = 7000): Promise<any> => {
      try {
        console.log(`Waiting ${delayMs/1000} seconds before ${retryCount > 0 ? 'retrying' : 'attempting'} to publish...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        
        const publishResponse = await axios.post(
          `https://graph.facebook.com/v18.0/${igBusinessId}/media_publish`,
          null,
          {
            params: {
              creation_id: carouselContainerId,
              access_token: accessToken
            }
          }
        );
        
        console.log('Successfully published carousel to Instagram!', publishResponse.data);
        return publishResponse;
      } catch (error: any) {
        console.error(`Publishing attempt ${retryCount + 1} failed:`, error.response?.data || error.message);
        
        // If we have retries left and it's an unknown error (which might be temporary), retry
        const isUnknownError = error.response?.data?.error?.message?.includes('unknown error') || 
                              error.message?.includes('unknown error');
                              
        if (retryCount < maxRetries && isUnknownError) {
          console.log(`Retrying publish (${retryCount + 1}/${maxRetries})...`);
          // Increase delay for each retry
          return attemptPublish(retryCount + 1, maxRetries, delayMs * 1.5);
        }
        
        // If we're out of retries or it's not an unknown error, throw
        throw error;
      }
    };
    
    try {
      const publishResponse = await attemptPublish();
      
      res.json({
        success: true,
        message: 'Successfully posted carousel to Instagram',
        postId: publishResponse.data?.id,
        containerIds,
        carouselContainerId
      });
    } catch (error: any) {
      console.error('All publishing attempts failed:', error.response?.data || error.message);
      res.status(500).json({
        success: false,
        error: error.response?.data?.error?.message || error.message,
        details: error.response?.data
      });
    }
  } catch (error: any) {
    console.error('Error in test carousel post:', error);
    res.status(500).json({
      success: false,
      error: error.response?.data?.error?.message || error.message,
      details: error.response?.data
    });
  }
});

export const instagramRoutes = router;
