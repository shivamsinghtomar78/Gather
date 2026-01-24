import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Link } from '../models/Link';
import { Content } from '../models/Content';
import { User } from '../models/User';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { generateHash } from '../utils/hash';

const router = Router();

// Validation schema
const shareSchema = z.object({
    share: z.boolean()
});

// POST /api/v1/brain/share - Create or toggle share link
router.post('/share', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const validation = shareSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(411).json({
                message: 'Error in inputs',
                errors: validation.error.errors
            });
            return;
        }

        const { share } = validation.data;
        const userId = req.userId;

        if (share) {
            // Create or return existing share link
            let existingLink = await Link.findOne({ userId });

            if (!existingLink) {
                const hash = generateHash(10);
                existingLink = await Link.create({
                    hash,
                    userId
                });
            }

            res.status(200).json({
                message: 'Brain sharing enabled',
                hash: existingLink.hash,
                link: `/api/v1/brain/${existingLink.hash}`
            });
        } else {
            // Remove share link
            await Link.findOneAndDelete({ userId });

            res.status(200).json({
                message: 'Brain sharing disabled'
            });
        }
    } catch (error) {
        console.error('Share brain error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/v1/brain/:shareLink - Get shared brain content
router.get('/:shareLink', async (req: Request, res: Response): Promise<void> => {
    try {
        const { shareLink } = req.params;

        // Find link by hash
        const link = await Link.findOne({ hash: shareLink });

        if (!link) {
            res.status(404).json({ message: 'Share link is invalid or sharing is disabled' });
            return;
        }

        // Get user info
        const user = await User.findById(link.userId);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        // Get all user's content
        const contents = await Content.find({ userId: link.userId })
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

        res.status(200).json({
            username: user.username,
            content: formattedContent
        });
    } catch (error) {
        console.error('Get shared brain error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
