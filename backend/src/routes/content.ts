import { Router, Response } from 'express';
import { z } from 'zod';
import { Content } from '../models/Content';
import { Tag } from '../models/Tag';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { generateEmbedding } from '../utils/gemini';

const router = Router();

// Apply auth middleware to all content routes
router.use(authMiddleware);

// Validation schema for content
const contentSchema = z.object({
    type: z.enum(['document', 'tweet', 'youtube', 'link']),
    link: z.string().url('Invalid URL format'),
    title: z.string().min(1, 'Title is required'),
    imageUrl: z.string().url('Invalid image URL format').optional().or(z.literal('')),
    tags: z.array(z.string()).optional().default([])
});

const deleteSchema = z.object({
    contentId: z.string()
});

// POST /api/v1/content - Add new content
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const validation = contentSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(411).json({
                message: 'Error in inputs',
                errors: validation.error.errors
            });
            return;
        }

        const { type, link, title, tags, imageUrl } = validation.data;
        const userId = req.userId;

        // Process tags - find existing or create new
        const tagIds = await Promise.all(
            tags.map(async (tagTitle: string) => {
                let tag = await Tag.findOne({ title: tagTitle.toLowerCase() });
                if (!tag) {
                    tag = await Tag.create({ title: tagTitle.toLowerCase() });
                }
                return tag._id;
            })
        );

        // Generate embedding for search (RAG)
        let embedding: number[] | undefined;
        try {
            embedding = await generateEmbedding(`${title} ${type}`);
        } catch (error) {
            console.warn('⚠️ Embedding generation failed, following back to keyword search:', error);
        }

        // Create content
        const content = await Content.create({
            type,
            link,
            title,
            imageUrl,
            embedding,
            tags: tagIds,
            userId
        });

        res.status(200).json({
            message: 'Content added successfully',
            content: {
                id: content._id,
                type: content.type,
                link: content.link,
                title: content.title,
                imageUrl: content.imageUrl,
                tags
            }
        });
    } catch (error) {
        console.error('Add content error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/v1/content - Fetch all user content
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.userId;

        const contents = await Content.find({ userId })
            .populate('tags', 'title')
            .sort({ createdAt: -1 });

        const formattedContent = contents.map(content => ({
            id: content._id,
            type: content.type,
            link: content.link,
            title: content.title,
            tags: (content.tags as any[]).map(tag => tag.title)
        }));

        res.status(200).json({ content: formattedContent });
    } catch (error) {
        console.error('Fetch content error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE /api/v1/content - Delete content
router.delete('/', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const validation = deleteSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(411).json({
                message: 'Error in inputs',
                errors: validation.error.errors
            });
            return;
        }

        const { contentId } = validation.data;
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

        res.status(200).json({ message: 'Delete succeeded' });
    } catch (error) {
        console.error('Delete content error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
