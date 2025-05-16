import express, { Request, Response } from 'express';
import { contentService, ContentSchedule } from '../services/content.service';
import fs from 'fs';
import path from 'path';

const router = express.Router();

/**
 * @route GET /api/admin/schedule
 * @desc Get the current content schedule
 * @access Private
 */
router.get('/schedule', (req: Request, res: Response): void => {
  try {
    const schedulePath = path.join(__dirname, '../content/scheduled/content-schedule.json');
    
    if (!fs.existsSync(schedulePath)) {
      res.status(404).json({
        success: false,
        message: 'Content schedule not found'
      });
      return;
    }
    
    const scheduleData = fs.readFileSync(schedulePath, 'utf8');
    const schedule = JSON.parse(scheduleData);
    
    res.json({
      success: true,
      schedule
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving content schedule',
      error: (error as Error).message
    });
  }
});

/**
 * @route POST /api/admin/schedule
 * @desc Update the content schedule
 * @access Private
 */
router.post('/schedule', (req: Request, res: Response): void => {
  try {
    const newSchedule = req.body as ContentSchedule;
    
    if (!newSchedule || !newSchedule.metadata || !newSchedule.schedule) {
      res.status(400).json({
        success: false,
        message: 'Invalid schedule format'
      });
      return;
    }
    
    // Update the schedule
    const success = contentService.updateSchedule(newSchedule);
    
    if (success) {
      res.json({
        success: true,
        message: 'Content schedule updated successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to update content schedule'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating content schedule',
      error: (error as Error).message
    });
  }
});

/**
 * @route GET /api/admin/templates
 * @desc Get list of available templates
 * @access Private
 */
router.get('/templates', (req: Request, res: Response): void => {
  try {
    const templatesPath = path.join(__dirname, '../templates');
    
    if (!fs.existsSync(templatesPath)) {
      res.status(404).json({
        success: false,
        message: 'Templates directory not found'
      });
      return;
    }
    
    // Get all template files
    const templateFiles = fs.readdirSync(templatesPath)
      .filter(file => file.endsWith('.ts') || file.endsWith('.js'));
    
    // Extract template names without extension
    const templates = templateFiles.map(file => {
      const name = path.basename(file, path.extname(file));
      return {
        name,
        path: `../templates/${file}`
      };
    });
    
    res.json({
      success: true,
      templates
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving templates',
      error: (error as Error).message
    });
  }
});

export const adminRoutes = router;
