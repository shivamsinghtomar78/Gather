'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { authApi } from '@/lib/api';
import { Brain, ArrowLeft, Mail, CheckCircle2, Loader2 } from 'lucide-react';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await authApi.forgotPassword(email);
            setSuccess(true);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to send reset link. Please try again.');
        } finally {
            setLoading(false);
        }
    };

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
                    {!success ? (
                        <>
                            <h1 className="text-2xl font-bold text-slate-100 text-center mb-2">
                                Forgot password?
                            </h1>
                            <p className="text-slate-400 text-center mb-8">
                                Enter your email address and we'll send you a link to reset your password.
                            </p>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-200 mb-1.5">
                                        Email address
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Mail className="h-5 w-5 text-slate-500" />
                                        </div>
                                        <Input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="you@example.com"
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
                                            Sending Link...
                                        </>
                                    ) : (
                                        'Send Reset Link'
                                    )}
                                </Button>
                            </form>
                        </>
                    ) : (
                        <div className="text-center">
                            <div className="flex justify-center mb-6">
                                <CheckCircle2 className="w-16 h-16 text-emerald-500" />
                            </div>
                            <h1 className="text-2xl font-bold text-slate-100 mb-4">
                                Check your email
                            </h1>
                            <p className="text-slate-400 mb-8">
                                We've sent a password reset link to <span className="text-white font-medium">{email}</span>. Please check your inbox and spam folder.
                            </p>
                            <Button
                                asChild
                                variant="outline"
                                className="w-full"
                            >
                                <Link href="/auth">
                                    Return to Sign In
                                </Link>
                            </Button>
                        </div>
                    )}

                    <div className="mt-8 pt-6 border-t border-slate-800 text-center">
                        <Link
                            href="/auth"
                            className="text-sm text-slate-400 hover:text-white flex items-center justify-center gap-2 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Sign In
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
