"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Users,
    Wind,
    Video as VideoIcon,
    Upload,
    Check,
    Plus,
    Trash2,
    Sparkles,
    Music,
    Mic2,
    Play,
    History
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { withSubscription } from "@/components/withAuth";

// Define the Modules
const MODULES = [
    { id: "portrait", name: "Portrait Studio", icon: Users, desc: "Create Hanfu Portraits" },
    { id: "atmosphere", name: "Space Studio", icon: Wind, desc: "Design Environments" },
    { id: "motion", name: "Motion Studio", icon: VideoIcon, desc: "Generate Videos" },
];

const STYLES = [
    { id: "tang", name: "Tang Dynasty (唐)", desc: "Flamboyant & Wide-sleeved" },
    { id: "song", name: "Song Dynasty (宋)", desc: "Refined & Minimalist" },
    { id: "ming", name: "Ming Dynasty (明)", desc: "Dignified & Structured" },
];

const PRESET_SCENES = [
    { id: "lantern-wall", name: "Lantern Wall", preview: "🏮" },
    { id: "snowy-plum", name: "Snowy Plum", preview: "❄️" },
    { id: "family-room", name: "Heritage Hall", preview: "🏛️" },
];

function MagicStudio() {
    const [activeModule, setActiveModule] = useState("portrait");

    // Portrait State
    const [portraits, setPortraits] = useState<{ image: string; styleId: string }[]>([]);
    const [generatedPortrait, setGeneratedPortrait] = useState<string | null>(null);
    const [isPortraitGenerating, setIsPortraitGenerating] = useState(false);
    const portraitInputRef = useRef<HTMLInputElement>(null);

    // Atmosphere State
    const [bgType, setBgType] = useState<'preset' | 'custom'>('preset');
    const [selectedScene, setSelectedScene] = useState(PRESET_SCENES[0].id);
    const [customBg, setCustomBg] = useState<string | null>(null);
    const [generatedAtmosphere, setGeneratedAtmosphere] = useState<string | null>(null);
    const [isAtmosphereGenerating, setIsAtmosphereGenerating] = useState(false);
    const bgInputRef = useRef<HTMLInputElement>(null);

    // Motion State
    const [videoSourceImage, setVideoSourceImage] = useState<string | null>(null);
    const [finalVideo, setFinalVideo] = useState<string | null>(null);
    const [isSynthesizing, setIsSynthesizing] = useState(false);
    const [videoProgress, setVideoProgress] = useState(0);
    const videoInputRef = useRef<HTMLInputElement>(null);


    // --- Portrait Logic ---
    const handlePortraitUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (f) => {
                setPortraits(prev => [...prev, { image: f.target?.result as string, styleId: STYLES[0].id }]);
            };
            reader.readAsDataURL(file);
        });
    };

    const updatePortraitStyle = (index: number, styleId: string) => {
        setPortraits(prev => prev.map((p, i) => i === index ? { ...p, styleId } : p));
    };

    const generatePortrait = async () => {
        if (portraits.length === 0) return;
        setIsPortraitGenerating(true);
        // Reuse the magic image API but focusing on character generation
        try {
            const response = await fetch("/api/generate/magic/image", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    characters: portraits,
                    backgroundType: 'preset',
                    backgroundDesc: "Simple Studio Background",
                    elements: "traditional hanfu elements",
                    customBg: null
                }),
            });
            if (!response.ok) throw new Error("Failed");
            const data = await response.json();
            setGeneratedPortrait(data.imageUrl);
            setVideoSourceImage(data.imageUrl); // Optional: Auto-forward to video
        } catch (e) {
            console.error(e);
        } finally {
            setIsPortraitGenerating(false);
        }
    };

    // --- Atmosphere Logic ---
    const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (f) => setCustomBg(f.target?.result as string);
            reader.readAsDataURL(file);
        }
    };

    const generateAtmosphere = async () => {
        setIsAtmosphereGenerating(true);
        setGeneratedAtmosphere(null);
        try {
            const response = await fetch("/api/generate/magic/image", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    characters: [], // No characters for scene generation
                    backgroundType: bgType,
                    backgroundDesc: bgType === 'preset' ? PRESET_SCENES.find(s => s.id === selectedScene)?.name : "Uploaded Architecture",
                    elements: "traditional decorations, festive atmosphere, cinematic lighting, ultra-realistic, 8k",
                    customBg: bgType === 'custom' ? customBg : null
                }),
            });
            if (!response.ok) throw new Error("Failed");
            const data = await response.json();
            setGeneratedAtmosphere(data.imageUrl);
        } catch (e) {
            console.error(e);
        } finally {
            setIsAtmosphereGenerating(false);
        }
    };

    // --- Motion Logic ---
    const handleVideoSourceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (f) => {
                setVideoSourceImage(f.target?.result as string);
                setFinalVideo(null); // Reset previous video
            };
            reader.readAsDataURL(file);
        }
    };

    const synthesizeVideo = async () => {
        if (!videoSourceImage) return;
        setIsSynthesizing(true);
        setVideoProgress(5);
        const interval = setInterval(() => {
            setVideoProgress(prev => prev < 90 ? prev + Math.random() * 2 : prev);
        }, 1000);

        try {
            const response = await fetch("/api/generate/video", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    image: videoSourceImage,
                    scene: "Festive Celebration",
                    voice: "Gentle Scholarly",
                    music: "Lunar New Year Strings",
                    isMagic: true
                }),
            });

            if (!response.ok) throw new Error("Synthesis failed");
            const data = await response.json();
            setFinalVideo(data.videoUrl);
            setVideoProgress(100);
        } catch (err) {
            console.error(err);
        } finally {
            clearInterval(interval);
            setIsSynthesizing(false);
        }
    };


    const renderModuleContent = () => {
        switch (activeModule) {
            case "portrait":
                return (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div className="text-center">
                            <h3 className="text-2xl font-bold text-shimmer mb-2">Portrait Studio</h3>
                            <p className="text-cny-ivory/40 text-sm">Upload photos to transform into Hanfu style.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Input Area */}
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    {portraits.map((p, idx) => (
                                        <div key={idx} className="relative group">
                                            <img src={p.image} className="aspect-square rounded-xl object-cover border border-white/10" />
                                            <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/60 backdrop-blur-sm">
                                                <select
                                                    value={p.styleId}
                                                    onChange={(e) => updatePortraitStyle(idx, e.target.value)}
                                                    className="w-full bg-transparent text-[10px] uppercase font-bold text-cny-gold outline-none"
                                                >
                                                    {STYLES.map(s => <option key={s.id} value={s.id} className="bg-black">{s.name}</option>)}
                                                </select>
                                            </div>
                                            <button onClick={() => setPortraits(prev => prev.filter((_, i) => i !== idx))} className="absolute top-1 right-1 p-1 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3 h-3 text-white" /></button>
                                        </div>
                                    ))}
                                    {portraits.length < 5 && (
                                        <button onClick={() => portraitInputRef.current?.click()} className="aspect-square rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-2 hover:bg-white/5 transition-colors">
                                            <Plus className="w-6 h-6 text-cny-gold" />
                                            <span className="text-xs uppercase font-bold text-cny-ivory/40">Add Person</span>
                                        </button>
                                    )}
                                </div>
                                <input type="file" ref={portraitInputRef} onChange={handlePortraitUpload} multiple className="hidden" accept="image/*" />

                                <button
                                    onClick={generatePortrait}
                                    disabled={portraits.length === 0 || isPortraitGenerating}
                                    className="w-full py-4 bg-cny-gold text-black font-bold rounded-xl hover:bg-cny-gold-light transition-colors disabled:opacity-50"
                                >
                                    {isPortraitGenerating ? "Generating..." : "Generate Portrait"}
                                </button>
                            </div>

                            {/* Output Area */}
                            <div className="aspect-[4/5] bg-neutral-900 rounded-2xl overflow-hidden border border-white/5 flex items-center justify-center relative">
                                {generatedPortrait ? (
                                    <img src={generatedPortrait} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="text-center opacity-20">
                                        <Users className="w-12 h-12 mx-auto mb-2" />
                                        <p className="text-sm font-bold uppercase">Result will appear here</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );

            case "atmosphere":
                return (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div className="text-center">
                            <h3 className="text-2xl font-bold text-shimmer mb-2">Space Studio</h3>
                            <p className="text-cny-ivory/40 text-sm">Design festive interiors or choose scenarios.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div className="flex bg-white/5 p-1 rounded-xl">
                                    <button onClick={() => setBgType('preset')} className={`flex-1 py-2 rounded-lg text-xs font-bold ${bgType === 'preset' ? 'bg-cny-gold text-black' : 'text-white/40'}`}>Presets</button>
                                    <button onClick={() => setBgType('custom')} className={`flex-1 py-2 rounded-lg text-xs font-bold ${bgType === 'custom' ? 'bg-cny-gold text-black' : 'text-white/40'}`}>Upload</button>
                                </div>

                                {bgType === 'preset' ? (
                                    <div className="grid grid-cols-2 gap-3">
                                        {PRESET_SCENES.map(s => (
                                            <button
                                                key={s.id}
                                                onClick={() => setSelectedScene(s.id)}
                                                className={`p-4 border rounded-xl text-left transition-all ${selectedScene === s.id ? 'border-cny-gold bg-cny-gold/10' : 'border-white/5'}`}
                                            >
                                                <div className="text-2xl mb-1">{s.preview}</div>
                                                <div className="text-xs font-bold">{s.name}</div>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div onClick={() => bgInputRef.current?.click()} className="aspect-video border-2 border-dashed border-white/10 rounded-xl flex items-center justify-center hover:bg-white/5 cursor-pointer overflow-hidden">
                                        {customBg ? <img src={customBg} className="w-full h-full object-cover" /> : <div className="text-center"><Upload className="w-8 h-8 mx-auto mb-2 opacity-50" /><span className="text-xs uppercase font-bold opacity-50">Upload Room</span></div>}
                                    </div>
                                )}
                                <input type="file" ref={bgInputRef} onChange={handleBgUpload} className="hidden" accept="image/*" />
                            </div>

                            <div className="aspect-video bg-neutral-900 rounded-2xl border border-white/5 flex items-center justify-center">
                                {/* Placeholder for Atmosphere result */}
                                <p className="text-xs uppercase font-bold opacity-20">Atmosphere Preview</p>
                            </div>
                        </div>
                    </div>
                );

            case "motion":
                return (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div className="text-center">
                            <h3 className="text-2xl font-bold text-shimmer mb-2">Motion Studio</h3>
                            <p className="text-cny-ivory/40 text-sm">Animate any photo into a greeting.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div
                                    onClick={() => videoInputRef.current?.click()}
                                    className="aspect-[4/5] bg-white/5 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-cny-gold/50 transition-all relative overflow-hidden group"
                                >
                                    {videoSourceImage ? (
                                        <>
                                            <img src={videoSourceImage} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="font-bold text-white">Change Image</span>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-12 h-12 text-cny-gold mb-4" />
                                            <p className="font-bold text-shimmer">Upload Photo</p>
                                            <p className="text-xs text-white/40 mt-2">or drag and drop</p>
                                        </>
                                    )}
                                </div>
                                <input type="file" ref={videoInputRef} onChange={handleVideoSourceUpload} className="hidden" accept="image/*" />

                                <div className="space-y-4">
                                    <div className="p-4 rounded-xl bg-white/5 flex items-center gap-4">
                                        <div className="w-10 h-10 bg-cny-gold rounded-full flex items-center justify-center text-black">
                                            <Mic2 className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold">Gentle Scholarly</p>
                                            <p className="text-[10px] text-white/40 uppercase">Mandarin Voice</p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={synthesizeVideo}
                                        disabled={!videoSourceImage || isSynthesizing}
                                        className="w-full py-4 bg-gradient-to-r from-cny-red to-cny-red-dark font-bold rounded-xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale"
                                    >
                                        {isSynthesizing ? "Synthesizing..." : "Generate Video"}
                                    </button>
                                </div>
                            </div>

                            <div className="aspect-[4/5] bg-black rounded-3xl overflow-hidden border border-white/10 relative">
                                <AnimatePresence mode="wait">
                                    {isSynthesizing ? (
                                        <motion.div
                                            key="loading"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="absolute inset-0 flex flex-col items-center justify-center bg-black/80"
                                        >
                                            <p className="text-2xl font-bold text-shimmer mb-2">{Math.floor(videoProgress)}%</p>
                                            <p className="text-[10px] uppercase tracking-widest text-cny-gold">Rendering Motion</p>
                                        </motion.div>
                                    ) : finalVideo ? (
                                        <motion.div
                                            key="video"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="w-full h-full relative"
                                        >
                                            <video src={finalVideo} controls autoPlay loop className="w-full h-full object-cover" />
                                        </motion.div>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center opacity-20">
                                            <VideoIcon className="w-16 h-16" />
                                        </div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                );
        }
    };

    return (
        <main className="min-h-screen pt-24 px-6 pb-24 bg-black overflow-hidden relative">
            <Navbar />

            {/* Background Aesthetic */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 -right-1/4 w-[800px] h-[800px] bg-cny-red/5 blur-[160px] rounded-full" />
                <div className="absolute -bottom-1/4 -left-1/4 w-[800px] h-[800px] bg-cny-gold/5 blur-[160px] rounded-full" />
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="flex flex-col lg:flex-row gap-8">

                    {/* Sidebar / Tools Switcher */}
                    <div className="lg:w-64 shrink-0">
                        <div className="glass-card p-2 sticky top-32 space-y-1">
                            {MODULES.map(m => {
                                const Icon = m.icon;
                                const isActive = activeModule === m.id;
                                return (
                                    <button
                                        key={m.id}
                                        onClick={() => setActiveModule(m.id)}
                                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${isActive ? 'bg-white/10 text-white shadow-lg' : 'text-white/40 hover:bg-white/5 hover:text-white/80'}`}
                                    >
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isActive ? 'bg-cny-gold text-black' : 'bg-white/5'}`}>
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-bold text-sm">{m.name}</p>
                                            <p className="text-[10px] opacity-60 uppercase">{m.desc}</p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Main Workspace */}
                    <div className="flex-1">
                        <div className="glass-card min-h-[600px] p-8">
                            {renderModuleContent()}
                        </div>
                    </div>

                </div>
            </div>
        </main>
    );
}

// 使用订阅守卫保护此页面
export default withSubscription(MagicStudio);
