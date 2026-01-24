import mongoose, { Schema, Document, Types } from 'mongoose';

export type ContentType = 'document' | 'tweet' | 'youtube' | 'link';

export interface IContent extends Document {
    link?: string;
    type: ContentType;
    title: string;
    description?: string;
    imageUrl?: string;
    embedding?: number[];
    userId: Types.ObjectId;
    sharedWith: Types.ObjectId[];
    isPublic: boolean;
}

const contentTypes: ContentType[] = ['document', 'tweet', 'youtube', 'link'];

const contentSchema = new Schema<IContent>({
    link: {
        type: String,
        required: false
    },
    type: {
        type: String,
        enum: contentTypes,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    imageUrl: {
        type: String
    },
    embedding: {
        type: [Number],
        index: false // We will manage the vector index separately in Atlas
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sharedWith: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    isPublic: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Validate that user exists before saving
contentSchema.pre('save', async function (next) {
    const User = mongoose.model('User');
    const user = await User.findById(this.userId);
    if (!user) {
        throw new Error('User does not exist');
    }
    next();
});

export const Content = mongoose.model<IContent>('Content', contentSchema);
