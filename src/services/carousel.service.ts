import { createCanvas, loadImage, registerFont, CanvasRenderingContext2D as NodeCanvasRenderingContext2D } from 'canvas';
import { v2 as cloudinary } from 'cloudinary';
import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';
import { ensureDirectoryExists } from '../utils/file.utils'; // Assuming this util exists

// Load environment variables
dotenv.config();

// --- Configuration ---

// Configure Cloudinary (ensure this is called once at app start)
const configureCloudinary = () => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    console.warn(
      'Cloudinary environment variables (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) are not fully set. Uploads may fall back to local storage.'
    );
  } else {
    console.log('Configuring Cloudinary...');
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true, // Use https URLs
    });
    console.log('Cloudinary configured.');
  }
};

configureCloudinary(); // Call configuration

// --- Design Constants ---

const WIDTH = 1080;
const HEIGHT = 1080; // Square format is good for carousels

const COLORS = {
  background: '#F8F5E6', // Warm cream - natural and inviting
  textPrimary: '#2C3E50', // Deep blue-gray - clear and readable
  textSecondary: '#7D8C93', // Muted teal-gray - for subtitles/secondary info
  accent: '#5CAB7D', // Fresh green - represents health and nutrition
  accentDark: '#3A7D44', // Forest green - for contrasts and emphasis
  subtleGray: '#E0E7E9', // Soft gray - for dividers/patterns
};

const PADDING = 80; // Padding around the edges

// --- Font Registration ---
// Register all Poppins font variants
try {
    const fontsDir = path.join(__dirname, '../../fonts'); // Adjust path if needed
    console.log(`Looking for fonts in: ${fontsDir}`);

    if (!fs.existsSync(fontsDir)) {
        console.warn(`Fonts directory not found at ${fontsDir}. Text rendering might use default fonts.`);
    } else {
        // Define all the font files and their properties
        const fontFiles = [
            { file: 'Poppins-Thin.ttf', weight: '100', style: 'normal' },
            { file: 'Poppins-ThinItalic.ttf', weight: '100', style: 'italic' },
            { file: 'Poppins-ExtraLight.ttf', weight: '200', style: 'normal' },
            { file: 'Poppins-ExtraLightItalic.ttf', weight: '200', style: 'italic' },
            { file: 'Poppins-Light.ttf', weight: '300', style: 'normal' },
            { file: 'Poppins-LightItalic.ttf', weight: '300', style: 'italic' },
            { file: 'Poppins-Regular.ttf', weight: 'normal', style: 'normal' },
            { file: 'Poppins-Italic.ttf', weight: 'normal', style: 'italic' },
            { file: 'Poppins-Medium.ttf', weight: '500', style: 'normal' },
            { file: 'Poppins-MediumItalic.ttf', weight: '500', style: 'italic' },
            { file: 'Poppins-SemiBold.ttf', weight: '600', style: 'normal' },
            { file: 'Poppins-SemiBoldItalic.ttf', weight: '600', style: 'italic' },
            { file: 'Poppins-Bold.ttf', weight: 'bold', style: 'normal' },
            { file: 'Poppins-BoldItalic.ttf', weight: 'bold', style: 'italic' },
            { file: 'Poppins-ExtraBold.ttf', weight: '800', style: 'normal' },
            { file: 'Poppins-ExtraBoldItalic.ttf', weight: '800', style: 'italic' },
            { file: 'Poppins-Black.ttf', weight: '900', style: 'normal' },
            { file: 'Poppins-BlackItalic.ttf', weight: '900', style: 'italic' }
        ];

        // Register each font file
        let registeredCount = 0;
        fontFiles.forEach(font => {
            const fontPath = path.join(fontsDir, font.file);
            if (fs.existsSync(fontPath)) {
                registerFont(fontPath, {
                    family: 'Poppins',
                    weight: font.weight,
                    style: font.style
                });
                registeredCount++;
            } else {
                console.warn(`${font.file} not found.`);
            }
        });

        console.log(`Registered ${registeredCount} Poppins font variants.`);
    }
} catch (error) {
    console.error('Error registering fonts:', error);
    console.warn('Proceeding with default system fonts if custom fonts failed to load.');
}


// --- Helper Functions ---

/**
 * Wraps text to fit within a specified width.
 * Returns the lines and the total height.
 * @param ctx Canvas rendering context
 * @param text The text to wrap
 * @param maxWidth Maximum width in pixels
 * @returns { lines: string[], lineHeight: number, totalHeight: number }
 */
const wrapText = (
  ctx: NodeCanvasRenderingContext2D,
  text: string,
  maxWidth: number
): { lines: string[]; lineHeight: number; totalHeight: number } => {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = words[0] || '';
  const fontHeight = parseInt(ctx.font.match(/(\d+)px/)?.[1] || '30', 10);
  const lineHeight = fontHeight * 2; // Adjust line spacing

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const testLine = currentLine + ' ' + word;
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;

    if (testWidth > maxWidth && i > 0) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  lines.push(currentLine);

  const totalHeight = lines.length * lineHeight;
  return { lines, lineHeight, totalHeight };
};

/**
 * Draws common elements like background and footer
 * @param ctx Canvas rendering context
 * @param slideNumber Current slide number (0 for cover)
 * @param totalSlides Total number of content slides (excluding cover and CTA)
 */
const drawSlideBase = (
    ctx: NodeCanvasRenderingContext2D,
    slideNumber: number,
    totalSlides: number
): void => {
    // Background
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Subtle background pattern (optional)
    ctx.fillStyle = COLORS.subtleGray + '30'; // Add alpha transparency
    for (let i = 0; i < 50; i++) {
        ctx.beginPath();
        const x = Math.random() * WIDTH;
        const y = Math.random() * HEIGHT;
        const radius = Math.random() * 2 + 1;
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }

    // Footer Area
    const footerHeight = 60;
    const footerY = HEIGHT - footerHeight;
    // ctx.fillStyle = COLORS.subtleGray + '50'; // Subtle footer background
    // ctx.fillRect(0, footerY, WIDTH, footerHeight);

    // Brand Name
    ctx.fillStyle = COLORS.textSecondary;
    ctx.font = 'normal 18px Poppins'; // Using normal weight
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('DailyNutritionTracker.com', PADDING, footerY + footerHeight / 2);

    // Slide Number (for content slides)
    if (slideNumber > 0 && slideNumber <= totalSlides) {
        ctx.textAlign = 'right';
        ctx.fillText(`${slideNumber} / ${totalSlides}`, WIDTH - PADDING, footerY + footerHeight / 2);
    }
};


// --- Slide Creation Functions ---

/**
 * Create the cover slide
 */
const createCoverSlide = async (title: string, outputPath: string): Promise<void> => {
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  drawSlideBase(ctx, 0, 0); // 0 indicates cover slide

  // --- Title ---
  ctx.fillStyle = COLORS.textPrimary;
  ctx.font = 'bold 90px Poppins'; // Using bold weight instead of 800
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const maxWidth = WIDTH - PADDING * 2;
  const { lines, lineHeight, totalHeight } = wrapText(ctx, title, maxWidth);

  const startY = HEIGHT / 2 - totalHeight / 2;

  lines.forEach((line, index) => {
    ctx.fillText(line, WIDTH / 2, startY + index * lineHeight + lineHeight / 2);
  });

  // --- Decorative Element ---
  ctx.fillStyle = COLORS.accent;
  ctx.beginPath();
  // Simple underline accent
  const accentWidth = Math.min(maxWidth * 0.6, ctx.measureText(lines[lines.length - 1]).width * 0.8);
  const accentHeight = 10;
  const accentY = startY + totalHeight + 20; // Below the text
  ctx.roundRect( (WIDTH - accentWidth) / 2, accentY, accentWidth, accentHeight, accentHeight / 2);
  ctx.fill();


  // --- "Swipe Left" Hint ---
  ctx.fillStyle = COLORS.textSecondary;
  ctx.font = 'normal 24px Poppins'; // Using normal weight
  ctx.textAlign = 'center';
  ctx.fillText('Swipe left to learn more →', WIDTH / 2, HEIGHT - PADDING - 60); // Position above footer

  // Save the image
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
};

/**
 * Create a content slide
 */
const createContentSlide = async (
    content: string,
    outputPath: string,
    slideNumber: number,
    totalSlides: number
): Promise<void> => {
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  drawSlideBase(ctx, slideNumber, totalSlides);

  // --- Content Text ---
  ctx.fillStyle = COLORS.textPrimary;
  ctx.font = 'normal 52px Poppins'; // Using normal weight instead of 500
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const maxWidth = WIDTH - PADDING * 2;
  const { lines, lineHeight, totalHeight } = wrapText(ctx, content, maxWidth);

  // Adjust startY to leave space for header/footer
  const availableHeight = HEIGHT - PADDING * 2 - 60; // 60 for footer
  const startY = PADDING + (availableHeight - totalHeight) / 2;

  lines.forEach((line, index) => {
    ctx.fillText(line, WIDTH / 2, startY + index * lineHeight + lineHeight / 2);
  });

    // --- Optional: Small accent shape per slide ---
    ctx.fillStyle = COLORS.accent + '80'; // Semi-transparent accent
    ctx.beginPath();
    ctx.arc(PADDING / 2, PADDING / 2, 20, 0, Math.PI * 2); // Top-left corner circle
    ctx.fill();

  // Save the image
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
};

/**
 * Create the CTA slide
 */
const createCtaSlide = async (cta: string, outputPath: string, totalSlides: number): Promise<void> => {
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  drawSlideBase(ctx, totalSlides + 1, totalSlides); // Use slideNumber > totalSlides for CTA

  // --- CTA Text ---
  ctx.fillStyle = COLORS.textPrimary;
  ctx.font = 'bold 55px Poppins'; // Bold for emphasis
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const maxWidth = WIDTH - PADDING * 2;
  const { lines, lineHeight, totalHeight } = wrapText(ctx, cta, maxWidth);

  const ctaTextY = PADDING + (HEIGHT / 2 - PADDING); // Center vertically in top half

  lines.forEach((line, index) => {
    ctx.fillText(line, WIDTH / 2, ctaTextY - totalHeight / 2 + index * lineHeight + lineHeight / 2);
  });


  // --- Call to Action Button ---
  const buttonWidth = 450;
  const buttonHeight = 90;
  const buttonX = (WIDTH - buttonWidth) / 2;
  const buttonY = HEIGHT - PADDING * 2 - buttonHeight; // Position lower part
  const borderRadius = buttonHeight / 2;

  // Button Background
  ctx.fillStyle = COLORS.accent;
  ctx.beginPath();
  ctx.roundRect(buttonX, buttonY, buttonWidth, buttonHeight, borderRadius);
  ctx.fill();

  // Button Text
  ctx.fillStyle = COLORS.accentDark; // Darker text on bright button
  ctx.font = '32px "Poppins Bold"'; // Using font family name with style directly
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Start Tracking Now', WIDTH / 2, buttonY + buttonHeight / 2);


   // --- Website URL (clearly visible) ---
   ctx.fillStyle = COLORS.textSecondary;
   ctx.font = '24px "Poppins Regular"'; // Using font family name with style directly
   ctx.textAlign = 'center';
   ctx.fillText('Visit DailyNutritionTracker.com', WIDTH / 2, buttonY + buttonHeight + 35);


  // Save the image
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
};


// --- Main Carousel Function ---

/**
 * Create a carousel of images for Instagram
 * @param title The title for the cover slide
 * @param slides Array of slide content (strings)
 * @param cta Call to action text for the last slide
 * @returns Array of public URLs (Cloudinary or local) for the carousel images
 */
export const createCarousel = async (
  title: string,
  slides: string[],
  cta: string = 'Ready to take control? Track your nutrition accurately with DailyNutritionTracker.com!' // More engaging CTA
): Promise<string[]> => {
  try {
    console.log('Starting enhanced carousel creation process...');
    console.log(`Title: "${title}"`);
    console.log(`Content Slides: ${slides.length}`);
    console.log(`CTA: "${cta}"`);

    const tempDir = path.join(__dirname, '../../temp');
    ensureDirectoryExists(tempDir);

    const imageUrls: string[] = [];
    const totalContentSlides = slides.length;

    // 1. Create Cover Slide
    console.log('Creating cover slide...');
    const coverImagePath = path.join(tempDir, `carousel_${Date.now()}_cover.png`);
    await createCoverSlide(title, coverImagePath);
    console.log(`Uploading cover slide...`);
    imageUrls.push(await uploadToCloudinaryOrLocal(coverImagePath));

    // 2. Create Content Slides
    console.log('Creating content slides...');
    for (let i = 0; i < totalContentSlides; i++) {
      const slideNumber = i + 1;
      console.log(`Creating slide ${slideNumber}/${totalContentSlides}: "${slides[i].substring(0, 50)}..."`);
      const slideImagePath = path.join(tempDir, `carousel_${Date.now()}_slide_${slideNumber}.png`);
      await createContentSlide(slides[i], slideImagePath, slideNumber, totalContentSlides);
      console.log(`Uploading slide ${slideNumber}...`);
      imageUrls.push(await uploadToCloudinaryOrLocal(slideImagePath));
    }

    // 3. Create CTA Slide
    console.log('Creating CTA slide...');
    const ctaImagePath = path.join(tempDir, `carousel_${Date.now()}_cta.png`);
    await createCtaSlide(cta, ctaImagePath, totalContentSlides);
    console.log(`Uploading CTA slide...`);
    imageUrls.push(await uploadToCloudinaryOrLocal(ctaImagePath));

    // Cleanup temp files unless in development
    if (process.env.NODE_ENV !== 'development') {
      cleanupTempFiles(tempDir);
      console.log('Temporary image files cleaned up.');
    } else {
      console.log(`Temporary images saved in: ${tempDir}`);
    }

    console.log(`Carousel creation complete. Generated ${imageUrls.length} images.`);
    return imageUrls;

  } catch (error) {
    console.error('Error creating carousel:', error);
    // Consider more specific error handling or re-throwing
    throw new Error(`Failed to create carousel: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// --- Cloudinary Upload / Local Fallback ---

/**
 * Uploads an image to Cloudinary or saves publicly locally as fallback.
 */
const uploadToCloudinaryOrLocal = async (imagePath: string): Promise<string> => {
  const useCloudinary = process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET;

  if (useCloudinary) {
    try {
      const result = await cloudinary.uploader.upload(imagePath, {
        folder: 'instagram-carousel', // Optional: organize in Cloudinary
        resource_type: 'image',
        // transformation: [{ quality: 'auto:good' }] // Optional: optimize image
      });
      console.log(`Uploaded to Cloudinary: ${result.secure_url}`);
      return result.secure_url;
    } catch (error) {
      console.error(`Cloudinary upload failed for ${path.basename(imagePath)}:`, error);
      console.log('Falling back to local storage...');
      // Fall through to local storage logic
    }
  } else {
     console.log('Cloudinary not configured, using local storage fallback.');
  }

  // Local storage fallback
  try {
    const publicDir = path.join(__dirname, '../../public/uploads'); // Store in a subfolder
    ensureDirectoryExists(publicDir);

    const fileName = path.basename(imagePath);
    const publicPath = path.join(publicDir, fileName);
    fs.copyFileSync(imagePath, publicPath); // Copy to make it accessible

    // Construct the URL based on your server setup
    // This assumes your server statically serves the 'public' directory
    const baseUrl = process.env.APP_BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
    const localUrl = `${baseUrl}/uploads/${fileName}`; // Relative path from served dir

    console.log(`Saved locally: ${localUrl} (from ${publicPath})`);
    return localUrl;

  } catch (localError) {
     console.error(`Failed to save image locally (${path.basename(imagePath)}):`, localError);
     // If even local saving fails, throw an error.
     throw new Error(`Failed to store image locally after Cloudinary failure (if attempted): ${localError instanceof Error ? localError.message : String(localError)}`);
  }
};

// --- Cleanup Utility ---

/**
 * Clean up temporary files in the specified directory.
 */
const cleanupTempFiles = (tempDir: string): void => {
  try {
    if (!fs.existsSync(tempDir)) return;
    console.log(`Cleaning up temp directory: ${tempDir}`);
    const files = fs.readdirSync(tempDir);
    files.forEach(file => {
        const filePath = path.join(tempDir, file);
        // Add extra check if it's actually a file
        if (fs.statSync(filePath).isFile() && file.startsWith('carousel_')) { // Only delete generated carousel files
             fs.unlinkSync(filePath);
        }
    });
    // Optional: Remove the directory if it's empty, but be careful
    // if (fs.readdirSync(tempDir).length === 0) {
    //     fs.rmdirSync(tempDir);
    // }
  } catch (error) {
    console.error('Error cleaning up temp files:', error);
  }
};

// --- Utility to ensure directory exists --- (Include if not already present)
// Add this function if your `file.utils.ts` doesn't have it or isn't imported correctly
/*
const ensureDirectoryExists = (dirPath: string): void => {
    if (!fs.existsSync(dirPath)) {
        console.log(`Creating directory: ${dirPath}`);
        fs.mkdirSync(dirPath, { recursive: true });
    }
};
*/