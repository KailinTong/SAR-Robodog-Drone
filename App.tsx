import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Activity, Cpu, Map, FileCode2, Send, AlertCircle, Check, RotateCcw, Eye } from 'lucide-react';
import { RobotState, RobotType, RobotStatus, Task, ViewMode, SystemLog } from './types';
import { generateMissionPlan } from './services/geminiService';
import MissionMap from './components/MissionMap';
import SimToRealRoadmap from './components/SimToRealRoadmap';
import ArchitectureView from './components/ArchitectureView';
import LovonDebugger from './components/LovonDebugger';

const INITIAL_ROBOTS: RobotState[] = [
  {
    id: 'go2_01',
    type: RobotType.GO2,
    name: 'Go2-Alpha',
    status: RobotStatus.IDLE,
    position: { x: 5, y: 2, z: 0.2, yaw: 0 },
    battery: 88,
    currentTask: null,
    lovonConfidence: 0,
    navGoal: null,
    sensors: { camera: true, lidar: true, imu: true }
  },
  {
    id: 'uav_01',
    type: RobotType.UAV,
    name: 'Sky-Eye-1',
    status: RobotStatus.IDLE,
    position: { x: 2, y: -1, z: 0, yaw: 0 }, // Landed
    battery: 95,
    currentTask: null,
    lovonConfidence: 0,
    navGoal: null,
    sensors: { camera: true, lidar: false, imu: true }
  }
];

export default function App() {
  const [view, setView] = useState<ViewMode>(ViewMode.MISSION_CONTROL);
  const [robots, setRobots] = useState<RobotState[]>(INITIAL_ROBOTS);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [inputCmd, setInputCmd] = useState('');
  const [isPlanning, setIsPlanning] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<{reasoning: string, tasks: any[], safetyChecks: string[]} | null>(null);
  
  const logsEndRef = useRef<HTMLDivElement>(null);

  const addLog = (msg: string, level: 'INFO' | 'WARN' | 'ERROR' = 'INFO', source: string = 'SYS') => {
    setLogs(prev => [...prev, { timestamp: new Date().toLocaleTimeString(), source, level, message: msg }].slice(-50));
  };

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Simulation Loop (Mocking ROS2 updates)
  useEffect(() => {
    const interval = setInterval(() => {
      setRobots(prevRobots => prevRobots.map(r => {
        let newR = { ...r };
        
        // Simulate Battery Drain
        if (r.status !== RobotStatus.IDLE) {
           newR.battery = Math.max(0, r.battery - 0.05);
        }

        // Simulate Nav Movement
        if (r.navGoal) {
          const dx = r.navGoal.x - r.position.x;
          const dy = r.navGoal.y - r.position.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          
          if (dist < 0.5) {
            // Reached goal
            newR.navGoal = null;
            newR.status = RobotStatus.SEARCHING; // Switch to searching upon arrival
            addLog(`${r.name} reached waypoint. Starting Local Search.`, 'INFO', r.id);
          } else {
            // Move towards goal
            const speed = r.type === RobotType.UAV ? 0.5 : 0.2; // meters per tick
            const angle = Math.atan2(dy, dx);
            newR.position.x += Math.cos(angle) * speed;
            newR.position.y += Math.sin(angle) * speed;
            newR.position.yaw = (angle * 180) / Math.PI;
            newR.status = RobotStatus.MOVING;
            
            // UAV Takeoff Sim
            if (r.type === RobotType.UAV && r.position.z < 1.5) {
              newR.position.z += 0.1;
            }
          }
        } else if (r.status === RobotStatus.SEARCHING) {
            // Simulate Search Jitter
            newR.position.yaw += (Math.random() - 0.5) * 10;
            newR.lovonConfidence = Math.min(1, Math.max(0, newR.lovonConfidence + (Math.random() - 0.3) * 0.1));
            
            if (newR.lovonConfidence > 0.9) {
                 addLog(`${r.name} LOVON DETECTED OBJECT: Person [92%]`, 'WARN', r.id);
                 newR.status = RobotStatus.IDLE; // Found it, stop.
                 newR.lovonConfidence = 0;
            }
        }

        return newR;
      }));
    }, 100); // 10Hz Sim Loop

    return () => clearInterval(interval);
  }, []);

  const handleCommandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCmd.trim()) return;
    
    setIsPlanning(true);
    addLog(`Planning mission: "${inputCmd}"`, 'INFO', 'GEMINI');
    
    const plan = await generateMissionPlan(inputCmd, robots);
    
    setCurrentPlan(plan);
    setIsPlanning(false);
    
    if (plan.tasks.length > 0) {
       addLog(`Plan Generated: ${plan.reasoning}`, 'INFO', 'GEMINI');
    } else {
       addLog(`Plan Failed: ${plan.reasoning}`, 'ERROR', 'GEMINI');
    }
  };

  const executePlan = () => {
    if (!currentPlan) return;

    addLog('Executing Multi-Agent Plan...', 'WARN', 'COORDINATOR');
    
    const newRobots = [...robots];
    
    currentPlan.tasks.forEach((task: any) => {
        const robotIndex = newRobots.findIndex(r => r.name === task.assignedTo);
        if (robotIndex !== -1) {
            const r = newRobots[robotIndex];
            r.currentTask = task.description;
            if (task.targetCoordinates) {
                r.navGoal = { ...task.targetCoordinates, yaw: 0 };
                r.status = RobotStatus.PLANNING;
            } else if (task.type === 'SEARCH') {
                r.status = RobotStatus.SEARCHING;
            }
            addLog(`Assigned task to ${r.name}: ${task.description}`, 'INFO', 'ROS2');
        } else {
            addLog(`Could not assign task to unknown robot: ${task.assignedTo}`, 'ERROR', 'ROS2');
        }
    });
    
    setRobots(newRobots);
    setCurrentPlan(null);
    setInputCmd('');
  };

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-200 overflow-hidden font-sans">
      
      {/* Sidebar */}
      <aside className="w-20 flex flex-col items-center py-6 border-r border-slate-800 bg-slate-900 z-20">
        <div className="mb-8 p-2 bg-blue-600 rounded-lg">
          <Activity className="w-6 h-6 text-white" />
        </div>
        
        <nav className="flex flex-col gap-4">
          <button 
            onClick={() => setView(ViewMode.MISSION_CONTROL)}
            className={`p-3 rounded-xl transition-all ${view === ViewMode.MISSION_CONTROL ? 'bg-slate-800 text-blue-400 shadow-lg shadow-blue-900/20' : 'text-slate-500 hover:bg-slate-800/50'}`}
            title="Mission Control"
          >
            <Map className="w-6 h-6" />
          </button>
          <button 
            onClick={() => setView(ViewMode.LOVON_DEBUG)}
            className={`p-3 rounded-xl transition-all ${view === ViewMode.LOVON_DEBUG ? 'bg-slate-800 text-green-400 shadow-lg shadow-green-900/20' : 'text-slate-500 hover:bg-slate-800/50'}`}
            title="LOVON Debugger"
          >
            <Eye className="w-6 h-6" />
          </button>
          <button 
            onClick={() => setView(ViewMode.ARCHITECTURE)}
            className={`p-3 rounded-xl transition-all ${view === ViewMode.ARCHITECTURE ? 'bg-slate-800 text-purple-400 shadow-lg shadow-purple-900/20' : 'text-slate-500 hover:bg-slate-800/50'}`}
            title="System Architecture"
          >
            <Cpu className="w-6 h-6" />
          </button>
           <button 
            onClick={() => setView(ViewMode.SIM_REAL_ROADMAP)}
            className={`p-3 rounded-xl transition-all ${view === ViewMode.SIM_REAL_ROADMAP ? 'bg-slate-800 text-orange-400 shadow-lg shadow-orange-900/20' : 'text-slate-500 hover:bg-slate-800/50'}`}
            title="Sim-to-Real Roadmap"
          >
            <FileCode2 className="w-6 h-6" />
          </button>
        </nav>
        
        <div className="mt-auto">
          <div className="w-3 h-3 rounded-full bg-green-500 shadow-lg shadow-green-500/50 animate-pulse"></div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        
        {/* Header */}
        <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur flex items-center px-6 justify-between">
            <div>
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-3">
                    SAR-LINK <span className="text-slate-500 text-sm font-normal">Tunnel Operations Command</span>
                </h1>
            </div>
            <div className="flex items-center gap-4">
                <span className="flex items-center gap-2 text-xs font-mono text-slate-400 px-3 py-1 rounded bg-slate-800 border border-slate-700">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div> ROS2 HUMBLE: ACTIVE
                </span>
                <span className="flex items-center gap-2 text-xs font-mono text-slate-400 px-3 py-1 rounded bg-slate-800 border border-slate-700">
                     SIMULATION MODE
                </span>
            </div>
        </header>

        {/* Main Viewport */}
        <div className="flex-1 overflow-hidden relative">
           {view === ViewMode.MISSION_CONTROL && (
               <div className="h-full flex flex-col p-4 gap-4">
                   
                   {/* Top: Map & Status */}
                   <div className="flex flex-1 gap-4 min-h-0">
                       {/* Map Area */}
                       <div className="flex-[2] flex flex-col gap-2">
                           <MissionMap robots={robots} />
                           
                           {/* Robot Cards */}
                           <div className="grid grid-cols-2 gap-4 mt-2">
                                {robots.map(r => (
                                    <div key={r.id} className="bg-slate-800/50 border border-slate-700 p-4 rounded-lg flex items-center justify-between">
                                        <div>
                                            <div className="text-sm font-bold text-white flex items-center gap-2">
                                                {r.name} <span className="text-[10px] text-slate-400 font-mono">[{r.id}]</span>
                                            </div>
                                            <div className="text-xs text-slate-400 mt-1 font-mono">
                                                STATUS: <span className={r.status === 'ERROR' ? 'text-red-400' : 'text-blue-300'}>{r.status}</span>
                                            </div>
                                            <div className="text-xs text-slate-500 mt-0.5">
                                                POS: {r.position.x.toFixed(1)}m, {r.position.y.toFixed(1)}m
                                            </div>
                                        </div>
                                        <div className="text-right">
                                             <div className={`text-xl font-bold ${r.battery < 20 ? 'text-red-500' : 'text-green-400'}`}>
                                                 {r.battery.toFixed(0)}%
                                             </div>
                                             <div className="text-[10px] text-slate-500 uppercase">Battery</div>
                                        </div>
                                    </div>
                                ))}
                           </div>
                       </div>

                       {/* Right: LLM & Chat */}
                       <div className="flex-1 bg-slate-900 border border-slate-700 rounded-lg flex flex-col overflow-hidden">
                           <div className="p-3 bg-slate-800 border-b border-slate-700 font-bold text-sm flex items-center gap-2">
                               <Terminal className="w-4 h-4 text-purple-400" />
                               Gemini Coordinator
                           </div>
                           
                           <div className="flex-1 overflow-y-auto p-4 space-y-4">
                               {currentPlan ? (
                                   <div className="bg-slate-800 rounded p-4 border border-slate-700 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                       <div className="text-xs text-purple-300 font-bold mb-2 uppercase tracking-wider">Proposed Mission Plan</div>
                                       <p className="text-sm text-slate-300 mb-4 italic">"{currentPlan.reasoning}"</p>
                                       
                                       <div className="space-y-2">
                                           {currentPlan.tasks.map((t: any, i: number) => (
                                               <div key={i} className="bg-slate-900/50 p-2 rounded border-l-2 border-purple-500 text-xs">
                                                   <span className="font-bold text-white">{t.assignedTo}</span>: {t.description}
                                                   <div className="mt-1 text-slate-500 flex gap-2">
                                                       <span className="bg-slate-800 px-1 rounded">{t.priority}</span>
                                                       <span className="bg-slate-800 px-1 rounded">{t.type}</span>
                                                   </div>
                                               </div>
                                           ))}
                                       </div>

                                       {currentPlan.safetyChecks.length > 0 && (
                                           <div className="mt-4 p-2 bg-orange-900/20 border border-orange-800 rounded text-xs text-orange-300">
                                               <div className="flex items-center gap-1 font-bold mb-1"><AlertCircle className="w-3 h-3"/> Safety Constraints Applied</div>
                                               <ul className="list-disc pl-4 space-y-0.5">
                                                   {currentPlan.safetyChecks.map((s, i) => <li key={i}>{s}</li>)}
                                               </ul>
                                           </div>
                                       )}

                                       <div className="mt-4 flex gap-2">
                                           <button 
                                               onClick={() => setCurrentPlan(null)}
                                               className="flex-1 py-2 text-xs bg-slate-700 hover:bg-slate-600 rounded text-white"
                                           >
                                               Discard
                                           </button>
                                           <button 
                                               onClick={executePlan}
                                               className="flex-1 py-2 text-xs bg-purple-600 hover:bg-purple-500 rounded text-white font-bold flex items-center justify-center gap-2"
                                           >
                                               <Check className="w-3 h-3" /> Execute Plan
                                           </button>
                                       </div>
                                   </div>
                               ) : (
                                   <div className="text-center text-slate-600 text-sm mt-10">
                                       <p>Waiting for command...</p>
                                       <p className="text-xs mt-2">Try: "Inspect the north wall with the drone and search the ground with the dog."</p>
                                   </div>
                               )}
                           </div>

                           <div className="p-3 bg-slate-800 border-t border-slate-700">
                               <form onSubmit={handleCommandSubmit} className="relative">
                                   <input 
                                       type="text" 
                                       value={inputCmd}
                                       onChange={(e) => setInputCmd(e.target.value)}
                                       placeholder="Enter mission instructions..." 
                                       className="w-full bg-slate-900 border border-slate-600 rounded-md py-2 pl-3 pr-10 text-sm focus:outline-none focus:border-purple-500 text-white placeholder-slate-500"
                                       disabled={isPlanning}
                                   />
                                   <button 
                                       type="submit"
                                       disabled={isPlanning}
                                       className="absolute right-1 top-1 p-1.5 bg-purple-600 hover:bg-purple-500 rounded text-white disabled:opacity-50"
                                   >
                                       {isPlanning ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                   </button>
                               </form>
                           </div>
                       </div>
                   </div>

                   {/* Bottom: System Logs */}
                   <div className="h-32 bg-slate-950 border border-slate-800 rounded-lg p-2 font-mono text-xs overflow-y-auto flex flex-col-reverse">
                        <div ref={logsEndRef} />
                        {logs.map((log, i) => (
                            <div key={i} className="mb-1 break-all">
                                <span className="text-slate-500">[{log.timestamp}]</span>
                                <span className={`ml-2 font-bold ${
                                    log.level === 'ERROR' ? 'text-red-500' : 
                                    log.level === 'WARN' ? 'text-yellow-500' : 'text-blue-400'
                                }`}>
                                    {log.level}
                                </span>
                                <span className="ml-2 text-slate-400">[{log.source}]</span>
                                <span className="ml-2 text-slate-300">{log.message}</span>
                            </div>
                        ))}
                   </div>

               </div>
           )}

           {view === ViewMode.LOVON_DEBUG && <LovonDebugger />}
           {view === ViewMode.ARCHITECTURE && <ArchitectureView />}
           {view === ViewMode.SIM_REAL_ROADMAP && <SimToRealRoadmap />}
        </div>

      </main>
    </div>
  );
}