import express from 'express';
import dotenv from 'dotenv';
import cron from 'node-cron';
import path from 'path';
import { instagramRoutes } from './routes/instagram.routes';
import { adminRoutes } from './routes/admin.routes';
import { scheduledPostJob } from './services/cron.service';

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the public directory
app.use('/public', express.static(path.join(__dirname, '../public')));

// Routes
app.use('/api/instagram', instagramRoutes);
app.use('/api/admin', adminRoutes);

// Default route
app.get('/', (req, res) => {
  res.send('Instagram Carousel Poster API is running');
});

// Initialize cron jobs for three daily posts optimized for American audience
// Times are in UTC to ensure consistent posting regardless of server location

// Morning post - 10:00 AM EST (14:00 UTC)
// This is when most Americans are starting their day and checking social media
cron.schedule('0 14 * * *', async () => {
  console.log('Running morning Instagram post job (10:00 AM EST)...');
  try {
    await scheduledPostJob();
    console.log('Morning post completed successfully');
  } catch (error) {
    console.error('Error in morning post job:', error);
  }
});

// Lunch/Afternoon post - 1:00 PM EST (17:00 UTC)
// Lunch break is a peak engagement time for social media
cron.schedule('0 17 * * *', async () => {
  console.log('Running lunch Instagram post job (1:00 PM EST)...');
  try {
    await scheduledPostJob();
    console.log('Lunch post completed successfully');
  } catch (error) {
    console.error('Error in lunch post job:', error);
  }
});

// Evening post - 8:00 PM EST (00:00 UTC next day)
// Evening hours show high engagement as people browse before bed
cron.schedule('0 0 * * *', async () => {
  console.log('Running evening Instagram post job (8:00 PM EST)...');
  try {
    await scheduledPostJob();
    console.log('Evening post completed successfully');
  } catch (error) {
    console.error('Error in evening post job:', error);
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
