import { Router, Response, Request } from 'express';
import { User } from '../models/User';
import { Content } from '../models/Content';

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
                // Add bio/image if available in User model
            },
            content: formattedContent
        });
    } catch (error) {
        console.error('❌ Profile fetch error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
