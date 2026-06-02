"use client";

import { motion } from "framer-motion";
import { ArrowRight, Wand2 } from "lucide-react";
import Link from "next/link";

export default function Hero() {
    return (
        <section className="pt-[128px] pb-[80px] px-[24px] overflow-hidden">
            <div className="max-w-7xl mx-auto flex flex-col desktop:flex-row items-center gap-[64px]">
                <div className="flex-1 text-center desktop:text-left">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h2 className="text-cny-gold font-bold tracking-widest uppercase text-sm mb-[16px]">
                            Bridge Across Chinese Culture
                        </h2>
                        <h1 className="text-5xl desktop:text-7xl font-bold leading-tight mb-[32px]">
                            Generate Lunar New Year Images From Templates
                        </h1>
                        <p className="text-cny-ivory/60 text-lg mb-[40px] max-w-2xl mx-auto desktop:mx-[0px]">
                            Pick a template, upload your references, and generate a personalized Lunar New Year image.
                        </p>
                        <div className="flex flex-wrap items-center justify-center desktop:justify-start gap-[16px]">
                            <Link href="/generate" className="cny-button-primary flex items-center gap-[8px]">
                                Start Transformation <ArrowRight className="w-[20px] h-[20px]" />
                            </Link>
                            <button className="cny-button-outline">
                                How it Works
                            </button>
                        </div>
                    </motion.div>
                </div>

                <div className="flex-1 relative">
                    {/* Decorative Elements */}
                    <div className="absolute top-[-80px] left-[-80px] w-[160px] h-[160px] text-cny-gold/10 pointer-events-none">
                        <svg viewBox="0 0 100 100" className="w-full h-full">
                            <path d="M10,40 Q30,10 50,40 T90,40" fill="none" stroke="currentColor" strokeWidth="1" />
                            <path d="M10,60 Q30,30 50,60 T90,60" fill="none" stroke="currentColor" strokeWidth="1" />
                        </svg>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="glass-card p-[16px] relative z-10"
                    >
                        <div className="relative rounded-xl overflow-hidden aspect-[4/5] bg-neutral-900 group">
                            <img
                                src="/hero-model.png"
                                alt="Blonde Model in Hanfu Preview"
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            <div className="absolute inset-[0px] bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-[32px] text-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                <Wand2 className="w-[48px] h-[48px] text-cny-gold mx-auto mb-[16px] animate-pulse" />
                                <p className="text-cny-gold font-bold italic text-xl">Western Elegance & Hanfu Tradition</p>
                                <p className="text-white/60 text-sm mt-[8px]">AI-Generated Template Preview</p>
                            </div>
                        </div>

                        {/* Floating UI elements for glassmorphism effect */}
                        <div className="absolute top-[-24px] right-[-24px] glass-card px-[16px] py-[12px] animate-bounce shadow-2xl">
                            <span className="text-cny-gold font-bold text-sm">✨ 98% Reality Match</span>
                        </div>
                        <div className="absolute bottom-[-24px] left-[-24px] glass-card px-[16px] py-[12px] animate-pulse shadow-2xl">
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
