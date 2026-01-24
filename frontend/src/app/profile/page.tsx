'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar, FilterType } from '@/components/Sidebar';
import {
    User,
    Mail,
    Calendar,
    ShieldCheck,
    Camera,
    Save,
    Loader2,
    ArrowLeft,
    CheckCircle2,
    XCircle,
    Eye,
    EyeOff,
    Brain
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { authApi, profileApi, tokenManager } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProfilePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Profile State
    const [displayName, setDisplayName] = useState('');
    const [bio, setBio] = useState('');
    const [profilePicUrl, setProfilePicUrl] = useState('');

    // Password State
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPasswords, setShowPasswords] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB Limit
                setMessage({ type: 'error', text: 'Image size should be less than 5MB' });
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                setProfilePicUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        try {
            const response = await authApi.getMe();
            const userData = response.data.user;
            setUser(userData);
            setDisplayName(userData.displayName || '');
            setBio(userData.bio || '');
            setProfilePicUrl(userData.profilePicUrl || '');
        } catch (error) {
            console.error('Failed to fetch user data:', error);
            router.push('/auth');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            await profileApi.updateProfile({ displayName, bio, profilePicUrl });
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
            // Refresh user data to get updated virtual fields or similar if needed
            fetchUserData();
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update profile' });
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'New passwords do not match' });
            return;
        }

        setSaving(true);
        try {
            await authApi.changePassword(oldPassword, newPassword);
            setMessage({ type: 'success', text: 'Password changed successfully! You may need to sign in again on other devices.' });
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to change password' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-slate-950 text-slate-100">
            <Sidebar activeFilter="all" onFilterChange={() => router.push('/dashboard')} />

            <main className="flex-1 lg:pl-64 pb-20 lg:pb-0">
                <div className="max-w-4xl mx-auto px-6 py-12">
                    {/* Header */}
                    <header className="mb-12">
                        <div className="flex items-center gap-4 mb-2">
                            <button
                                onClick={() => router.push('/dashboard')}
                                className="p-2 -ml-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <h1 className="text-4xl font-black text-white tracking-tight">Profile Settings</h1>
                        </div>
                        <p className="text-slate-400">Manage your identity and security across the Gather platform.</p>
                    </header>

                    {/* Notification Toast (Subtle) */}
                    <AnimatePresence>
                        {message.text && (
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className={`mb-8 p-4 rounded-xl border flex items-center gap-3 ${message.type === 'success'
                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                    : 'bg-red-500/10 border-red-500/20 text-red-400'
                                    }`}
                            >
                                {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                                <span className="text-sm font-medium">{message.text}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Profile Info Section */}
                        <div className="md:col-span-2 space-y-8">
                            <section className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-3xl p-8 shadow-xl">
                                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                    <User className="w-5 h-5 text-purple-400" />
                                    Personal Information
                                </h3>

                                <form onSubmit={handleUpdateProfile} className="space-y-6">
                                    <div className="flex flex-col sm:flex-row gap-8 items-start sm:items-center">
                                        <label className="relative group cursor-pointer">
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={handleFileChange}
                                            />
                                            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center overflow-hidden shadow-lg glow-purple-sm group-hover:scale-95 transition-transform">
                                                {profilePicUrl ? (
                                                    <img src={profilePicUrl} alt="Avatar" className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-4xl font-black text-white">{user?.username?.[0]?.toUpperCase()}</span>
                                                )}
                                            </div>
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-3xl">
                                                <Camera className="w-6 h-6 text-white" />
                                            </div>
                                        </label>
                                        <div className="flex-1 space-y-4 w-full">
                                            <div>
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Display Name</label>
                                                <Input
                                                    value={displayName}
                                                    onChange={(e) => setDisplayName(e.target.value)}
                                                    placeholder="Enter your name"
                                                    className="bg-slate-950 border-slate-800 focus:border-purple-500/50 h-11"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Username</label>
                                                <Input
                                                    value={user?.username}
                                                    disabled
                                                    className="bg-slate-950 border-slate-800 text-slate-500 h-11 cursor-not-allowed"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Bio</label>
                                        <textarea
                                            value={bio}
                                            onChange={(e) => setBio(e.target.value)}
                                            placeholder="Tell us a little about yourself..."
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm focus:outline-none focus:border-purple-500/50 min-h-[100px] transition-colors"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Avatar URL</label>
                                        <Input
                                            value={profilePicUrl}
                                            onChange={(e) => setProfilePicUrl(e.target.value)}
                                            placeholder="https://example.com/avatar.png"
                                            className="bg-slate-950 border-slate-800 focus:border-purple-500/50 h-11 text-xs"
                                        />
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={saving}
                                        className="w-full sm:w-auto bg-white text-slate-950 hover:bg-slate-200 gap-2 font-bold px-8 h-12"
                                    >
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        Save Profile
                                    </Button>
                                </form>
                            </section>

                            <section className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-3xl p-8 shadow-xl">
                                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                    <ShieldCheck className="w-5 h-5 text-cyan-400" />
                                    Security & Privacy
                                </h3>

                                <form onSubmit={handleChangePassword} className="space-y-4">
                                    <div className="relative">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Current Password</label>
                                        <Input
                                            type={showPasswords ? "text" : "password"}
                                            value={oldPassword}
                                            onChange={(e) => setOldPassword(e.target.value)}
                                            required
                                            className="bg-slate-950 border-slate-800 focus:border-cyan-500/50 h-11 pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswords(!showPasswords)}
                                            className="absolute right-3 top-8 text-slate-600 hover:text-slate-400"
                                        >
                                            {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">New Password</label>
                                            <Input
                                                type={showPasswords ? "text" : "password"}
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                required
                                                className="bg-slate-950 border-slate-800 focus:border-cyan-500/50 h-11"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Confirm Password</label>
                                            <Input
                                                type={showPasswords ? "text" : "password"}
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                required
                                                className="bg-slate-950 border-slate-800 focus:border-cyan-500/50 h-11"
                                            />
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={saving}
                                        variant="outline"
                                        className="w-full sm:w-auto border-slate-700 hover:bg-slate-800 text-white font-bold h-12 px-8"
                                    >
                                        Update Password
                                    </Button>
                                </form>
                            </section>
                        </div>

                        {/* Stats Sidebar */}
                        <div className="space-y-6">
                            <aside className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
                                <div className="p-6 bg-gradient-to-br from-purple-500/10 to-transparent border-b border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center">
                                            <Mail className="w-6 h-6 text-purple-400" />
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Linked Email</p>
                                            <p className="text-sm font-bold text-white truncate">{user?.email}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6 space-y-6">
                                    <div className="flex justify-between items-center text-sm font-medium">
                                        <div className="flex items-center gap-3 text-slate-400">
                                            <Calendar className="w-4 h-4" />
                                            <span>Member Since</span>
                                        </div>
                                        <span className="text-white">
                                            {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm font-medium">
                                        <div className="flex items-center gap-3 text-slate-400">
                                            <ShieldCheck className="w-4 h-4" />
                                            <span>Account Status</span>
                                        </div>
                                        <span className="text-emerald-400 px-2 py-0.5 bg-emerald-400/10 border border-emerald-400/20 rounded-full text-[10px] uppercase font-bold tracking-wider">
                                            Active
                                        </span>
                                    </div>
                                </div>
                            </aside>

                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
