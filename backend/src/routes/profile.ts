import { Router, Response, Request } from 'express';
import { User } from '../models/User';
import { Content } from '../models/Content';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const router = Router();

// GET /api/v1/profile/:username - Fetch public content for a user
router.get('/:username', async (req: Request, res: Response): Promise<void> => {
    try {
        const { username } = req.params;

        // 1. Find user
        const user = await User.findOne({ username });
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        // 2. Fetch public content
        const contents = await Content.find({
            userId: user._id,
            isPublic: true
        })
            .sort({ createdAt: -1 });

        const formattedContent = contents.map(content => ({
            id: content._id,
            type: content.type,
            link: content.link,
            title: content.title,
            description: content.description,
            imageUrl: content.imageUrl,
        }));

        res.status(200).json({
            user: {
                username: user.username,
                displayName: user.displayName,
                bio: user.bio,
                profilePicUrl: user.profilePicUrl,
            },
            content: formattedContent
        });
    } catch (error) {
        console.error('❌ Profile fetch error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Validation for profile update
const updateProfileSchema = z.object({
    displayName: z.string().max(50).optional(),
    bio: z.string().max(200).optional(),
    profilePicUrl: z.string().url().optional().or(z.literal('')),
});

// PUT /api/v1/profile/update - Update user profile
router.put('/update', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const validation = updateProfileSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({ message: 'Invalid input', errors: validation.error.errors });
            return;
        }

        const { displayName, bio, profilePicUrl } = validation.data;
        const userId = req.userId;

        const user = await User.findByIdAndUpdate(
            userId,
            { $set: { displayName, bio, profilePicUrl } },
            { new: true }
        ).select('-password -refreshTokens');

        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        res.status(200).json({
            message: 'Profile updated successfully',
            user: {
                username: user.username,
                displayName: user.displayName,
                bio: user.bio,
                profilePicUrl: user.profilePicUrl,
            }
        });
    } catch (error) {
        console.error('❌ Profile update error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
