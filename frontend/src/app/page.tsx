'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Brain, ArrowRight, Twitter, Video, FileText, Link2, Sparkles } from 'lucide-react';
import { GatherWatermark } from '@/components/GatherWatermark';

// Dynamic import for Three.js (client-only)
const Brain3D = dynamic(() => import('@/components/Brain3D').then(mod => mod.Brain3D), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500/20 to-cyan-500/20 animate-pulse" />
    </div>
  )
});

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] as const
    }
  })
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3
    }
  }
};

const floatingCard = {
  hidden: { opacity: 0, scale: 0.8, y: 40 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      delay: 0.8,
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1] as const
    }
  }
};

const cardItems = [
  { icon: Twitter, label: 'Tweets', color: 'text-blue-400', count: 32 },
  { icon: Video, label: 'Videos', color: 'text-red-400', count: 18 },
  { icon: FileText, label: 'Docs', color: 'text-emerald-400', count: 45 },
  { icon: Link2, label: 'Links', color: 'text-purple-400', count: 33 },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Gradient orbs */}
        <motion.div
          className="absolute top-20 left-10 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px]"
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-cyan-600/15 rounded-full blur-[120px]"
          animate={{
            x: [0, -30, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[150px]"
          animate={{
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      {/* Navigation */}
      <motion.nav
        className="fixed top-0 w-full z-50 bg-slate-950/80 backdrop-blur-xl border-b border-purple-500/20"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <motion.div
            className="flex items-center gap-3"
            whileHover={{ scale: 1.02 }}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center shadow-lg glow-purple-sm">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Gather</span>
          </motion.div>

          <div className="flex items-center gap-3">
            <Link href="/auth">
              <Button variant="ghost" className="font-medium text-slate-300 hover:text-white hover:bg-slate-800/50">
                Login
              </Button>
            </Link>
            <Link href="/auth">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 shadow-lg glow-purple border-0">
                  Sign Up
                </Button>
              </motion.div>
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative min-h-screen pt-24 flex items-center">
        <div className="max-w-7xl mx-auto px-6 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              className="relative z-10 p-8 rounded-3xl bg-slate-900/40 backdrop-blur-xl border border-white/10 shadow-2xl"
              style={{
                boxShadow: '0 8px 32px 0 rgba(139, 92, 246, 0.1), inset 0 1px 1px 0 rgba(255, 255, 255, 0.05)'
              }}
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              <motion.div
                variants={fadeInUp}
                custom={0}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600/20 backdrop-blur-sm rounded-full border border-purple-500/30 mb-6"
              >
                <Sparkles className="w-4 h-4 text-purple-300" />
                <span className="text-sm font-medium text-purple-200">Your Second Brain</span>
              </motion.div>

              <motion.h1
                variants={fadeInUp}
                custom={1}
                className="text-5xl md:text-7xl font-bold text-white leading-tight mb-6"
              >
                Capture
                <br />
                <span className="gradient-text">
                  Everything.
                </span>
              </motion.h1>

              <motion.p
                variants={fadeInUp}
                custom={2}
                className="text-lg text-slate-300 mb-8 max-w-md leading-relaxed"
              >
                Store tweets, videos, and links in one beautiful space.
                Never forget an idea again.
              </motion.p>
            </motion.div>

            {/* Right - 3D Brain + Floating Card */}
            <div className="relative lg:h-[600px] h-[400px]">
              {/* 3D Brain with Watermark */}
              <div className="absolute inset-0">
                <Brain3D />
                <GatherWatermark />
              </div>

              {/* Floating Preview Card */}
              <motion.div
                variants={floatingCard}
                initial="hidden"
                animate="visible"
                className="absolute bottom-10 right-0 lg:right-10"
              >
                <motion.div
                  className="bg-slate-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-purple-500/30 p-6 w-72 glow-purple-sm"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <div className="flex items-center gap-3 mb-4 pb-4 border-b border-purple-500/20">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
                      <Brain className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">Your Brain</p>
                      <p className="text-xs text-slate-500">128 items saved</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {cardItems.map((item, index) => {
                      const Icon = item.icon;
                      return (
                        <motion.div
                          key={item.label}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/50 transition-colors cursor-pointer"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 1 + index * 0.1 }}
                        >
                          <Icon className={`w-4 h-4 ${item.color}`} />
                          <span className="text-sm text-slate-300">{item.label}</span>
                          <span className="ml-auto text-xs text-slate-500">
                            {item.count}
                          </span>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Minimal Footer */}
      <motion.footer
        className="absolute bottom-0 w-full py-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <p className="text-sm text-slate-600">© Gather</p>
          <div className="flex gap-6">
            <a href="#" className="text-sm text-slate-600 hover:text-slate-400 transition-colors">
              Privacy
            </a>
            <a href="#" className="text-sm text-slate-600 hover:text-slate-400 transition-colors">
              Terms
            </a>
          </div>
        </div>
      </motion.footer>
    </div>
  );
}
