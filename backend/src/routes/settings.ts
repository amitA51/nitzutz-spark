import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get user settings
router.get('/', async (req: Request, res: Response) => {
  try {
    // For single-user app, we use a fixed ID
    const SINGLE_USER_ID = 'default-user';
    
    let settings = await prisma.userSettings.findUnique({
      where: { id: SINGLE_USER_ID },
    });
    
    // Create default settings if not exists
    if (!settings) {
      settings = await prisma.userSettings.create({
        data: {
          id: SINGLE_USER_ID,
          theme: 'dark',
          aiProvider: 'openai',
        },
      });
    }
    
    // Don't send sensitive data to client
    const safeSettings = {
      ...settings,
      aiApiKey: settings.aiApiKey ? '••••••••' : null,
      googleDriveAuth: settings.googleDriveAuth ? 'configured' : null,
    };
    
    res.json(safeSettings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update user settings
router.put('/', async (req: Request, res: Response) => {
  try {
    const SINGLE_USER_ID = 'default-user';
    const { theme, aiProvider, aiApiKey } = req.body;
    
    // Ensure settings exist
    const existing = await prisma.userSettings.findUnique({
      where: { id: SINGLE_USER_ID },
    });
    
    if (!existing) {
      await prisma.userSettings.create({
        data: {
          id: SINGLE_USER_ID,
          theme: 'dark',
          aiProvider: 'openai',
        },
      });
    }
    
    // Update settings
    const settings = await prisma.userSettings.update({
      where: { id: SINGLE_USER_ID },
      data: {
        theme,
        aiProvider,
        // Only update API key if provided (not the masked value)
        ...(aiApiKey && aiApiKey !== '••••••••' ? { aiApiKey } : {}),
      },
    });
    
    // Return safe settings
    const safeSettings = {
      ...settings,
      aiApiKey: settings.aiApiKey ? '••••••••' : null,
      googleDriveAuth: settings.googleDriveAuth ? 'configured' : null,
    };
    
    res.json(safeSettings);
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Clear AI API key
router.delete('/ai-key', async (req: Request, res: Response) => {
  try {
    const SINGLE_USER_ID = 'default-user';
    
    await prisma.userSettings.update({
      where: { id: SINGLE_USER_ID },
      data: {
        aiApiKey: null,
      },
    });
    
    res.status(204).send();
  } catch (error) {
    console.error('Error clearing AI key:', error);
    res.status(500).json({ error: 'Failed to clear AI key' });
  }
});

// Google OAuth placeholder endpoints
router.get('/auth/google', async (req: Request, res: Response) => {
  // TODO: Implement Google OAuth flow
  res.status(501).json({ 
    error: 'Google OAuth not yet implemented',
    message: 'This feature will be available in Stage 3' 
  });
});

router.get('/auth/google/callback', async (req: Request, res: Response) => {
  // TODO: Handle Google OAuth callback
  res.status(501).json({ 
    error: 'Google OAuth callback not yet implemented',
    message: 'This feature will be available in Stage 3' 
  });
});

export default router;