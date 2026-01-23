import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IRefreshToken {
    sessionId: string;
    token: string; // This will store the hashed token
    deviceInfo?: string;
    createdAt: Date;
    expiresAt: Date;
}

export interface IUser extends Document {
    _id: Types.ObjectId;
    username: string;
    email: string;
    password: string;
    refreshTokens: IRefreshToken[];
    loginAttempts: number;
    lockUntil?: Date;
    isEmailVerified: boolean;
    emailVerificationToken?: string;
    emailVerificationExpires?: Date;
    passwordResetToken?: string;
    passwordResetExpires?: Date;
    createdAt: Date;
    updatedAt: Date;
    isLocked(): boolean;
    incLoginAttempts(): Promise<void>;
    resetLoginAttempts(): Promise<void>;
}

const refreshTokenSchema = new Schema<IRefreshToken>({
    sessionId: { type: String, required: true },
    token: { type: String, required: true },
    deviceInfo: { type: String },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true }
}, { _id: false });

const userSchema = new Schema<IUser>({
    username: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 30
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    refreshTokens: {
        type: [refreshTokenSchema],
        default: []
    },
    loginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: {
        type: Date
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    passwordResetToken: String,
    passwordResetExpires: Date
}, {
    timestamps: true
});

// Virtual to check if account is locked
userSchema.methods.isLocked = function (): boolean {
    return !!(this.lockUntil && this.lockUntil > new Date());
};

// Increment login attempts
userSchema.methods.incLoginAttempts = async function (): Promise<void> {
    // If we have a previous lock that has expired, reset attempts
    if (this.lockUntil && this.lockUntil < new Date()) {
        await this.updateOne({
            $set: { loginAttempts: 1 },
            $unset: { lockUntil: 1 }
        });
        return;
    }

    const updates: any = { $inc: { loginAttempts: 1 } };

    // Lock account after 5 failed attempts for 15 minutes
    if (this.loginAttempts + 1 >= 5) {
        updates.$set = { lockUntil: new Date(Date.now() + 15 * 60 * 1000) };
    }

    await this.updateOne(updates);
};

// Reset login attempts after successful login
userSchema.methods.resetLoginAttempts = async function (): Promise<void> {
    await this.updateOne({
        $set: { loginAttempts: 0 },
        $unset: { lockUntil: 1 }
    });
};

// Index for faster lookups
userSchema.index({ 'refreshTokens.token': 1 });

export const User = mongoose.model<IUser>('User', userSchema);

