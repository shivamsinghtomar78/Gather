import { Router, Response } from 'express';
import { z } from 'zod';
import { Content } from '../models/Content';
import { Tag } from '../models/Tag';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { generateEmbedding, suggestTags, chatWithContext, summarizeTagContent, extractTextFromImage, generateFlashcards } from '../utils/gemini';
import { scrapeMetadata } from '../utils/scraper';

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
            res.status(411).json({ message: 'Error in inputs', errors: validation.error.errors });
            return;
        }

        let { type, link, title, tags, imageUrl, description } = validation.data;
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

        // 3. AI Auto-Tagging (if no tags provided)
        let finalTags = tags || [];
        if (finalTags.length === 0) {
            try {
                const suggested = await suggestTags(title, description);
                finalTags = suggested;
            } catch (err) {
                console.warn('⚠️ Auto-tagging failed');
            }
        }

        // Process tags - find existing or create new
        const tagIds = await Promise.all(
            finalTags.map(async (tagTitle: string) => {
                let tag = await Tag.findOne({ title: tagTitle.toLowerCase() });
                if (!tag) {
                    tag = await Tag.create({ title: tagTitle.toLowerCase() });
                }
                return tag._id;
            })
        );

        // 4. Generate embedding for RAG
        let embedding: number[] | undefined;
        try {
            embedding = await generateEmbedding(`${title} ${type} ${description || ''}`);
        } catch (error) {
            console.warn('⚠️ Embedding generation failed');
        }

        // Create content
        const content = await Content.create({
            type,
            link,
            title,
            description,
            imageUrl,
            embedding,
            tags: tagIds,
            userId
        });

        // 5. Emit Real-time update
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
                tags: finalTags
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

        const contents = await Content.find({
            $or: [
                { userId },
                { sharedWith: userId }
            ]
        })
            .populate('tags', 'title')
            .sort({ createdAt: -1 });

        const formattedContent = contents.map(content => ({
            id: content._id,
            type: content.type,
            link: content.link,
            title: content.title,
            description: content.description,
            imageUrl: content.imageUrl,
            tags: (content.tags as any[]).map(tag => tag.title),
            isPublic: content.isPublic
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

        // Emit Real-time update
        const io = req.app.get('io');
        io.emit(`content:deleted:${userId}`, { contentId });

        res.status(200).json({ message: 'Delete succeeded' });
    } catch (error) {
        console.error('Delete content error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/v1/content/flashcards - Generate flashcards from content
router.post('/flashcards', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { contentId } = req.body;
        const userId = req.userId;

        const content = await Content.findOne({ _id: contentId, userId });
        if (!content) {
            res.status(404).json({ message: 'Content not found' });
            return;
        }

        const flashcards = await generateFlashcards(content.title, content.description || '');
        res.status(200).json({ flashcards });
    } catch (error) {
        console.error('❌ Flashcard error:', error);
        res.status(500).json({ message: 'Server error during flashcard generation' });
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
    } catch (error) {
        console.error('❌ Status update error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/v1/content/ocr - Extract text from image
router.post('/ocr', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { image } = req.body;
        if (!image) {
            res.status(400).json({ message: 'Image data is required' });
            return;
        }

        const result = await extractTextFromImage(image);
        res.status(200).json(result);
    } catch (error) {
        console.error('❌ OCR error:', error);
        res.status(500).json({ message: 'Server error during OCR' });
    }
});

// POST /api/v1/content/summarize - Tag Summarization
router.post('/summarize', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { tag } = req.body;
        const userId = req.userId;

        if (!tag) {
            res.status(400).json({ message: 'Tag is required' });
            return;
        }

        // 1. Find the tag ID
        const tagDoc = await Tag.findOne({ title: tag.toLowerCase() });
        if (!tagDoc) {
            res.status(404).json({ message: 'Tag not found' });
            return;
        }

        // 2. Fetch all content for this tag and user
        const contents = await Content.find({
            userId,
            tags: tagDoc._id
        }).select('title description');

        if (contents.length === 0) {
            res.status(200).json({ summary: "No content found for this tag to summarize." });
            return;
        }

        // 3. Generate summary
        const summary = await summarizeTagContent(tag, contents.map(c => ({
            title: c.title,
            description: c.description
        })));

        res.status(200).json({ summary, count: contents.length });
    } catch (error) {
        console.error('❌ Summarization error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/v1/content/chat - AI Query Chat
router.post('/chat', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { query } = req.body;
        const userId = req.userId;

        if (!query) {
            res.status(400).json({ message: 'Query is required' });
            return;
        }

        // 1. Generate Query Embedding
        const queryEmbedding = await generateEmbedding(query);

        // 2. Perform Vector Search to get context
        const contextResults = await Content.aggregate([
            {
                $vectorSearch: {
                    index: "vector_index",
                    path: "embedding",
                    queryVector: queryEmbedding,
                    numCandidates: 50,
                    limit: 10,
                    filter: { userId: { $eq: userId } }
                }
            },
            {
                $project: {
                    title: 1,
                    description: 1,
                    type: 1
                }
            }
        ]);

        // 3. Format Context
        const contextString = contextResults
            .map(r => `Title: ${r.title}\nType: ${r.type}\nDescription: ${r.description || 'N/A'}`)
            .join('\n\n');

        // 4. Get response from Gemini
        const answer = await chatWithContext(query, contextString);

        res.status(200).json({ answer, context: contextResults });
    } catch (error) {
        console.error('❌ Chat error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
