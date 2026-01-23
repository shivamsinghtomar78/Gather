import { Router, Response } from 'express';
import { z } from 'zod';
import { Content } from '../models/Content';
import { Tag } from '../models/Tag';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { generateEmbedding } from '../utils/gemini';

const router = Router();

// Apply auth middleware
router.use(authMiddleware);

const searchSchema = z.object({
    query: z.string().min(1, 'Search query is required'),
    type: z.enum(['all', 'document', 'tweet', 'youtube', 'link']).optional().default('all')
});

// POST /api/v1/search
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const validation = searchSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(411).json({ message: 'Error in inputs', errors: validation.error.errors });
            return;
        }

        const { query, type } = validation.data;
        const userId = req.userId;

        console.log(`🔍 Native Atlas Search: "${query}", type: ${type}`);

        // 1. Generate Query Embedding
        const queryEmbedding = await generateEmbedding(query);

        // 2. Perform Native Vector Search via Aggregation
        // This requires an Atlas Vector Search index named 'vector_index' 
        // with the path 'embedding' and dimensions 768.
        const vectorFilter: any = {
            userId: { $eq: userId }
        };
        if (type !== 'all') {
            vectorFilter.type = { $eq: type };
        }

        let results: any[] = [];
        try {
            results = await Content.aggregate([
                {
                    $vectorSearch: {
                        index: "vector_index",
                        path: "embedding",
                        queryVector: queryEmbedding,
                        numCandidates: 100,
                        limit: 20,
                        filter: vectorFilter
                    }
                },
                {
                    $addFields: {
                        score: { $meta: "vectorSearchScore" }
                    }
                },
                {
                    $lookup: {
                        from: "tags",
                        localField: "tags",
                        foreignField: "_id",
                        as: "tagsInfo"
                    }
                },
                {
                    $project: {
                        _id: 1,
                        type: 1,
                        link: 1,
                        title: 1,
                        description: 1,
                        imageUrl: 1,
                        score: 1,
                        tags: {
                            $map: {
                                input: "$tagsInfo",
                                as: "tag",
                                in: "$$tag.title"
                            }
                        }
                    }
                }
            ]);

            console.log(`✅ Atlas Vector Search returned ${results.length} results`);
        } catch (vError) {
            console.warn('⚠️ Atlas Vector Search failed (Index might not be ready), falling back to keyword re-ranking.');

            // FALLBACK: Keyword search + Local re-ranking (same as previous implementation)
            const tags = await Tag.find({ title: { $regex: query, $options: 'i' } });
            const tagIds = tags.map(tag => tag._id);

            const keywordFilter: any = {
                userId,
                $or: [
                    { title: { $regex: query, $options: 'i' } },
                    { tags: { $in: tagIds } }
                ]
            };
            if (type !== 'all') keywordFilter.type = type;

            const candidates = await Content.find(keywordFilter).populate('tags', 'title').limit(50);

            results = candidates.map(doc => {
                // Simplified local similarity if needed, or just return keyword results
                return {
                    id: doc._id,
                    type: doc.type,
                    link: doc.link,
                    title: doc.title,
                    description: doc.description,
                    imageUrl: doc.imageUrl,
                    tags: (doc.tags as any[]).map(t => t.title),
                    score: 0.5
                };
            });
        }

        res.status(200).json({
            query,
            count: results.length,
            results: results.map(r => ({
                id: r._id || r.id,
                ...r,
                _id: undefined,
                tagsInfo: undefined
            }))
        });

    } catch (error) {
        console.error('❌ Search error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
