"use client";

import { useState, useRef, useEffect } from "react";
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
import SubscriptionGuard from "@/components/SubscriptionGuard";

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
    const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

    // 页面加载时检查是否有进行中的任务
    useEffect(() => {
        checkCurrentTask();

        // 组件卸载时清除轮询
        return () => {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
            }
        };
    }, []);

    const checkCurrentTask = async () => {
        try {
            const res = await fetch('/api/queue/current-task');
            const data = await res.json();

            if (data.taskId && data.status && data.status !== 'completed' && data.status !== 'failed') {
                // 有进行中的任务，恢复 UI 状态
                console.log('[Magic Studio] Resuming task:', data.taskId);

                // 从 metadata 恢复 payload
                if (data.metadata?.payload) {
                    const { characters } = data.metadata.payload;
                    if (characters && Array.isArray(characters)) {
                        // 恢复上传的图片
                        setPortraits(characters);
                        console.log('[Magic Studio] Restored', characters.length, 'portraits from metadata');
                    }
                }

                setIsPortraitGenerating(true);
                startPolling();
            }
        } catch (error) {
            console.error('[Magic Studio] Failed to check current task:', error);
        }
    };

    const startPolling = () => {
        // 清除之前的轮询
        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
        }

        pollIntervalRef.current = setInterval(async () => {
            try {
                const res = await fetch('/api/queue/current-task');
                const data = await res.json();

                if (!data.taskId || !data.status) {
                    // 没有任务或任务已清除
                    if (pollIntervalRef.current) {
                        clearInterval(pollIntervalRef.current);
                        pollIntervalRef.current = null;
                    }
                    setIsPortraitGenerating(false);
                    return;
                }

                console.log('[Magic Studio] Task status:', data.status);

                if (data.status === 'completed') {
                    if (pollIntervalRef.current) {
                        clearInterval(pollIntervalRef.current);
                        pollIntervalRef.current = null;
                    }
                    setIsPortraitGenerating(false);

                    if (data.result?.imageUrl) {
                        setGeneratedPortrait(data.result.imageUrl);
                        setVideoSourceImage(data.result.imageUrl);
                    }
                } else if (data.status === 'failed') {
                    if (pollIntervalRef.current) {
                        clearInterval(pollIntervalRef.current);
                        pollIntervalRef.current = null;
                    }
                    setIsPortraitGenerating(false);
                    alert('生成失败: ' + (data.error || '未知错误'));
                }
                // pending 或 processing 状态继续轮询
            } catch (error) {
                console.error('[Magic Studio] Polling error:', error);
            }
        }, 3000); // 每3秒轮询一次
    };


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
        setGeneratedPortrait(null); // 清除之前的结果

        // Reuse the magic image API but focusing on character generation
        try {
            // NextAuth middleware 会自动处理认证
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

            // 开始轮询任务状态
            console.log('[Magic Studio] Task submitted:', data.taskId);
            startPolling();
        } catch (e) {
            console.error(e);
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
            // NextAuth middleware 会自动处理认证
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
        alert("Motion Studio 功能暂未开放，敬请期待。");
    };



    const renderModuleContent = () => {
        switch (activeModule) {
            case "portrait":
                return (
                    <div className="space-y-[32px] animate-in fade-in duration-500">
                        <div className="text-center">
                            <h3 className="text-2xl font-bold text-shimmer mb-[8px]">Portrait Studio</h3>
                            <p className="text-cny-ivory/40 text-sm">Upload photos to transform into Hanfu style.</p>
                        </div>

                        <div className="grid grid-cols-1 tablet:grid-cols-2 gap-[32px]">
                            {/* Input Area */}
                            <div className="space-y-[16px]">
                                <div className="grid grid-cols-2 gap-[16px]">
                                    {portraits.map((p, idx) => (
                                        <div key={idx} className="relative group">
                                            <img src={p.image} className="aspect-square rounded-xl object-cover border border-white/10" />
                                            <div className="absolute bottom-[0px] left-[0px] right-[0px] p-[8px] bg-black/60 backdrop-blur-sm">
                                                <select
                                                    value={p.styleId}
                                                    onChange={(e) => updatePortraitStyle(idx, e.target.value)}
                                                    className="w-full bg-transparent text-[10px] uppercase font-bold text-cny-gold outline-none"
                                                >
                                                    {STYLES.map(s => <option key={s.id} value={s.id} className="bg-black">{s.name}</option>)}
                                                </select>
                                            </div>
                                            <button onClick={() => setPortraits(prev => prev.filter((_, i) => i !== idx))} className="absolute top-[4px] right-[4px] p-[4px] bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-[12px] h-[12px] text-white" /></button>
                                        </div>
                                    ))}
                                    {portraits.length < 5 && (
                                        <button onClick={() => portraitInputRef.current?.click()} className="aspect-square rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-[8px] hover:bg-white/5 transition-colors">
                                            <Plus className="w-[24px] h-[24px] text-cny-gold" />
                                            <span className="text-xs uppercase font-bold text-cny-ivory/40">Add Person</span>
                                        </button>
                                    )}
                                </div>
                                <input type="file" ref={portraitInputRef} onChange={handlePortraitUpload} multiple className="hidden" accept="image/*" />

                                <button
                                    onClick={generatePortrait}
                                    disabled={portraits.length === 0 || isPortraitGenerating}
                                    className="w-full py-[16px] bg-cny-gold text-black font-bold rounded-xl hover:bg-cny-gold-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isPortraitGenerating ? (
                                        <span className="flex items-center justify-center gap-[8px]">
                                            <span className="animate-spin">⏳</span>
                                            生成中...
                                        </span>
                                    ) : generatedPortrait ? "重新生成" : "生成肖像"}
                                </button>
                            </div>

                            {/* Output Area */}
                            <div className="aspect-[4/5] bg-neutral-900 rounded-2xl overflow-hidden border border-white/5 flex items-center justify-center relative">
                                {generatedPortrait ? (
                                    <img src={generatedPortrait} className="w-full h-full object-cover" />
                                ) : isPortraitGenerating ? (
                                    <div className="text-center">
                                        <div className="w-[64px] h-[64px] mx-auto mb-[16px] border-4 border-cny-gold border-t-transparent rounded-full animate-spin" />
                                        <p className="text-sm font-bold text-cny-gold uppercase">正在生成...</p>
                                        <p className="text-xs text-cny-ivory/40 mt-[8px]">预计需要 30-60 秒</p>
                                    </div>
                                ) : (
                                    <div className="text-center opacity-20">
                                        <Users className="w-[48px] h-[48px] mx-auto mb-[8px]" />
                                        <p className="text-sm font-bold uppercase">Result will appear here</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );

            case "atmosphere":
                return (
                    <div className="space-y-[32px] animate-in fade-in duration-500">
                        <div className="text-center">
                            <h3 className="text-2xl font-bold text-shimmer mb-[8px]">Space Studio</h3>
                            <p className="text-cny-ivory/40 text-sm">Design festive interiors or choose scenarios.</p>
                        </div>

                        <div className="grid grid-cols-1 tablet:grid-cols-2 gap-[32px]">
                            <div className="space-y-[24px]">
                                <div className="flex bg-white/5 p-[4px] rounded-xl">
                                    <button onClick={() => setBgType('preset')} className={`flex-1 py-[8px] rounded-lg text-xs font-bold ${bgType === 'preset' ? 'bg-cny-gold text-black' : 'text-white/40'}`}>Presets</button>
                                    <button onClick={() => setBgType('custom')} className={`flex-1 py-[8px] rounded-lg text-xs font-bold ${bgType === 'custom' ? 'bg-cny-gold text-black' : 'text-white/40'}`}>Upload</button>
                                </div>

                                {bgType === 'preset' ? (
                                    <div className="grid grid-cols-2 gap-[12px]">
                                        {PRESET_SCENES.map(s => (
                                            <button
                                                key={s.id}
                                                onClick={() => setSelectedScene(s.id)}
                                                className={`p-[16px] border rounded-xl text-left transition-all ${selectedScene === s.id ? 'border-cny-gold bg-cny-gold/10' : 'border-white/5'}`}
                                            >
                                                <div className="text-2xl mb-[4px]">{s.preview}</div>
                                                <div className="text-xs font-bold">{s.name}</div>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div onClick={() => bgInputRef.current?.click()} className="aspect-video border-2 border-dashed border-white/10 rounded-xl flex items-center justify-center hover:bg-white/5 cursor-pointer overflow-hidden">
                                        {customBg ? <img src={customBg} className="w-full h-full object-cover" /> : <div className="text-center"><Upload className="w-[32px] h-[32px] mx-auto mb-[8px] opacity-50" /><span className="text-xs uppercase font-bold opacity-50">Upload Room</span></div>}
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
                    <div className="space-y-[32px] animate-in fade-in duration-500">
                        <div className="text-center">
                            <h3 className="text-2xl font-bold text-shimmer mb-[8px]">Motion Studio</h3>
                            <p className="text-cny-ivory/40 text-sm">Animate any photo into a greeting.</p>
                        </div>

                        <div className="grid grid-cols-1 tablet:grid-cols-2 gap-[32px]">
                            <div className="space-y-[24px]">
                                <div
                                    onClick={() => videoInputRef.current?.click()}
                                    className="aspect-[4/5] bg-white/5 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-cny-gold/50 transition-all relative overflow-hidden group"
                                >
                                    {videoSourceImage ? (
                                        <>
                                            <img src={videoSourceImage} className="w-full h-full object-cover" />
                                            <div className="absolute inset-[0px] bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="font-bold text-white">Change Image</span>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-[48px] h-[48px] text-cny-gold mb-[16px]" />
                                            <p className="font-bold text-shimmer">Upload Photo</p>
                                            <p className="text-xs text-white/40 mt-[8px]">or drag and drop</p>
                                        </>
                                    )}
                                </div>
                                <input type="file" ref={videoInputRef} onChange={handleVideoSourceUpload} className="hidden" accept="image/*" />

                                <div className="space-y-[16px]">
                                    <div className="p-[16px] rounded-xl bg-white/5 flex items-center gap-[16px]">
                                        <div className="w-[40px] h-[40px] bg-cny-gold rounded-full flex items-center justify-center text-black">
                                            <Mic2 className="w-[20px] h-[20px]" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold">Gentle Scholarly</p>
                                            <p className="text-[10px] text-white/40 uppercase">Mandarin Voice</p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={synthesizeVideo}
                                        disabled={!videoSourceImage || isSynthesizing}
                                        className="w-full py-[16px] bg-gradient-to-r from-cny-red to-cny-red-dark font-bold rounded-xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale"
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
                                            className="absolute inset-[0px] flex flex-col items-center justify-center bg-black/80"
                                        >
                                            <p className="text-2xl font-bold text-shimmer mb-[8px]">{Math.floor(videoProgress)}%</p>
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
                                            <VideoIcon className="w-[64px] h-[64px]" />
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
        <main className="min-h-screen pt-[96px] px-[24px] pb-[96px] bg-black overflow-hidden relative">
            <Navbar />

            {/* Background Aesthetic */}
            <div className="absolute inset-[0px] overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 -right-1/4 w-[800px] h-[800px] bg-cny-red/5 blur-[160px] rounded-full" />
                <div className="absolute -bottom-1/4 -left-1/4 w-[800px] h-[800px] bg-cny-gold/5 blur-[160px] rounded-full" />
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="flex flex-col desktop:flex-row gap-[32px]">

                    {/* Sidebar / Tools Switcher */}
                    <div className="desktop:w-[256px] shrink-0">
                        <div className="glass-card p-[8px] sticky top-[128px] space-y-[4px]">
                            {MODULES.map(m => {
                                const Icon = m.icon;
                                const isActive = activeModule === m.id;
                                return (
                                    <button
                                        key={m.id}
                                        onClick={() => setActiveModule(m.id)}
                                        className={`w-full flex items-center gap-[12px] p-[12px] rounded-xl transition-all ${isActive ? 'bg-white/10 text-white shadow-lg' : 'text-white/40 hover:bg-white/5 hover:text-white/80'}`}
                                    >
                                        <div className={`w-[32px] h-[32px] rounded-lg flex items-center justify-center ${isActive ? 'bg-cny-gold text-black' : 'bg-white/5'}`}>
                                            <Icon className="w-[16px] h-[16px]" />
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
                        <div className="glass-card min-h-[600px] p-[32px]">
                            {renderModuleContent()}
                        </div>
                    </div>

                </div>
            </div>
        </main>
    );
}

// 使用订阅守卫保护此页面
export default function MagicStudioPage() {
    return (
        <SubscriptionGuard>
            <MagicStudio />
        </SubscriptionGuard>
    );
}
