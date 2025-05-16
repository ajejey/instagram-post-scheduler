import axios from 'axios';

/**
 * Post a carousel to Instagram using Facebook Graph API
 * @param caption The caption for the Instagram post
 * @param mediaUrls Array of image URLs for the carousel
 * @returns The result of the Instagram post
 */
export const postToInstagram = async (caption: string, mediaUrls: string[], enhancedCaption?: string): Promise<any> => {
  try {
    // Get credentials from environment variables
    const accessToken = process.env.FACEBOOK_ACCESS_TOKEN;
    const igBusinessId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

    // Validate credentials
    if (!accessToken || !igBusinessId) {
      throw new Error('Missing Instagram credentials in environment variables');
    }
    
    console.log('Instagram API Configuration:');
    console.log(`- Business Account ID: ${igBusinessId}`);
    console.log(`- Access Token: ${accessToken ? accessToken.substring(0, 10) + '...' + accessToken.substring(accessToken.length - 5) : 'Not set'}`);
    console.log(`- Media URLs count: ${mediaUrls.length}`);
    
    // Validate media URLs
    if (!mediaUrls || mediaUrls.length === 0) {
      throw new Error('No media URLs provided for Instagram post');
    }
    
    // Check if we have too many images for a carousel (Instagram limit is 10)
    if (mediaUrls.length > 10) {
      console.warn(`Warning: Instagram only supports up to 10 images in a carousel. Truncating from ${mediaUrls.length} to 10.`);
      mediaUrls = mediaUrls.slice(0, 10);
    }

    // Step 1: Create media containers for each image
    console.log('Creating media containers for each image...');
    
    const containerIds = [];
    for (let i = 0; i < mediaUrls.length; i++) {
      const url = mediaUrls[i];
      console.log(`Creating container ${i+1}/${mediaUrls.length} for image: ${url.substring(0, 50)}...`);
      
      // Add delay between container creations to avoid rate limiting
      if (i > 0) {
        const containerDelayMs = 1000; // 1 second delay between container creations
        console.log(`Waiting ${containerDelayMs/1000} seconds before creating next container...`);
        await new Promise(resolve => setTimeout(resolve, containerDelayMs));
      }
      
      try {
        // Use a more recent API version (v18.0 is more stable than v19.0)
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
    let carouselContainerId: string;
    try {
      const carouselResponse = await axios.post(
        `https://graph.facebook.com/v18.0/${igBusinessId}/media`,
        null,
        {
          params: {
            media_type: 'CAROUSEL',
            children: containerIds.join(','),
            caption: enhancedCaption || caption,
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
      
      // Add delay after creating carousel container before attempting to publish
      const carouselDelayMs = 2000; // 2 second delay after carousel creation
      console.log(`Waiting ${carouselDelayMs/1000} seconds after creating carousel container...`);
      await new Promise(resolve => setTimeout(resolve, carouselDelayMs));
    } catch (error: any) {
      console.error('Error creating carousel container:', error.response?.data || error.message);
      throw new Error(`Failed to create carousel container: ${error.response?.data?.error?.message || error.message}`);
    }

    // Step 3: Publish the carousel with retry mechanism
    console.log('Publishing carousel to Instagram...');
    
    // Function to attempt publishing with retry logic
    const attemptPublish = async (retryCount = 0, maxRetries = 3, delayMs = 5000): Promise<any> => {
      try {
        // Add a delay before publishing to allow Instagram to process the container
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
      
      return {
        success: true,
        postId: publishResponse.data?.id,
        containerIds,
        carouselContainerId
      };
    } catch (error: any) {
      console.error('All publishing attempts failed:', error.response?.data || error.message);
      throw new Error(`Failed to publish carousel after multiple attempts: ${error.response?.data?.error?.message || error.message}`);
    }
  } catch (error: any) {
    console.error('Error posting to Instagram:');
    
    // Log detailed error information from the API response
    if (error.response) {
      // The request was made and the server responded with a status code outside of 2xx range
      console.error('API Error Response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers
      });
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Request setup error:', error.message);
    }
    
    // Always throw the error to ensure real API calls
    throw error;
  }
};
