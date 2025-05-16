# Instagram Carousel Poster

A Node.js Express application for automating Instagram carousel posts using the Facebook Graph API. This application allows you to create and schedule carousel posts with nutrition-related content.

## Features

- Automated carousel post creation with customizable templates
- Image generation using Canvas
- Cloudinary integration for image hosting
- Facebook Graph API integration for posting to Instagram
- Cron job scheduling for automated posting
- RESTful API endpoints for manual control

## Prerequisites

- Node.js (v14 or higher)
- Instagram Business Account
- Facebook Developer Account with access to Instagram Graph API
- Cloudinary Account

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
# Facebook Graph API credentials
FACEBOOK_ACCESS_TOKEN=your_access_token_here
INSTAGRAM_BUSINESS_ACCOUNT_ID=your_instagram_business_account_id_here

# Cloudinary credentials
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here

# Server configuration
PORT=3000
```

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/instagram-carousel-poster.git

# Navigate to the project directory
cd instagram-carousel-poster

# Install dependencies
npm install

# Build the project
npm run build

# Start the server
npm start
```

## Development

```bash
# Run in development mode with hot reloading
npm run dev
```

## API Endpoints

- `POST /api/instagram/post-carousel` - Create and post a carousel
  - Request body:
    ```json
    {
      "title": "Carousel Title",
      "slides": ["Slide 1 content", "Slide 2 content", ...],
      "cta": "Call to action text"
    }
    ```

- `POST /api/instagram/trigger-scheduled` - Manually trigger the scheduled post

## Deployment

This application is designed to be deployed to Railway.app or any other Node.js hosting platform.

## License

ISC
