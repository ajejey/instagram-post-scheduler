import fs from 'fs';
import path from 'path';

// Define interfaces for our content structure
export interface PostContent {
  title: string;
  slides: string[];
  cta: string;
  caption: string;
}

export interface ScheduledPost {
  id: string;
  date: string;
  time: string;
  type: string;
  category: string;
  status: string;
  content: PostContent;
}

export interface ContentSchedule {
  metadata: {
    weekStartDate: string;
    weekEndDate: string;
    createdAt: string;
    updatedAt: string;
    totalPosts: number;
  };
  schedule: ScheduledPost[];
}

/**
 * Content Service
 * Handles loading, retrieving, and managing scheduled content
 */
class ContentService {
  private schedulePath: string = '';
  private contentSchedule: ContentSchedule | null = null;

  constructor() {
    // Try multiple possible paths to find the content schedule
    const possiblePaths = [
      // Standard path when running from src
      path.join(__dirname, '../content/scheduled/content-schedule.json'),
      // Path when running from dist in development
      path.join(__dirname, '../../src/content/scheduled/content-schedule.json'),
      // Path when running from dist in production
      path.join(process.cwd(), 'src/content/scheduled/content-schedule.json'),
      // Absolute path from project root
      path.join(process.cwd(), 'dist/content/scheduled/content-schedule.json'),
      // Another possible production path
      path.join(process.cwd(), 'content/scheduled/content-schedule.json')
    ];
    
    // Debug logging
    console.log('Content Service - Current directory:', __dirname);
    console.log('Content Service - Process current working directory:', process.cwd());
    
    // Try each path until we find one that exists
    for (const potentialPath of possiblePaths) {
      console.log(`Checking path: ${potentialPath}`);
      if (fs.existsSync(potentialPath)) {
        console.log(`Found content schedule at: ${potentialPath}`);
        this.schedulePath = potentialPath;
        break;
      }
    }
    
    // If no path was found, use the default path
    if (!this.schedulePath) {
      console.log('No existing content schedule found, using default path');
      this.schedulePath = path.join(__dirname, '../content/scheduled/content-schedule.json');
    }
    
    // List all files in the content directory if it exists
    const contentDir = path.dirname(path.dirname(this.schedulePath));
    if (fs.existsSync(contentDir)) {
      console.log('Content directory exists, contents:');
      this.listDirectoryContents(contentDir, '');
    } else {
      console.log('Content directory does not exist at:', contentDir);
    }
    
    this.loadContentSchedule();
  }
  
  // Helper method to recursively list directory contents
  private listDirectoryContents(dir: string, indent: string): void {
    try {
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);
        if (stats.isDirectory()) {
          console.log(`${indent}📁 ${file}`);
          this.listDirectoryContents(filePath, indent + '  ');
        } else {
          console.log(`${indent}📄 ${file}`);
        }
      });
    } catch (error) {
      console.error(`Error listing directory ${dir}:`, error);
    }
  }

  /**
   * Load the content schedule from the JSON file
   */
  private loadContentSchedule(): void {
    try {
      if (fs.existsSync(this.schedulePath)) {
        const data = fs.readFileSync(this.schedulePath, 'utf8');
        this.contentSchedule = JSON.parse(data) as ContentSchedule;
        console.log(`Loaded content schedule with ${this.contentSchedule.schedule.length} posts`);
      } else {
        console.warn('Content schedule file not found. Creating default empty schedule.');
        // Create directory if it doesn't exist
        const dir = path.dirname(this.schedulePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
          console.log(`Created directory: ${dir}`);
        }
        
        // Create a default empty schedule
        const today = new Date();
        const endDate = new Date(today);
        endDate.setDate(today.getDate() + 7);
        
        this.contentSchedule = {
          metadata: {
            weekStartDate: today.toISOString().split('T')[0],
            weekEndDate: endDate.toISOString().split('T')[0],
            createdAt: today.toISOString(),
            updatedAt: today.toISOString(),
            totalPosts: 0
          },
          schedule: []
        };
        
        // Save the default schedule
        this.saveContentSchedule();
        console.log('Created default empty content schedule');
      }
    } catch (error) {
      console.error('Error loading content schedule:', error);
      // Still create a default schedule even if there's an error
      const today = new Date();
      const endDate = new Date(today);
      endDate.setDate(today.getDate() + 7);
      
      this.contentSchedule = {
        metadata: {
          weekStartDate: today.toISOString().split('T')[0],
          weekEndDate: endDate.toISOString().split('T')[0],
          createdAt: today.toISOString(),
          updatedAt: today.toISOString(),
          totalPosts: 0
        },
        schedule: []
      };
    }
  }

  /**
   * Get posts scheduled for a specific date and time
   * @param date Date in YYYY-MM-DD format
   * @param time Time in HH:MM:SS format (optional)
   * @returns Array of scheduled posts
   */
  getScheduledPosts(date: string, time?: string): ScheduledPost[] {
    if (!this.contentSchedule) {
      return [];
    }

    let posts = this.contentSchedule.schedule.filter(post => 
      post.date === date && post.status === 'scheduled'
    );

    if (time) {
      posts = posts.filter(post => post.time === time);
    }

    return posts;
  }

  /**
   * Get the next scheduled post
   * @returns The next scheduled post or null if none found
   */
  getNextScheduledPost(): ScheduledPost | null {
    if (!this.contentSchedule) {
      return null;
    }

    const now = new Date();
    const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const currentTime = now.toTimeString().split(' ')[0]; // HH:MM:SS

    // Find posts scheduled for today or future dates
    const futurePosts = this.contentSchedule.schedule.filter(post => {
      if (post.status !== 'scheduled') {
        return false;
      }

      if (post.date > currentDate) {
        return true;
      }

      if (post.date === currentDate && post.time > currentTime) {
        return true;
      }

      return false;
    });

    // Sort by date and time
    futurePosts.sort((a, b) => {
      if (a.date !== b.date) {
        return a.date.localeCompare(b.date);
      }
      return a.time.localeCompare(b.time);
    });

    return futurePosts.length > 0 ? futurePosts[0] : null;
  }

  /**
   * Get a post scheduled for the current time
   * Checks if there's a post scheduled for the current date and hour
   * @returns Post scheduled for now or null if none found
   */
  getCurrentTimePost(): ScheduledPost | null {
    if (!this.contentSchedule) {
      return null;
    }

    const now = new Date();
    const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const currentHour = now.getHours().toString().padStart(2, '0'); // HH

    // Find posts scheduled for the current date and hour
    const currentPosts = this.contentSchedule.schedule.filter(post => {
      if (post.status !== 'scheduled') {
        return false;
      }

      if (post.date === currentDate) {
        const postHour = post.time.split(':')[0];
        return postHour === currentHour;
      }

      return false;
    });

    return currentPosts.length > 0 ? currentPosts[0] : null;
  }

  /**
   * Mark a post as published
   * @param postId ID of the post to mark as published
   * @returns True if successful, false otherwise
   */
  markPostAsPublished(postId: string): boolean {
    if (!this.contentSchedule) {
      return false;
    }

    const postIndex = this.contentSchedule.schedule.findIndex(post => post.id === postId);
    
    if (postIndex === -1) {
      return false;
    }

    // Update post status
    this.contentSchedule.schedule[postIndex].status = 'published';
    
    // Save updated schedule
    this.saveContentSchedule();
    
    return true;
  }

  /**
   * Save the content schedule to the JSON file
   */
  /**
   * Check if a schedule is loaded
   * @returns True if a schedule is loaded, false otherwise
   */
  hasSchedule(): boolean {
    return this.contentSchedule !== null;
  }
  
  /**
   * Get the current content schedule
   * @returns The current content schedule or null if none is loaded
   */
  getSchedule(): ContentSchedule | null {
    return this.contentSchedule;
  }
  
  private saveContentSchedule(): void {
    if (!this.contentSchedule) {
      return;
    }

    try {
      // Update the updatedAt timestamp
      this.contentSchedule.metadata.updatedAt = new Date().toISOString();
      
      // Write to file
      fs.writeFileSync(
        this.schedulePath, 
        JSON.stringify(this.contentSchedule, null, 2), 
        'utf8'
      );
      
      console.log('Content schedule saved successfully');
    } catch (error) {
      console.error('Error saving content schedule:', error);
    }
  }

  /**
   * Archive the current schedule and create a new one
   * @param newSchedule New content schedule to use
   * @returns True if successful, false otherwise
   */
  updateSchedule(newSchedule: ContentSchedule): boolean {
    try {
      // Archive current schedule if it exists
      if (this.contentSchedule) {
        const archivePath = path.join(
          __dirname, 
          `../content/archives/week-${this.contentSchedule.metadata.weekStartDate}.json`
        );
        
        // Create archives directory if it doesn't exist
        const archiveDir = path.dirname(archivePath);
        if (!fs.existsSync(archiveDir)) {
          fs.mkdirSync(archiveDir, { recursive: true });
          console.log(`Created archives directory: ${archiveDir}`);
        }
        
        fs.writeFileSync(
          archivePath, 
          JSON.stringify(this.contentSchedule, null, 2), 
          'utf8'
        );
        
        console.log(`Archived previous schedule to ${archivePath}`);
      }
      
      // Set and save new schedule
      this.contentSchedule = newSchedule;
      this.saveContentSchedule();
      
      return true;
    } catch (error) {
      console.error('Error updating content schedule:', error);
      return false;
    }
  }
}

// Export a singleton instance
export const contentService = new ContentService();
