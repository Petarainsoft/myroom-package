import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { S3Service } from '../services/S3Service';
import { logger } from '../utils/logger';
import { validateApiKey } from '../middleware/auth';
import { skipProjectPermission } from '../middleware/skipProjectPermissions';

const router = Router();

// Initialize services
const prisma = new PrismaClient();
const s3Service = new S3Service();
const animationLogger = logger.child({ module: 'AnimationRoutes' });

// Error handler
const handleError = (error: any, res: Response): void => {
  animationLogger.error('Animation API Error:', error);

  if (error.message?.includes('not found')) {
    res.status(404).json({
      error: 'Not Found',
      message: error.message,
    });
    return;
  }

  res.status(500).json({
    error: 'Internal Server Error',
    message: 'An unexpected error occurred',
  });
};

/**
 * @swagger
 * /api/animations/{gender}:
 *   get:
 *     summary: Get animation GLB file URL by gender
 *     description: Returns the S3 URL for animation files (male_anims.glb or female_anims.glb)
 *     tags: [Animations]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: gender
 *         required: true
 *         schema:
 *           type: string
 *           enum: [male, female]
 *         description: The gender for animations (male or female)
 *     responses:
 *       200:
 *         description: Animation file URL
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *                       description: S3 URL for the animation file
 *                     gender:
 *                       type: string
 *                       description: Gender of the animations
 *                     filename:
 *                       type: string
 *                       description: Name of the animation file
 *       400:
 *         description: Invalid gender parameter
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Animation file not found
 */
router.get('/:gender',
  validateApiKey,
  skipProjectPermission('animation', 'download'),
  async (req: Request, res: Response) => {
    const startTime = Date.now();
    const { gender } = req.params;
    
    animationLogger.info({
      message: 'Animation request received',
      gender,
      developerId: (req as any).apiKey?.developerId,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    try {
      // Validate gender parameter
      if (!gender || !['male', 'female'].includes(gender.toLowerCase())) {
        animationLogger.warn({
          message: 'Invalid gender parameter',
          gender,
          ip: req.ip
        });
        res.status(400).json({
          error: 'Bad Request',
          message: 'Gender must be either "male" or "female"',
        });
        return;
      }

      const normalizedGender = gender.toLowerCase();
      const filename = `${normalizedGender}_anims.glb`;
      
      // Try to find animation in database first
      let s3Url: string;
      
      try {
        const animation = await prisma.animation.findFirst({
          where: {
            gender: normalizedGender.toUpperCase() as any,
            deletedAt: null,
            status: 'ACTIVE'
          }
        });

        if (animation) {
          animationLogger.debug({
            message: 'Found animation in database',
            animationId: animation.id,
            gender: normalizedGender
          });
          
          // Generate presigned URL for database entry
          s3Url = await s3Service.generateDownloadUrl(animation.s3Key);
        } else {
          // Fallback to direct S3 key construction
          animationLogger.debug({
            message: 'Animation not found in database, using direct S3 key',
            gender: normalizedGender,
            filename
          });
          
          const s3Key = `animations/${filename}`;
          s3Url = await s3Service.generateDownloadUrl(s3Key);
        }
      } catch (dbError) {
        // If database query fails, fallback to direct S3 access
        animationLogger.warn({
          message: 'Database query failed, using direct S3 access',
          error: dbError,
          gender: normalizedGender
        });
        
        const s3Key = `animations/${filename}`;
        s3Url = await s3Service.generateDownloadUrl(s3Key);
      }

      const responseTime = Date.now() - startTime;
      animationLogger.info({
        message: 'Animation URL generated successfully',
        gender: normalizedGender,
        filename,
        responseTimeMs: responseTime
      });

      res.json({
        success: true,
        data: {
          url: s3Url,
          gender: normalizedGender,
          filename
        },
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;
      animationLogger.error({
        message: 'Error generating animation URL',
        gender,
        error,
        responseTimeMs: responseTime
      });
      handleError(error, res);
    }
  }
);

/**
 * GET /api/animations
 * Get all available animations
 */
router.get('/', validateApiKey, async (req: Request, res: Response): Promise<void> => {
  try {
    const animations = await prisma.animation.findMany({
      where: {
        deletedAt: null,
        status: 'ACTIVE'
      },
      select: {
        id: true,
        name: true,
        description: true,
        gender: true,
        animationType: true,
        version: true,
        resourceId: true,
        isPremium: true,
        isFree: true,
        price: true,
        tags: true,
        keywords: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: [
        { gender: 'asc' },
        { animationType: 'asc' },
        { name: 'asc' }
      ]
    });

    res.json({
      success: true,
      data: animations,
      count: animations.length
    });
  } catch (error) {
    handleError(error, res);
  }
});

export default router;