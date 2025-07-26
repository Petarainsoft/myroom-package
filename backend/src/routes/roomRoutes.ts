import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { RoomController } from '../controllers/RoomController';
import { RoomManagementService } from '../services/RoomManagementService';
import { S3Service } from '../services/S3Service';
import { validateApiKey, validateJWT, validateDeveloperJWT } from '../middleware/auth';
import { validateAdmin } from '../middleware/adminAuth';
import { skipProjectPermission, skipProjectPermissionByResourceId } from '../middleware/skipProjectPermissions';

// Create middleware combinations
const authenticateAdmin = [validateJWT, validateAdmin];
const authenticateDeveloper = validateDeveloperJWT;
const authenticateApiKey = validateApiKey;

const router = Router();

// Initialize services
const prisma = new PrismaClient();
const s3Service = new S3Service();
const roomManagementService = new RoomManagementService(prisma, s3Service);
const roomController = new RoomController(roomManagementService);
const uploadMiddleware = roomController.getUploadMiddleware();

// Admin Routes (require admin authentication)

/**
 * @swagger
 * /api/rooms:
 *   post:
 *     summary: Create a new room resource
 *     description: Upload and create a new room resource (GLB file) with metadata
 *     tags: [Room Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: GLB file for the room
 *               name:
 *                 type: string
 *                 description: Room name
 *                 example: "Modern Office Space"
 *               description:
 *                 type: string
 *                 description: Room description
 *               roomType:
 *                 type: string
 *                 description: Room type/category
 *                 example: "office"
 *               isPaid:
 *                 type: boolean
 *                 description: Whether the room requires payment
 *               price:
 *                 type: number
 *                 description: Room price (if paid)
 *               tags:
 *                 type: string
 *                 description: Comma-separated tags
 *             required:
 *               - file
 *               - name
 *               - roomType
 *     responses:
 *       201:
 *         description: Room resource created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Room'
 *       400:
 *         description: Invalid input or file format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/',
  authenticateAdmin,
  uploadMiddleware,
  (req: Request, res: Response) => roomController.createRoomResource(req, res)
);

/**
 * @swagger
 * /api/rooms/{id}:
 *   put:
 *     summary: Update room resource
 *     description: Update room resource metadata and properties
 *     tags: [Room Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Room resource ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Room name
 *               description:
 *                 type: string
 *                 description: Room description
 *               roomType:
 *                 type: string
 *                 description: Room type/category
 *               isPaid:
 *                 type: boolean
 *                 description: Whether the room requires payment
 *               price:
 *                 type: number
 *                 description: Room price (if paid)
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Room tags
 *               isActive:
 *                 type: boolean
 *                 description: Whether the room is active
 *     responses:
 *       200:
 *         description: Room resource updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Room'
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Room resource not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put(
  '/:id',
  authenticateAdmin,
  (req: Request, res: Response) => roomController.updateRoomResource(req, res)
);

/**
 * @swagger
 * /api/rooms/{id}:
 *   delete:
 *     summary: Delete room resource
 *     description: Soft delete a room resource (marks as inactive)
 *     tags: [Room Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Room resource ID
 *     responses:
 *       200:
 *         description: Room resource deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Room resource not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete(
  '/:id',
  authenticateAdmin,
  (req: Request, res: Response) => roomController.deleteRoomResource(req, res)
);

/**
 * @swagger
 * /api/rooms/{id}/permissions:
 *   post:
 *     summary: Grant room resource permission to developer
 *     description: Grant specific permissions for a room resource to a developer's project
 *     tags: [Room Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Room resource ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               developerId:
 *                 type: string
 *                 format: uuid
 *                 description: Developer ID to grant permission to
 *               projectId:
 *                 type: string
 *                 format: uuid
 *                 description: Project ID for the permission
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [access, download]
 *                 description: List of permissions to grant
 *                 example: ["access", "download"]
 *             required:
 *               - developerId
 *               - projectId
 *               - permissions
 *     responses:
 *       201:
 *         description: Permission granted successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/RoomPermission'
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Room resource not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Permission already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/:id/permissions',
  authenticateAdmin,
  (req: Request, res: Response) => roomController.grantRoomPermission(req, res)
);

/**
 * @swagger
 * /api/rooms/{id}/download:
 *   get:
 *     summary: Download room resource file
 *     description: Direct download of room GLB file (admin only)
 *     tags: [Room Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Room resource ID
 *     responses:
 *       200:
 *         description: File download initiated
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Room resource not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/:id/download',
  authenticateAdmin,
  (req: Request, res: Response) => roomController.downloadRoomResource(req, res)
);

/**
 * @swagger
 * /api/rooms/stats:
 *   get:
 *     summary: Get room resource statistics
 *     description: Retrieve comprehensive statistics about room resources
 *     tags: [Room Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Room statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         totalRooms:
 *                           type: integer
 *                           description: Total number of room resources
 *                         activeRooms:
 *                           type: integer
 *                           description: Number of active room resources
 *                         totalDownloads:
 *                           type: integer
 *                           description: Total download count across all rooms
 *                         roomsByType:
 *                           type: object
 *                           description: Room count grouped by type
 *                         averageFileSize:
 *                           type: number
 *                           description: Average file size in bytes
 *                         totalStorageUsed:
 *                           type: integer
 *                           description: Total storage used in bytes
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/stats',
  authenticateAdmin,
  (req: Request, res: Response) => roomController.getRoomResourceStats(req, res)
);

/**
 * @swagger
 * /api/rooms/usage:
 *   get:
 *     summary: Get room usage statistics
 *     description: Retrieve detailed usage statistics for room resources
 *     tags: [Room Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for usage statistics
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for usage statistics
 *       - in: query
 *         name: roomType
 *         schema:
 *           type: string
 *         description: Filter by room type
 *     responses:
 *       200:
 *         description: Room usage statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         totalUsage:
 *                           type: integer
 *                           description: Total usage count
 *                         usageByType:
 *                           type: object
 *                           description: Usage grouped by room type
 *                         usageByDate:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               date:
 *                                 type: string
 *                                 format: date
 *                               count:
 *                                 type: integer
 *                         topRooms:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               roomId:
 *                                 type: string
 *                               name:
 *                                 type: string
 *                               usageCount:
 *                                 type: integer
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/usage',
  authenticateAdmin,
  (req: Request, res: Response) => roomController.getRoomUsage(req, res)
);

// Admin routes for room types

/**
 * @swagger
 * /api/rooms/types:
 *   get:
 *     summary: Get all room types
 *     description: Retrieve all available room types for categorization
 *     tags: [Room Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Room types retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/RoomType'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/types',
  authenticateAdmin,
  (req: Request, res: Response) => roomController.getRoomTypes(req, res)
);

/**
 * @swagger
 * /api/rooms/types:
 *   post:
 *     summary: Create new room type
 *     description: Create a new room type for categorization
 *     tags: [Room Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Room type name (unique identifier)
 *                 example: "conference"
 *               displayName:
 *                 type: string
 *                 description: Display name for the room type
 *                 example: "Conference Rooms"
 *               description:
 *                 type: string
 *                 description: Room type description
 *                 example: "Professional conference and meeting spaces"
 *             required:
 *               - name
 *               - displayName
 *     responses:
 *       201:
 *         description: Room type created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/RoomType'
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Room type name already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/types',
  authenticateAdmin,
  (req: Request, res: Response) => roomController.createRoomType(req, res)
);

/**
 * @swagger
 * /api/rooms/types/{id}:
 *   put:
 *     summary: Update room type
 *     description: Update an existing room type
 *     tags: [Room Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Room type ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Room type name
 *               displayName:
 *                 type: string
 *                 description: Display name for the room type
 *               description:
 *                 type: string
 *                 description: Room type description
 *               isActive:
 *                 type: boolean
 *                 description: Whether the room type is active
 *     responses:
 *       200:
 *         description: Room type updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/RoomType'
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Room type not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put(
  '/types/:id',
  authenticateAdmin,
  (req: Request, res: Response) => roomController.updateRoomType(req, res)
);

/**
 * @swagger
 * /api/rooms/types/{id}:
 *   delete:
 *     summary: Delete room type
 *     description: Delete a room type (soft delete)
 *     tags: [Room Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Room type ID
 *     responses:
 *       200:
 *         description: Room type deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Room type not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Cannot delete room type with existing rooms
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete(
  '/types/:id',
  authenticateAdmin,
  (req: Request, res: Response) => roomController.deleteRoomType(req, res)
);

// Public Routes (require API key authentication)

/**
 * @swagger
 * /api/rooms:
 *   get:
 *     summary: Get room resources with filtering and pagination
 *     description: Retrieve a paginated list of room resources with optional filtering
 *     tags: [Room System]
 *     security:
 *       - apiKey: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of items per page
 *       - in: query
 *         name: roomType
 *         schema:
 *           type: string
 *         description: Filter by room type
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in room name and description
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: Filter by tags (comma-separated)
 *       - in: query
 *         name: isPaid
 *         schema:
 *           type: boolean
 *         description: Filter by paid/free rooms
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, createdAt, downloadCount, price]
 *           default: createdAt
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Room resources retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         rooms:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Room'
 *                         pagination:
 *                           $ref: '#/components/schemas/PaginationMeta'
 *       400:
 *         description: Invalid query parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Unauthorized - Invalid or missing API key
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/',
  authenticateApiKey,
  (req: Request, res: Response) => roomController.getRoomResources(req, res)
);

/**
 * @swagger
 * /api/rooms/type/{roomType}:
 *   get:
 *     summary: Get rooms by type
 *     description: Retrieve all rooms of a specific type
 *     tags: [Room System]
 *     security:
 *       - apiKey: []
 *     parameters:
 *       - in: path
 *         name: roomType
 *         required: true
 *         schema:
 *           type: string
 *         description: Room type name
 *         example: "meeting"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Rooms retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Room'
 *                     meta:
 *                       $ref: '#/components/schemas/PaginationMeta'
 *       401:
 *         description: Unauthorized - Invalid API key
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Room type not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/type/:roomType',
  authenticateApiKey,
  (req: Request, res: Response) => roomController.getRoomResourcesByRoomType(req, res)
);

/**
 * @swagger
 * /api/rooms/{id}/presigned-download:
 *   get:
 *     summary: Get presigned download URL for room resource
 *     description: Generate a temporary presigned URL for downloading room GLB file
 *     tags: [Room System]
 *     security:
 *       - apiKey: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Room resource ID
 *     responses:
 *       200:
 *         description: Presigned download URL generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         downloadUrl:
 *                           type: string
 *                           format: uri
 *                           description: Presigned download URL (expires in 1 hour)
 *                         expiresAt:
 *                           type: string
 *                           format: date-time
 *                           description: URL expiration timestamp
 *                         fileName:
 *                           type: string
 *                           description: Original file name
 *                         fileSize:
 *                           type: integer
 *                           description: File size in bytes
 *       400:
 *         description: Invalid room ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Unauthorized - Invalid or missing API key
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - No download permission for this room
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Room resource not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/:id/presigned-download',
  authenticateApiKey,
  skipProjectPermission('room', 'download'),
  (req: Request, res: Response) => roomController.getRoomPresignedDownloadUrl(req, res)
);

/**
 * @swagger
 * /api/rooms/{id}/permissions/check:
 *   get:
 *     summary: Check room resource permission
 *     description: Check if the authenticated project has permission to access a room resource
 *     tags: [Room System]
 *     security:
 *       - apiKey: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Room resource ID
 *       - in: query
 *         name: permission
 *         schema:
 *           type: string
 *           enum: [access, download]
 *           default: access
 *         description: Permission type to check
 *     responses:
 *       200:
 *         description: Permission check completed
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         hasPermission:
 *                           type: boolean
 *                           description: Whether the project has the requested permission
 *                         permission:
 *                           type: string
 *                           description: The permission type checked
 *                         roomId:
 *                           type: string
 *                           format: uuid
 *                           description: Room resource ID
 *       401:
 *         description: Unauthorized - Invalid API key
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Room resource not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/:id/permissions/check',
  authenticateApiKey,
  (req: Request, res: Response) => roomController.checkRoomPermission(req, res)
);

/**
 * @swagger
 * /api/rooms/{id}/usage:
 *   post:
 *     summary: Track room resource usage
 *     description: Record usage of a room resource for analytics
 *     tags: [Room System]
 *     security:
 *       - apiKey: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Room resource ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [view, download, use]
 *                 default: use
 *                 description: Type of usage action
 *               metadata:
 *                 type: object
 *                 description: Additional usage metadata
 *                 properties:
 *                   sessionId:
 *                     type: string
 *                     description: Session identifier
 *                   duration:
 *                     type: integer
 *                     description: Usage duration in seconds
 *                   userAgent:
 *                     type: string
 *                     description: User agent string
 *     responses:
 *       200:
 *         description: Usage tracked successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: Unauthorized - Invalid API key
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Room resource not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/:id/usage',
  authenticateApiKey,
  (req: Request, res: Response) => roomController.trackRoomUsage(req, res)
);

/**
 * @swagger
 * /api/rooms/resource/{resourceId}:
 *   get:
 *     summary: Get room resource by resourceId
 *     description: Retrieve a room resource using its resourceId
 *     tags: [Room System]
 *     security:
 *       - apiKey: []
 *     parameters:
 *       - in: path
 *         name: resourceId
 *         required: true
 *         schema:
 *           type: string
 *         description: Room resource identifier
 *         example: "room_modern_office_001"
 *     responses:
 *       200:
 *         description: Room resource retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Room'
 *       401:
 *         description: Unauthorized - Invalid API key
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - No access permission
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Room resource not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/resource/:resourceId',
  authenticateApiKey,
  skipProjectPermissionByResourceId('room', 'access'),
  (req: Request, res: Response) => roomController.getRoomResourceByResourceId(req, res)
);

/**
 * @swagger
 * /api/rooms/resource/{resourceId}/presigned-download:
 *   get:
 *     summary: Get presigned download URL by resourceId
 *     description: Generate a temporary presigned URL for downloading room GLB file using resourceId
 *     tags: [Room System]
 *     security:
 *       - apiKey: []
 *     parameters:
 *       - in: path
 *         name: resourceId
 *         required: true
 *         schema:
 *           type: string
 *         description: Room resource identifier
 *         example: "room_modern_office_001"
 *     responses:
 *       200:
 *         description: Presigned download URL generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         downloadUrl:
 *                           type: string
 *                           format: uri
 *                           description: Presigned download URL (expires in 1 hour)
 *                         expiresAt:
 *                           type: string
 *                           format: date-time
 *                           description: URL expiration timestamp
 *                         fileName:
 *                           type: string
 *                           description: Original file name
 *                         fileSize:
 *                           type: integer
 *                           description: File size in bytes
 *       401:
 *         description: Unauthorized - Invalid API key
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - No download permission
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Room resource not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/resource/:resourceId/presigned-download',
  authenticateApiKey,
  skipProjectPermissionByResourceId('room', 'download'),
  (req: Request, res: Response) => roomController.getRoomPresignedDownloadUrlByResourceId(req, res)
);

/**
 * @swagger
 * /api/rooms/{id}:
 *   get:
 *     summary: Get room resource by ID
 *     description: Retrieve a specific room resource by its UUID
 *     tags: [Room System]
 *     security:
 *       - apiKey: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Room resource UUID
 *     responses:
 *       200:
 *         description: Room resource retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Room'
 *       401:
 *         description: Unauthorized - Invalid API key
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - No access permission
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Room resource not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/:id',
  authenticateApiKey,
  skipProjectPermission('room', 'access'),
  (req: Request, res: Response) => roomController.getRoomResourceById(req, res)
);

// Developer Routes (require developer authentication)

/**
 * @swagger
 * /api/rooms/my/permissions:
 *   get:
 *     summary: Get developer's room permissions
 *     description: Retrieve all room permissions granted to the authenticated developer
 *     tags: [Room System]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by specific project ID
 *       - in: query
 *         name: roomType
 *         schema:
 *           type: string
 *         description: Filter by room type
 *       - in: query
 *         name: permission
 *         schema:
 *           type: string
 *           enum: [access, download]
 *         description: Filter by specific permission type
 *     responses:
 *       200:
 *         description: Room permissions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         allOf:
 *                           - $ref: '#/components/schemas/RoomPermission'
 *                           - type: object
 *                             properties:
 *                               room:
 *                                 $ref: '#/components/schemas/Room'
 *                               project:
 *                                 type: object
 *                                 properties:
 *                                   id:
 *                                     type: string
 *                                     format: uuid
 *                                   name:
 *                                     type: string
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/my/permissions',
  authenticateDeveloper,
  (req: Request, res: Response) => roomController.getRoomPermissions(req, res)
);

/**
 * @swagger
 * /api/rooms/my/usage:
 *   get:
 *     summary: Get my room usage
 *     description: Get room usage statistics for the authenticated developer
 *     tags: [Room System]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for usage statistics (YYYY-MM-DD)
 *         example: "2024-01-01"
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for usage statistics (YYYY-MM-DD)
 *         example: "2024-12-31"
 *       - in: query
 *         name: roomType
 *         schema:
 *           type: string
 *         description: Filter by room type
 *         example: "meeting"
 *     responses:
 *       200:
 *         description: Room usage statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/RoomUsage'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/my/usage',
  authenticateDeveloper,
  (req: Request, res: Response) => roomController.getRoomUsage(req, res)
);

// Error handling middleware
router.use((error: any, req: any, res: any, next: any) => {
  console.error('Room routes error:', error);
  
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      error: 'File too large',
      message: 'File size must be less than 100MB'
    });
  }
  
  if (error.message === 'Only GLB files are allowed') {
    return res.status(400).json({
      error: 'Invalid file type',
      message: 'Only GLB files are allowed'
    });
  }
  
  res.status(500).json({
    error: 'Internal server error',
    message: 'An unexpected error occurred'
  });
});

export default router;