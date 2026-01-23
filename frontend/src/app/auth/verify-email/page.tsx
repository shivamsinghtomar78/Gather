'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { authApi } from '@/lib/api';
import { Brain, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

function VerifyEmailContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Verifying your email...');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Invalid verification link.');
            return;
        }

        const verify = async () => {
            try {
                await authApi.verifyEmail(token);
                setStatus('success');
                setMessage('Your email has been verified successfully!');

                // Redirect to signin after 3 seconds
                setTimeout(() => {
                    router.push('/auth');
                }, 3000);
            } catch (err: any) {
                setStatus('error');
                setMessage(err.response?.data?.message || 'Verification failed. The link may be expired.');
            }
        };

        verify();
    }, [token, router]);

    return (
        <div className="bg-slate-900/80 rounded-2xl shadow-2xl border border-purple-500/30 p-8 backdrop-blur-sm glow-purple text-center">
            <div className="flex justify-center mb-6">
                {status === 'loading' && (
                    <Loader2 className="w-16 h-16 text-purple-500 animate-spin" />
                )}
                {status === 'success' && (
                    <CheckCircle2 className="w-16 h-16 text-emerald-500" />
                )}
                {status === 'error' && (
                    <XCircle className="w-16 h-16 text-rose-500" />
                )}
            </div>

            <h1 className="text-2xl font-bold text-slate-100 mb-4">
                {status === 'loading' && 'Verifying Email'}
                {status === 'success' && 'Email Verified!'}
                {status === 'error' && 'Verification Failed'}
            </h1>

            <p className="text-slate-400 mb-8">
                {message}
            </p>

            {status === 'success' && (
                <p className="text-sm text-slate-500 mb-6">
                    Redirecting you to the sign-in page...
                </p>
            )}

            <div className="space-y-4">
                <Button
                    asChild
                    variant={status === 'error' ? 'default' : 'outline'}
                    className="w-full"
                >
                    <Link href="/auth">
                        Go to Sign In
                    </Link>
                </Button>

                {status === 'error' && (
                    <Button
                        asChild
                        variant="link"
                        className="text-slate-400 hover:text-white"
                    >
                        <Link href="/">
                            Back to Home
                        </Link>
                    </Button>
                )}
            </div>
        </div>
    );
}

export default function VerifyEmailPage() {
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

                <Suspense fallback={
                    <div className="bg-slate-900/80 rounded-2xl border border-purple-500/30 p-8 backdrop-blur-sm text-center">
                        <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
                        <p className="text-slate-400">Loading...</p>
                    </div>
                }>
                    <VerifyEmailContent />
                </Suspense>
            </div>
        </div>
    );
}
