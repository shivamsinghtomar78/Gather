'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { authApi } from '@/lib/api';
import { Brain, Lock, Eye, EyeOff, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

function ResetPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    if (!token) {
        return (
            <div className="text-center">
                <div className="flex justify-center mb-6">
                    <XCircle className="w-16 h-16 text-rose-500" />
                </div>
                <h1 className="text-2xl font-bold text-slate-100 mb-4">Invalid Link</h1>
                <p className="text-slate-400 mb-8">This password reset link is invalid or has expired.</p>
                <Button asChild className="w-full">
                    <Link href="/auth/forgot-password">Request New Link</Link>
                </Button>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters long');
            return;
        }

        setLoading(true);

        try {
            await authApi.resetPassword(token, newPassword);
            setSuccess(true);
            setTimeout(() => {
                router.push('/auth');
            }, 3000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to reset password. The link may be expired.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="text-center">
                <div className="flex justify-center mb-6">
                    <CheckCircle2 className="w-16 h-16 text-emerald-500" />
                </div>
                <h1 className="text-2xl font-bold text-slate-100 mb-4">Password Reset!</h1>
                <p className="text-slate-400 mb-8">Your password has been successfully updated. You can now sign in with your new password.</p>
                <p className="text-sm text-slate-500 mb-6 font-medium italic">Redirecting to sign in...</p>
                <Button asChild className="w-full lg:w-3/4 mx-auto block px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
                    <Link href="/auth">Go to Sign In Now</Link>
                </Button>
            </div>
        );
    }

    return (
        <>
            <h1 className="text-2xl font-bold text-slate-100 text-center mb-2">
                Set new password
            </h1>
            <p className="text-slate-400 text-center mb-8">
                Please enter your new password below.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="block text-sm font-medium text-slate-200 mb-1.5">
                        New Password
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock className="h-4 w-4 text-slate-500" />
                        </div>
                        <Input
                            type={showPassword ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="At least 8 characters"
                            required
                            className="pl-10 pr-10"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-200 mb-1.5">
                        Confirm New Password
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock className="h-4 w-4 text-slate-500" />
                        </div>
                        <Input
                            type={showPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Repeat your password"
                            required
                            className="pl-10"
                        />
                    </div>
                </div>

                {error && (
                    <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm">
                        {error}
                    </div>
                )}

                <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-semibold py-6 shadow-lg shadow-purple-500/20"
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Updating Password...
                        </>
                    ) : (
                        'Reset Password'
                    )}
                </Button>
            </form>
        </>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px] animate-pulse" />
                <div className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-cyan-600/15 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            <div className="w-full max-w-md relative z-10">
                {/* Logo */}
                <Link href="/" className="flex items-center justify-center gap-3 mb-8">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center glow-purple">
                        <Brain className="w-7 h-7 text-white" />
                    </div>
                    <span className="text-2xl font-bold text-white">Gather</span>
                </Link>

                <div className="bg-slate-900/80 rounded-2xl shadow-2xl border border-purple-500/30 p-8 backdrop-blur-sm glow-purple">
                    <Suspense fallback={
                        <div className="text-center py-8">
                            <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
                            <p className="text-slate-400">Loading...</p>
                        </div>
                    }>
                        <ResetPasswordContent />
                    </Suspense>
                </div>
            </div>
        </div>
    );
}
