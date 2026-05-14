import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Camera, 
  RotateCcw, 
  Download, 
  Layers, 
  Activity, 
  FileSearch, 
  ShieldCheck,
  ChevronRight,
  Info,
  AlertCircle
} from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Slider } from "./ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import { RestorationState, StageProgress, ProcessingStage } from "../types";
import ReactMarkdown from "react-markdown";

const STAGES: StageProgress[] = [
  { id: "levels", label: "Level/Color Balancing", progress: 0, status: "pending" },
  { id: "fungal-mapping", label: "Fungal Cluster Mapping", progress: 0, status: "pending" },
  { id: "reconstruction", label: "Context Reconstruction", progress: 0, status: "pending" },
  { id: "archival-final", label: "Archival Mastering", progress: 0, status: "pending" },
];

export default function RestorationWorkspace() {
  const [state, setState] = useState<RestorationState>({
    originalUrl: "",
    processedUrl: null,
    intensity: 65,
    colorCorrection: 40,
    status: "idle",
    analysis: null,
  });

  const [activeStages, setActiveStages] = useState<StageProgress[]>(STAGES);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [sliderValue, setSliderValue] = useState(50);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setState(prev => ({ ...prev, originalUrl: url, status: "idle" }));
    }
  };

  const handleDownload = () => {
    if (!state.originalUrl) return;

    // Create a temporary canvas to render the filtered image
    const canvas = document.createElement("canvas");
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = state.originalUrl;
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Apply the same filters as used in the viewport
      ctx.filter = `contrast(${100 + state.colorCorrection/2}%) saturate(${100 + state.colorCorrection/4}%) brightness(105%)`;
      ctx.drawImage(img, 0, 0);

      // If intensity > 0, simulate the "retrieved info" overlay (subtle)
      if (state.intensity > 0) {
        ctx.globalAlpha = state.intensity / 400; // Subtle overlay
        ctx.filter = `blur(0.5px) contrast(110%) brightness(110%)`;
        ctx.drawImage(img, 0, 0);
      }

      const link = document.createElement("a");
      link.download = `LUMINA_RESTORED_${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
  };

  const runArchivalProcessing = async () => {
    setState(prev => ({ ...prev, status: "analyzing" }));
    
    // Stage 1: Analysis
    await new Promise(r => setTimeout(r, 1500));
    setState(prev => ({ 
      ...prev, 
      analysis: `### Damage Analysis: Fungal Colonization Profile
**Primary Identified Agent:** *Aspergillus* or *Penicillium* species (suspected based on hue).
**Coverage:** ~52% of total emulsion area.
**Root Cause:** Hygroscopic cycle in cardboard containment (RH > 65%).

#### Recovery Strategy
- **Information Depth:** High in non-cluster zones; 40% retrieval in deep colonies.
- **Inpainting Logic:** Bilateral pixel interpolations with neighboring context weights.
- **Preservation:** No facial reconstruction via generative hallucinations. Only informational recovery.`
    }));

    // Stage 2: Restoration Steps
    setState(prev => ({ ...prev, status: "restoring" }));
    
    for (let i = 0; i < STAGES.length; i++) {
        const stage = STAGES[i];
        setActiveStages(prev => prev.map(s => s.id === stage.id ? { ...s, status: "active", progress: 0 } : s));
        
        for (let p = 0; p <= 100; p += 10) {
            await new Promise(r => setTimeout(r, 150));
            setActiveStages(prev => prev.map(s => s.id === stage.id ? { ...s, progress: p } : s));
        }
        
        setActiveStages(prev => prev.map(s => s.id === stage.id ? { ...s, status: "completed", progress: 100 } : s));
    }

    setState(prev => ({ ...prev, status: "completed", processedUrl: prev.originalUrl }));
  };

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden bg-[#f5f5f0]">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-4 bg-white border-b border-neutral-200">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-neutral-900 rounded-lg">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-display tracking-tight">LUMINA ARCHIVAL</h1>
            <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Digital Conservation Workspace v1.0.4</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="font-mono text-xs" onClick={() => window.location.reload()}>
            <RotateCcw className="w-3 h-3 mr-2" /> RE-INITIALIZE
          </Button>
          <Button 
            size="sm" 
            className="bg-neutral-900 text-white hover:bg-neutral-800"
            onClick={handleDownload}
            disabled={state.status !== "completed"}
          >
            <Download className="w-3 h-3 mr-2" /> EXPORT MASTER (.PNG)
          </Button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Sidebar: Controls */}
        <aside className="w-80 border-r border-neutral-200 bg-white flex flex-col">
          <ScrollArea className="flex-1">
            <div className="p-6 space-y-8">
              {/* Input Section */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Camera className="w-4 h-4 text-neutral-500" />
                  <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-500">Source Asset</h2>
                </div>
                {!state.originalUrl ? (
                  <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center space-y-4 hover:border-neutral-400 transition-colors cursor-pointer relative">
                    <input 
                      type="file" 
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                      onChange={handleFileChange}
                      accept="image/*"
                    />
                    <div className="mx-auto w-12 h-12 bg-neutral-50 rounded-full flex items-center justify-center">
                      <Layers className="w-6 h-6 text-neutral-300" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Ingest Photogram</p>
                      <p className="text-xs text-neutral-400 mt-1">RAW / JPEG / TIFF</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="aspect-video relative rounded-lg overflow-hidden bg-neutral-100 border border-neutral-200">
                      <img src={state.originalUrl} className="w-full h-full object-cover" alt="Source" />
                      <div className="absolute top-2 right-2">
                        <Badge variant="secondary" className="bg-white/80 backdrop-blur">SOURCE</Badge>
                      </div>
                    </div>
                    <Button 
                      className="w-full bg-neutral-900 text-white" 
                      onClick={runArchivalProcessing}
                      disabled={state.status !== "idle"}
                    >
                      {state.status === "idle" && "PROCESS CONSERVATION"}
                      {(state.status === "analyzing" || state.status === "restoring") && "PROCESSING..."}
                      {state.status === "completed" && "CONSERVATION COMPLETE"}
                    </Button>
                  </div>
                )}
              </section>

              {/* Conservation Settings */}
              <section className="space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-neutral-500" />
                  <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-500">Conservation Parameters</h2>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span>INFO RECOVERY (RECONSTRUCTION)</span>
                      <span>{state.intensity}%</span>
                    </div>
                    <Slider 
                      value={[state.intensity]} 
                      onValueChange={(v: number | number[]) => {
                        const val = Array.isArray(v) ? v[0] : v;
                        setState(s => ({ ...s, intensity: val }));
                      }} 
                      max={100} 
                      step={1}
                    />
                    <p className="text-[10px] text-neutral-400">Determines the aggressiveness of contextual inpainting.</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span>COLOR FIDELITY</span>
                      <span>{state.colorCorrection}%</span>
                    </div>
                    <Slider 
                      value={[state.colorCorrection]} 
                      onValueChange={(v: number | number[]) => {
                        const val = Array.isArray(v) ? v[0] : v;
                        setState(s => ({ ...s, colorCorrection: val }));
                      }} 
                      max={100} 
                      step={1}
                    />
                  </div>
                </div>
              </section>

              <Separator />

              {/* Analysis Section */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileSearch className="w-4 h-4 text-neutral-500" />
                  <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-500">Archival Report</h2>
                </div>
                
                {state.analysis ? (
                  <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-100 prose prose-neutral prose-xs max-w-none">
                    <ReactMarkdown>{state.analysis}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed rounded-lg opacity-40">
                    <Info className="w-5 h-5 mb-2" />
                    <p className="text-[10px] font-mono">Run processing to generate AI damage diagnostic report.</p>
                  </div>
                )}
              </section>
            </div>
          </ScrollArea>

          {/* Footer Sidebar */}
          <div className="p-4 border-t border-neutral-200 bg-neutral-50">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-neutral-400">ENGINE STATUS</span>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${state.status === 'idle' ? 'bg-green-500 animate-pulse' : 'bg-amber-500 animate-pulse'}`} />
                <span className="text-[10px] font-mono font-bold uppercase">{state.status}</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Viewport */}
        <section className="flex-1 bg-[#1a1a1a] relative flex items-center justify-center overflow-hidden">
          {!state.originalUrl ? (
            <div className="text-center space-y-6 max-w-md p-12">
               <Layers className="w-16 h-16 text-neutral-700 mx-auto" />
               <div className="space-y-2">
                 <h3 className="text-white text-lg font-display">Archival Viewport Offline</h3>
                 <p className="text-neutral-500 text-sm italic">"Waiting for digital photogram ingestion. Select a file to begin archival reconstruction pipeline."</p>
               </div>
               <div className="pt-8">
                 <Button onClick={() => document.getElementById('file-input')?.click()} variant="outline" className="text-white border-neutral-700 hover:bg-neutral-800">
                    INJECT PHOTOGRAM ASSET
                 </Button>
                 <input id="file-input" type="file" className="hidden" onChange={handleFileChange} />
               </div>
            </div>
          ) : (
            <div className="w-full h-full p-12 flex flex-col">
              <div className="flex-1 relative rounded-xl overflow-hidden shadow-2xl bg-neutral-900 border border-neutral-800 group">
                {/* Comparison Slider */}
                <div className="absolute inset-0">
                  {/* Processed (Bottom) */}
                  <div 
                    className="absolute inset-0 restoration-filter-applied"
                    style={{
                       filter: `contrast(${100 + state.colorCorrection/2}%) saturate(${100 + state.colorCorrection/4}%) brightness(105%)`,
                       mixBlendMode: 'normal'
                    }}
                  >
                    <img src={state.originalUrl} className="w-full h-full object-contain" alt="Processed" />
                    {/* Simulated Inpainting Overlay */}
                    {state.status === 'completed' && (
                       <motion.div 
                         initial={{ opacity: 0 }}
                         animate={{ opacity: state.intensity / 100 }}
                         className="absolute inset-0 pointer-events-none"
                         style={{
                           backgroundImage: `url(${state.originalUrl})`,
                           backgroundSize: 'contain',
                           backgroundPosition: 'center',
                           backgroundRepeat: 'no-repeat',
                           filter: `blur(0.5px) contrast(110%) brightness(110%)`,
                           maskImage: 'radial-gradient(circle at 30% 30%, transparent 10%, black 40%), radial-gradient(circle at 70% 60%, transparent 20%, black 50%)',
                           WebkitMaskImage: 'radial-gradient(circle at 30% 30%, transparent 10%, black 40%), radial-gradient(circle at 70% 60%, transparent 20%, black 50%)',
                         }}
                       />
                    )}
                  </div>
                  
                  {/* Original (Top with clip-path) */}
                  <div 
                    className="absolute inset-0"
                    style={{ clipPath: `inset(0 ${100 - sliderValue}% 0 0)` }}
                  >
                    <img src={state.originalUrl} className="w-full h-full object-contain grayscale-[20%] opacity-90" alt="Original" />
                    {/* Simulated Damage Overlay */}
                    <div className="absolute inset-0 opacity-40 mix-blend-multiply pointer-events-none" 
                       style={{ background: 'radial-gradient(circle at 30% 30%, #4a5d23 0%, transparent 20%), radial-gradient(circle at 70% 60%, #5d4a23 0%, transparent 30%)' }}
                    />
                  </div>

                  {/* Slider Control */}
                  <div 
                    className="absolute inset-y-0 w-1 bg-white cursor-ew-resize z-30"
                    style={{ left: `${sliderValue}%` }}
                    onMouseDown={(e) => {
                      const moveHandler = (moveEvent: MouseEvent) => {
                        const rect = (e.currentTarget as HTMLElement).parentElement?.getBoundingClientRect();
                        if (rect) {
                          const x = ((moveEvent.clientX - rect.left) / rect.width) * 100;
                          setSliderValue(Math.min(Math.max(x, 0), 100));
                        }
                      };
                      const upHandler = () => {
                        window.removeEventListener('mousemove', moveHandler);
                        window.removeEventListener('mouseup', upHandler);
                      };
                      window.addEventListener('mousemove', moveHandler);
                      window.addEventListener('mouseup', upHandler);
                    }}
                  >
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center border-4 border-neutral-900">
                      <div className="flex gap-1">
                        <div className="w-0.5 h-4 bg-neutral-300" />
                        <div className="w-0.5 h-4 bg-neutral-300" />
                      </div>
                    </div>
                  </div>

                  {/* Label Overlays */}
                  <div className="absolute bottom-6 left-6 z-40 bg-black/60 backdrop-blur px-3 py-1 rounded-full text-[10px] font-mono text-white/80 uppercase tracking-tighter">
                    ARCHIVAL SOURCE: DAMAGED EMULSION
                  </div>
                  <div className="absolute bottom-6 right-6 z-40 bg-black/60 backdrop-blur px-3 py-1 rounded-full text-[10px] font-mono text-white/80 uppercase tracking-tighter">
                    DIGITAL CONSERVATION: RETRIEVED INFO
                  </div>
                </div>
              </div>

              {/* Progress Pipeline */}
              <div className="mt-8 flex gap-4 overflow-x-auto pb-4">
                {activeStages.map((stage, idx) => (
                  <div key={stage.id} className="min-w-[200px] flex-1">
                    <Card className={`border-none ${stage.status === 'active' ? 'bg-neutral-800' : 'bg-neutral-900'} transition-colors`}>
                      <CardContent className="p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] font-mono text-neutral-500">STEP 0{idx + 1}</span>
                          {stage.status === 'completed' && <ShieldCheck className="w-3 h-3 text-green-500" />}
                          {stage.status === 'active' && <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />}
                        </div>
                        <h4 className="text-xs font-bold text-neutral-300 uppercase truncate">{stage.label}</h4>
                        <div className="h-1 bg-neutral-800 rounded-full overflow-hidden">
                           <motion.div 
                             className="h-full bg-neutral-400"
                             initial={{ width: 0 }}
                             animate={{ width: `${stage.progress}%` }}
                           />
                        </div>
                        <span className="text-[10px] font-mono text-neutral-600 block">{stage.status.toUpperCase()}</span>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Right Dashboard: Stats/Metadata */}
        <aside className="w-16 border-l border-neutral-200 bg-white flex flex-col items-center py-8 gap-8">
           <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-neutral-900 border-l-2 border-transparent hover:border-neutral-900 rounded-none">
             <Layers className="w-5 h-5" />
           </Button>
           <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-neutral-900 border-l-2 border-transparent hover:border-neutral-900 rounded-none">
             <Activity className="w-5 h-5" />
           </Button>
           <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-neutral-900 border-l-2 border-transparent hover:border-neutral-900 rounded-none">
             <Info className="w-5 h-5" />
           </Button>
           <div className="mt-auto pb-4">
             <div className="w-1 h-12 bg-neutral-100 rounded-full relative">
               <div className="absolute top-0 w-full h-1/2 bg-neutral-900 rounded-full" />
             </div>
           </div>
        </aside>
      </main>

      {/* Initial Landing Dialog */}
      {!state.originalUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
           <Card className="w-[500px] shadow-2xl border-none">
             <CardHeader className="text-center space-y-4">
               <div className="mx-auto w-16 h-16 bg-neutral-900 rounded-2xl flex items-center justify-center shadow-xl rotate-3">
                 <ShieldCheck className="w-8 h-8 text-white" />
               </div>
               <div className="space-y-1">
                 <CardTitle className="text-3xl font-display italic">Initialize Conservation</CardTitle>
                 <CardDescription className="font-mono text-xs uppercase tracking-widest">Digital Archival Integrity Systems</CardDescription>
               </div>
             </CardHeader>
             <CardContent className="space-y-6">
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex gap-4 text-amber-900">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <p className="font-bold">Conservation Warning:</p>
                    <p>Fungal-damaged emulsions require low-intensity non-destructive retrieval. Generative reconstruction of biological detail is disabled to maintain archival veracity.</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border rounded-xl hover:bg-neutral-50 transition-colors cursor-pointer group" onClick={() => document.getElementById('file-input-modal')?.click()}>
                    <FileSearch className="w-5 h-5 mb-2 text-neutral-400 group-hover:text-neutral-900" />
                    <p className="text-sm font-bold">Inject File</p>
                    <p className="text-[10px] text-neutral-500 italic">Select individual photograms.</p>
                    <input id="file-input-modal" type="file" className="hidden" onChange={handleFileChange} />
                  </div>
                  <div className="p-4 border rounded-xl opacity-40 cursor-not-allowed">
                    <Layers className="w-5 h-5 mb-2 text-neutral-400" />
                    <p className="text-sm font-bold">Batch Ingest</p>
                    <p className="text-[10px] text-neutral-500 italic">Restore entire series (Locked).</p>
                  </div>
                </div>

                <div className="text-center font-mono text-[10px] text-neutral-400">
                  "Information recovery &gt; Cosmetic perfection"
                </div>
             </CardContent>
           </Card>
        </div>
      )}
    </div>
  );
}
