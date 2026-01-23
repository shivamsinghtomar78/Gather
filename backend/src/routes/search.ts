import { Router, Response } from 'express';
import { z } from 'zod';
import { Content } from '../models/Content';
import { Tag } from '../models/Tag';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// Apply auth middleware to all search routes
router.use(authMiddleware);

// Validation schema for search
const searchSchema = z.object({
    query: z.string().min(1, 'Search query is required'),
    type: z.enum(['all', 'document', 'tweet', 'youtube', 'link']).optional().default('all')
});

// POST /api/v1/search
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
    console.log('🔍 Search request:', req.body);

    try {
        const validation = searchSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(411).json({
                message: 'Error in inputs',
                errors: validation.error.errors
            });
            return;
        }

        const { query, type } = validation.data;
        const userId = req.userId;

        console.log(`Searching for: "${query}", type: ${type}, user: ${userId}`);

        // Search in tags first
        const tags = await Tag.find({
            title: { $regex: query, $options: 'i' }
        });
        const tagIds = tags.map(tag => tag._id);

        console.log(`Found ${tags.length} matching tags:`, tags.map(t => t.title));

        // Build search filter
        const searchFilter: any = {
            userId,
            $or: [
                { title: { $regex: query, $options: 'i' } }, // Case-insensitive title search
                { tags: { $in: tagIds } } // Tag search
            ]
        };

        // Add type filter if specified
        if (type !== 'all') {
            searchFilter.type = type;
        }

        // Execute search
        const results = await Content.find(searchFilter)
            .populate('tags', 'title')
            .sort({ createdAt: -1 })
            .limit(50);

        console.log(`Found ${results.length} content items matching search`);

        // Format results
        const formattedResults = results.map(content => ({
            id: content._id,
            type: content.type,
            link: content.link,
            title: content.title,
            tags: (content.tags as any[]).map(tag => tag.title)
        }));

        res.status(200).json({
            query,
            count: formattedResults.length,
            results: formattedResults
        });
    } catch (error) {
        console.error('❌ Search error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
