import { Router, Response } from 'express';
import { z } from 'zod';
import { Content } from '../models/Content';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { generateEmbedding } from '../utils/gemini';
import { scrapeMetadata } from '../utils/scraper';
import logger from '../utils/logger';

const router = Router();

// Apply auth middleware to all content routes
router.use(authMiddleware);

// Validation schema for content
const contentSchema = z.object({
    type: z.enum(['document', 'tweet', 'youtube', 'link']),
    link: z.string().url('Invalid URL format').optional().or(z.literal('')),
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    imageUrl: z.string().url('Invalid image URL format').optional().or(z.literal('')),
});

const deleteSchema = z.object({
    contentId: z.string()
});

// POST /api/v1/content - Add new content
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const validation = contentSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(411).json({ message: 'Error in inputs', errors: validation.error.errors });
            return;
        }

        let { type, link, title, imageUrl, description } = validation.data;
        const userId = req.userId;

        // 1. Deduplication (Check for existing link for this user)
        if (link) {
            const existingContent = await Content.findOne({ link, userId });
            if (existingContent) {
                res.status(200).json({
                    message: 'Content updated (Duplicate link)',
                    content: existingContent
                });
                return;
            }
        }

        // 2. Auto-Scraping (if it's a link-based type and metadata is missing)
        if (link && (!title || !imageUrl || !description)) {
            const metadata = await scrapeMetadata(link);
            title = title || metadata.title || 'Untitled';
            imageUrl = imageUrl || metadata.image;
            description = description || metadata.description;
        }

        // 3. Generate embedding for RAG
        let embedding: number[] | undefined;
        try {
            embedding = await generateEmbedding(`${title} ${type} ${description || ''}`);
        } catch (error) {
            logger.warn('⚠️ Embedding generation failed');
        }

        // Create content
        const content = await Content.create({
            type,
            link,
            title,
            description,
            imageUrl,
            embedding,
            userId
        });

        // 4. Emit Real-time update
        const io = req.app.get('io');
        io.emit(`content:added:${userId}`, {
            id: content._id,
            title: content.title,
            type: content.type
        });

        res.status(200).json({
            message: 'Content added successfully',
            content: {
                id: content._id,
                type: content.type,
                link: content.link,
                title: content.title,
                description: content.description,
                imageUrl: content.imageUrl,
            }
        });
    } catch (error: any) {
        logger.error(`Add content error: ${error.message}`);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/v1/content - Fetch all user content
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.userId;

        const contents = await Content.find({
            $or: [
                { userId },
                { sharedWith: userId }
            ]
        })
            .sort({ createdAt: -1 });

        const formattedContent = contents.map(content => ({
            id: content._id,
            type: content.type,
            link: content.link,
            title: content.title,
            description: content.description,
            imageUrl: content.imageUrl,
            isPublic: content.isPublic
        }));

        res.status(200).json({ content: formattedContent });
    } catch (error: any) {
        logger.error(`Fetch content error: ${error.message}`);
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE /api/v1/content/:contentId - Delete content
router.delete('/:contentId', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { contentId } = req.params;
        const userId = req.userId;

        // Find content
        const content = await Content.findById(contentId);

        if (!content) {
            res.status(404).json({ message: 'Content not found' });
            return;
        }

        // Check ownership
        if (content.userId.toString() !== userId) {
            res.status(403).json({ message: 'Trying to delete a doc you don\'t own' });
            return;
        }

        // Delete content
        await Content.findByIdAndDelete(contentId);

        // Emit Real-time update
        const io = req.app.get('io');
        io.emit(`content:deleted:${userId}`, { contentId });

        res.status(200).json({ message: 'Delete succeeded' });
    } catch (error: any) {
        logger.error(`Delete content error: ${error.message}`);
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT /api/v1/content/:contentId - Update content
router.put('/:contentId', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { contentId } = req.params;
        const userId = req.userId;
        const validation = contentSchema.safeParse(req.body);

        if (!validation.success) {
            res.status(411).json({ message: 'Error in inputs', errors: validation.error.errors });
            return;
        }

        const { type, link, title, imageUrl, description } = validation.data;

        const content = await Content.findOneAndUpdate(
            { _id: contentId, userId },
            { type, link, title, imageUrl, description },
            { new: true }
        );

        if (!content) {
            res.status(404).json({ message: 'Content not found' });
            return;
        }

        res.status(200).json({ message: 'Content updated successfully', content });
    } catch (error: any) {
        logger.error(`Update content error: ${error.message}`);
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT /api/v1/content/:contentId/public - Update public status
router.put('/:contentId/public', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { contentId } = req.params;
        const { isPublic } = req.body;
        const userId = req.userId;

        const content = await Content.findOne({ _id: contentId, userId });
        if (!content) {
            res.status(404).json({ message: 'Content not found' });
            return;
        }

        content.isPublic = isPublic;
        await content.save();

        res.status(200).json({ message: 'Public status updated', isPublic: content.isPublic });
    } catch (error: any) {
        logger.error(`Status update error: ${error.message}`);
        res.status(500).json({ message: 'Server error' });
    }
});


export default router;
