"use client";

import { motion } from "framer-motion";
import { Sparkles, Users, Wind, ImageIcon, VideoIcon, ArrowRight } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function Home() {
    return (
        <main className="min-h-screen bg-black text-white overflow-hidden relative">
            <Navbar />

            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 -right-1/4 w-[800px] h-[800px] bg-cny-red/10 blur-[160px] rounded-full" />
                <div className="absolute -bottom-1/4 -left-1/4 w-[800px] h-[800px] bg-cny-gold/10 blur-[160px] rounded-full" />
            </div>

            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center justify-center px-6 pt-24">
                <div className="max-w-5xl mx-auto text-center space-y-8">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="space-y-4"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cny-gold/10 border border-cny-gold/20 mb-6">
                            <Sparkles className="w-4 h-4 text-cny-gold" />
                            <span className="text-xs font-bold uppercase tracking-widest text-cny-gold">AI-Powered Lunar New Year</span>
                        </div>
                        <h1 className="text-6xl md:text-8xl font-bold text-shimmer tracking-tighter leading-none">
                            Create Your<br />Lunar New Year<br />Magic
                        </h1>
                        <p className="text-xl md:text-2xl text-cny-ivory/60 max-w-3xl mx-auto leading-relaxed">
                            Transform your family photos into stunning traditional Chinese New Year greetings with AI-powered Hanfu styling, festive backgrounds, and cinematic motion.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        <Link
                            href="/studio/magic"
                            className="inline-flex items-center gap-3 px-8 py-5 bg-gradient-to-r from-cny-red to-cny-red-dark rounded-2xl font-bold text-lg shadow-[0_0_40px_rgba(238,45,47,0.4)] hover:scale-105 active:scale-95 transition-all group"
                        >
                            <Sparkles className="w-6 h-6" />
                            Start Creating
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </motion.div>

                    {/* Stats */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="grid grid-cols-3 gap-8 max-w-2xl mx-auto pt-12"
                    >
                        <div className="space-y-1">
                            <p className="text-3xl font-bold text-cny-gold">4</p>
                            <p className="text-xs text-cny-ivory/40 uppercase tracking-widest">Simple Steps</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-3xl font-bold text-cny-gold">5</p>
                            <p className="text-xs text-cny-ivory/40 uppercase tracking-widest">People Max</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-3xl font-bold text-cny-gold">100%</p>
                            <p className="text-xs text-cny-ivory/40 uppercase tracking-widest">AI Magic</p>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Features Timeline */}
            <section className="relative py-32 px-6">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-20"
                    >
                        <h2 className="text-4xl md:text-5xl font-bold text-shimmer mb-4">How It Works</h2>
                        <p className="text-cny-ivory/60 text-lg">Four simple steps to create your masterpiece</p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            {
                                step: "01",
                                icon: Users,
                                title: "Characters",
                                desc: "Upload up to 5 portraits and choose individual Hanfu styles for each person"
                            },
                            {
                                step: "02",
                                icon: Wind,
                                title: "Atmosphere",
                                desc: "Select a festive scene or upload your own architectural photo"
                            },
                            {
                                step: "03",
                                icon: ImageIcon,
                                title: "Drafting",
                                desc: "AI blends your family into a photorealistic Chinese New Year scene"
                            },
                            {
                                step: "04",
                                icon: VideoIcon,
                                title: "Cinematics",
                                desc: "Add motion, voice, and traditional music for the final greeting"
                            }
                        ].map((feature, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                                className="glass-card p-8 space-y-4 hover:border-cny-gold/30 transition-all group"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="w-14 h-14 rounded-xl bg-cny-gold/10 flex items-center justify-center group-hover:bg-cny-gold/20 transition-colors">
                                        <feature.icon className="w-7 h-7 text-cny-gold" />
                                    </div>
                                    <span className="text-5xl font-bold text-white/5 group-hover:text-white/10 transition-colors">{feature.step}</span>
                                </div>
                                <h3 className="text-xl font-bold text-cny-ivory">{feature.title}</h3>
                                <p className="text-sm text-cny-ivory/60 leading-relaxed">{feature.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="relative py-32 px-6">
                <div className="max-w-4xl mx-auto text-center space-y-8">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="glass-card p-12 space-y-6"
                    >
                        <Sparkles className="w-16 h-16 text-cny-gold mx-auto" />
                        <h2 className="text-4xl md:text-5xl font-bold text-shimmer">Ready to Create?</h2>
                        <p className="text-cny-ivory/60 text-lg max-w-2xl mx-auto">
                            Start your journey to create a stunning, personalized Lunar New Year greeting that your family will treasure forever.
                        </p>
                        <Link
                            href="/studio/magic"
                            className="inline-flex items-center gap-3 px-8 py-5 bg-gradient-to-r from-cny-red to-cny-red-dark rounded-2xl font-bold text-lg shadow-[0_0_40px_rgba(238,45,47,0.4)] hover:scale-105 active:scale-95 transition-all group"
                        >
                            Launch Magic Studio
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative py-12 px-6 border-t border-white/5">
                <div className="max-w-6xl mx-auto text-center">
                    <p className="text-cny-ivory/40 text-sm">
                        © 2026 新年快乐 · Powered by AI Magic
                    </p>
                </div>
            </footer>
        </main>
    );
}
