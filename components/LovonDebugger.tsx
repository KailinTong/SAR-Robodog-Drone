import React, { useState, useEffect } from 'react';
import { Eye, Target, Move, ArrowRight, Terminal, Image as ImageIcon, BoxSelect } from 'lucide-react';

const LovonDebugger: React.FC = () => {
  const [step, setStep] = useState(0);
  const [log, setLog] = useState<string[]>([]);

  const STEPS = [
    { id: 'ioe', label: 'IOE: Entity Extraction', icon: Terminal },
    { id: 'ovd', label: 'OvD: Open Vocab Detection', icon: Eye },
    { id: 'l2mm', label: 'L2MM: Motion Mapping', icon: Move },
    { id: 'ros', label: 'ROS2: Command Vel', icon: ArrowRight },
  ];

  // Simulation loop for the debugger view
  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev + 1) % 4);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const msgs = [
      "Parsing input: 'Find the red backpack near the wall'",
      "Extracted Entity: { class: 'backpack', attr: 'red' }",
      "YOLO-World Confidence: 0.89 | BBox: [200, 150, 300, 400]",
      "Projecting depth to 3D point: (12.5, 3.2, 0.5)",
      "Generating Nav2 Goal: /go2/nav2/navigate_to_pose",
    ];
    if (step === 0) setLog([]); 
    setLog(prev => [...prev, msgs[step] || '...']);
  }, [step]);

  return (
    <div className="h-full bg-slate-900 p-6 flex flex-col gap-6 overflow-y-auto">
      <div className="border-b border-slate-700 pb-4">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Target className="text-green-400" /> 
          LOVON Internal Pipeline
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Real-time visualization of Language-Oriented Voxel Object Navigation nodes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
        
        {/* Left Column: Pipeline Visualizer */}
        <div className="flex flex-col gap-4">
          {STEPS.map((s, idx) => (
            <div 
              key={s.id}
              className={`relative p-4 rounded-lg border transition-all duration-500 flex items-center gap-4 ${
                idx === step 
                  ? 'bg-slate-800 border-green-500 shadow-[0_0_15px_rgba(74,222,128,0.2)] scale-[1.02]' 
                  : idx < step 
                    ? 'bg-slate-800/50 border-slate-700 opacity-60'
                    : 'bg-slate-900 border-slate-800 opacity-40'
              }`}
            >
              <div className={`p-3 rounded-full ${idx === step ? 'bg-green-500 text-black' : 'bg-slate-700 text-slate-400'}`}>
                <s.icon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className={`font-bold ${idx === step ? 'text-green-400' : 'text-slate-300'}`}>{s.label}</h3>
                <div className="text-xs text-slate-500 font-mono mt-1">
                  {idx === 0 && "Input: \"Find the red backpack\""}
                  {idx === 1 && "Model: YOLO-World-v2 (Clip-L)"}
                  {idx === 2 && "Map: 3D Voxel Grid Projection"}
                  {idx === 3 && "Topic: /go2/cmd_vel"}
                </div>
              </div>
              {idx === step && (
                <div className="absolute right-4 w-2 h-2 bg-green-500 rounded-full animate-ping" />
              )}
            </div>
          ))}
          
          <div className="mt-auto bg-black/50 p-4 rounded-lg font-mono text-xs text-green-400 h-40 overflow-y-auto border border-slate-800">
            {log.map((l, i) => (
              <div key={i} className="mb-1">> {l}</div>
            ))}
            <div className="animate-pulse">_</div>
          </div>
        </div>

        {/* Right Column: Visual Data Simulation */}
        <div className="flex flex-col gap-4">
          {/* Simulated Camera Feed */}
          <div className="relative flex-1 bg-black rounded-lg overflow-hidden border border-slate-700 group">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1517502884422-41e157d4433c?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center opacity-40 mix-blend-overlay" />
            
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                {/* Bounding Box Animation */}
                <div className={`border-2 border-red-500 w-32 h-40 transition-opacity duration-300 ${step >= 1 ? 'opacity-100' : 'opacity-0'}`}>
                  <div className="absolute -top-6 left-0 bg-red-500 text-white text-xs px-2 py-0.5 font-bold">
                    backpack 0.89
                  </div>
                </div>
              </div>
            </div>
            
            {/* Overlay Data */}
            <div className="absolute top-4 left-4 font-mono text-xs text-green-500 space-y-1">
              <div>CAM_ID: GO2_FRONT</div>
              <div>RES: 1280x720 @ 30fps</div>
              <div>LATENCY: 24ms</div>
            </div>

            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <div className="flex items-center gap-2 text-white font-bold">
                <ImageIcon className="w-5 h-5 text-blue-400" />
                <span>OvD Visualization</span>
              </div>
            </div>
          </div>

          {/* L2MM Voxel Grid View */}
          <div className="h-1/3 bg-slate-800 rounded-lg border border-slate-700 p-4 relative overflow-hidden">
             <div className="absolute inset-0 opacity-20" 
                 style={{ 
                   backgroundImage: 'linear-gradient(#94a3b8 1px, transparent 1px), linear-gradient(90deg, #94a3b8 1px, transparent 1px)', 
                   backgroundSize: '20px 20px' 
                 }}>
             </div>
             <div className="absolute top-2 left-2 text-xs font-bold text-orange-400 flex items-center gap-2">
               <BoxSelect className="w-4 h-4" /> Local Voxel Map
             </div>
             
             {/* Simulated Robot and Raycast */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-orange-500 rounded-full shadow-lg shadow-orange-500/50" />
             
             {step >= 2 && (
               <>
                 <svg className="absolute inset-0 w-full h-full pointer-events-none">
                   <line x1="50%" y1="50%" x2="70%" y2="30%" stroke="red" strokeWidth="2" strokeDasharray="4" className="animate-pulse" />
                   <circle cx="70%" cy="30%" r="4" fill="red" />
                 </svg>
                 <div className="absolute top-[30%] left-[70%] translate-x-2 text-xs text-red-300 font-mono">
                   TARGET (12.5, 3.2)
                 </div>
               </>
             )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default LovonDebugger;