"use client";

import { motion } from "framer-motion";
import { ArrowRight, Wand2 } from "lucide-react";
import Link from "next/link";

export default function Hero() {
    return (
        <section className="pt-32 pb-20 px-6 overflow-hidden">
            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
                <div className="flex-1 text-center lg:text-left">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h2 className="text-cny-gold font-bold tracking-widest uppercase text-sm mb-4">
                            Bridge Across Chinese Culture
                        </h2>
                        <h1 className="text-5xl lg:text-7xl font-bold leading-tight mb-8">
                            Experience the <span className="text-shimmer italic">Magic</span> of Chinese New Year
                        </h1>
                        <p className="text-cny-ivory/60 text-lg mb-10 max-w-2xl mx-auto lg:mx-0">
                            Transform your photos into traditional Hanfu masterpieces and create personalized
                            Lunar New Year greetings with our state-of-the-art AI.
                        </p>
                        <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
                            <Link href="/studio/hanfu" className="cny-button-primary flex items-center gap-2">
                                Start Transformation <ArrowRight className="w-5 h-5" />
                            </Link>
                            <button className="cny-button-outline">
                                How it Works
                            </button>
                        </div>
                    </motion.div>
                </div>

                <div className="flex-1 relative">
                    {/* Decorative Elements */}
                    <div className="absolute -top-20 -left-20 w-40 h-40 text-cny-gold/10 pointer-events-none">
                        <svg viewBox="0 0 100 100" className="w-full h-full">
                            <path d="M10,40 Q30,10 50,40 T90,40" fill="none" stroke="currentColor" strokeWidth="1" />
                            <path d="M10,60 Q30,30 50,60 T90,60" fill="none" stroke="currentColor" strokeWidth="1" />
                        </svg>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="glass-card p-4 relative z-10"
                    >
                        <div className="relative rounded-xl overflow-hidden aspect-[4/5] bg-neutral-900 group">
                            <img
                                src="/hero-model.png"
                                alt="Blonde Model in Hanfu Preview"
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                <Wand2 className="w-12 h-12 text-cny-gold mx-auto mb-4 animate-pulse" />
                                <p className="text-cny-gold font-bold italic text-xl">Western Elegance & Hanfu Tradition</p>
                                <p className="text-white/60 text-sm mt-2">AI-Generated Portrait (Preview)</p>
                            </div>
                        </div>

                        {/* Floating UI elements for glassmorphism effect */}
                        <div className="absolute -top-6 -right-6 glass-card px-4 py-3 animate-bounce shadow-2xl">
                            <span className="text-cny-gold font-bold text-sm">✨ 98% Reality Match</span>
                        </div>
                        <div className="absolute -bottom-6 -left-6 glass-card px-4 py-3 animate-pulse shadow-2xl">
                            <span className="text-cny-gold font-bold text-sm">👘 Tang Dynasty Style</span>
                        </div>
                    </motion.div>

                    {/* Decorative glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-cny-red/20 blur-[120px] rounded-full -z-10" />
                </div>
            </div>
        </section>
    );
}
