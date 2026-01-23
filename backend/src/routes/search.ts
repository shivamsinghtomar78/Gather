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

// Helper for cosine similarity (if local fallback is needed)
function dotProduct(a: number[], b: number[]) {
    return a.reduce((sum, val, i) => sum + val * b[i], 0);
}

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

        console.log(`🔍 RAG Search: "${query}", type: ${type}, user: ${userId}`);

        // 1. Keyword search (Fall-back and multi-layer)
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

        const keywordResults = await Content.find(keywordFilter).populate('tags', 'title').limit(20);

        // 2. Vector Search (Semantic)
        let vectorResults: any[] = [];
        try {
            const queryEmbedding = await generateEmbedding(query);

            // Note: In a production environment with Atlas, we would use $vectorSearch aggregation.
            // For now, we fetch candidate documents and perform a semantic re-ranking or local similarity search.
            const candidates = await Content.find({
                userId,
                embedding: { $exists: true, $ne: [] }
            }).populate('tags', 'title');

            vectorResults = candidates.map(doc => {
                const score = doc.embedding ? dotProduct(queryEmbedding, doc.embedding) : 0;
                return { ...doc.toObject(), score };
            })
                .sort((a, b) => b.score - a.score)
                .filter(doc => doc.score > 0.7) // Similarity threshold
                .slice(0, 10);

        } catch (vError) {
            console.warn('⚠️ Vector search failed, falling back to keywords only:', vError);
        }

        // 3. Merge and Deduplicate Results
        const merged = new Map();

        // Add vector results first (higher relevance)
        vectorResults.forEach(doc => {
            merged.set(doc._id.toString(), {
                id: doc._id,
                type: doc.type,
                link: doc.link,
                title: doc.title,
                imageUrl: doc.imageUrl,
                tags: doc.tags.map((t: any) => t.title),
                score: doc.score,
                isSemantic: true
            });
        });

        // Add keyword results
        keywordResults.forEach(doc => {
            const id = doc._id.toString();
            if (!merged.has(id)) {
                merged.set(id, {
                    id: doc._id,
                    type: doc.type,
                    link: doc.link,
                    title: doc.title,
                    imageUrl: doc.imageUrl,
                    tags: (doc.tags as any[]).map(t => t.title),
                    score: 0.5, // Base score for keyword match
                    isSemantic: false
                });
            }
        });

        const finalResults = Array.from(merged.values())
            .sort((a, b) => b.score - a.score);

        res.status(200).json({
            query,
            count: finalResults.length,
            results: finalResults
        });

    } catch (error) {
        console.error('❌ Search error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
