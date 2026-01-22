import mongoose, { Schema, Document, Types } from 'mongoose';

export type ContentType = 'document' | 'tweet' | 'youtube' | 'link';

export interface IContent extends Document {
    link: string;
    type: ContentType;
    title: string;
    tags: Types.ObjectId[];
    userId: Types.ObjectId;
}

const contentTypes: ContentType[] = ['document', 'tweet', 'youtube', 'link'];

const contentSchema = new Schema<IContent>({
    link: {
        type: String,
        required: true
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
    tags: [{
        type: Schema.Types.ObjectId,
        ref: 'Tag'
    }],
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
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
