'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { authApi } from '@/lib/api';
import { Brain, Eye, EyeOff } from 'lucide-react';

type AuthMode = 'signin' | 'signup';

export default function AuthPage() {
    const router = useRouter();
    const [mode, setMode] = useState<AuthMode>('signin');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (mode === 'signup') {
                console.log('Attempting signup with:', { username, email });
                await authApi.signup(username, email, password);
                // After signup, sign in automatically
                console.log('Signup successful, attempting auto-login...');
                const response = await authApi.signin(email, password);
                localStorage.setItem('gather_token', response.data.token);
            } else {
                console.log('Attempting signin with email:', email);
                const response = await authApi.signin(email, password);
                localStorage.setItem('gather_token', response.data.token);
            }

            router.push('/dashboard');
        } catch (err: any) {
            console.error('Auth error:', err);
            console.error('Error response:', err.response);

            const message = err.response?.data?.message ||
                err.response?.data?.errors?.[0]?.message ||
                err.message ||
                'Something went wrong';
            setError(message);
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

                {/* Auth Card */}
                <div className="bg-slate-900/80 rounded-2xl shadow-2xl border border-purple-500/30 p-8 backdrop-blur-sm glow-purple">
                    <h1 className="text-2xl font-bold text-slate-100 text-center mb-2">
                        {mode === 'signin' ? 'Welcome back' : 'Create an account'}
                    </h1>
                    <p className="text-slate-400 text-center mb-8">
                        {mode === 'signin'
                            ? 'Sign in to access your second brain'
                            : 'Start building your knowledge base'}
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {mode === 'signup' && (
                            <div>
                                <label className="block text-sm font-medium text-slate-200 mb-1.5">
                                    Username
                                </label>
                                <Input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Enter your username"
                                    required
                                    minLength={3}
                                    maxLength={30}
                                />
                                <p className="text-xs text-slate-500 mt-1">3-30 characters</p>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-slate-200 mb-1.5">
                                Email
                            </label>
                            <Input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-200 mb-1.5">
                                Password
                            </label>
                            <div className="relative">
                                <Input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    required
                                    minLength={8}
                                    maxLength={20}
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {mode === 'signup' && (
                                <p className="text-xs text-slate-500 mt-1">
                                    8-20 chars, uppercase, lowercase, number, special char
                                </p>
                            )}
                        </div>

                        {error && (
                            <div className="bg-red-950/50 text-red-400 text-sm p-3 rounded-lg border border-red-500/30">
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full"
                            size="lg"
                            disabled={loading}
                        >
                            {loading
                                ? (mode === 'signin' ? 'Signing in...' : 'Creating account...')
                                : (mode === 'signin' ? 'Sign In' : 'Create Account')}
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-slate-400">
                            {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}
                            <button
                                onClick={() => {
                                    setMode(mode === 'signin' ? 'signup' : 'signin');
                                    setError('');
                                }}
                                className="ml-2 text-purple-400 font-medium hover:text-purple-300 transition-colors"
                            >
                                {mode === 'signin' ? 'Sign up' : 'Sign in'}
                            </button>
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-slate-600 text-sm mt-8">
                    © 2024 Gather. All rights reserved.
                </p>
            </div>
        </div>
    );
}
