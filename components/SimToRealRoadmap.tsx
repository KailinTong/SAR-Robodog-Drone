import React from 'react';
import { CheckCircle2, Circle, Lock, AlertTriangle } from 'lucide-react';

const ROADMAP_DATA = [
  {
    phase: "Phase 1: Go2 Visual & Nav Simulation",
    steps: [
      { id: 's1', label: "Gazebo Tunnel World Setup", status: 'done' },
      { id: 's2', label: "Go2 URDF & Sensor Noise Models", status: 'done' },
      { id: 's3', label: "LOVON Integration (Sim Camera)", status: 'in-progress' },
      { id: 's4', label: "Nav2 Parameter Tuning (Costmaps)", status: 'pending' },
    ]
  },
  {
    phase: "Phase 2: Real Go2 Migration",
    steps: [
      { id: 'r1', label: "Visual Pipeline Only (No Motion)", status: 'pending', risk: 'low' },
      { id: 'r2', label: "Pure Nav2 (Teleop Override)", status: 'pending', risk: 'medium' },
      { id: 'r3', label: "LOVON -> cmd_vel (Speed Lim 0.2m/s)", status: 'locked', risk: 'high' },
      { id: 'r4', label: "Full Autonomy with Safety Filter", status: 'locked', risk: 'critical' },
    ]
  },
  {
    phase: "Phase 3: UAV Integration",
    steps: [
      { id: 'u1', label: "SITL Flight Control Test", status: 'pending' },
      { id: 'u2', label: "Real UAV Perception Only", status: 'locked' },
      { id: 'u3', label: "NavigateToPose Interface Test", status: 'locked' },
      { id: 'u4', label: "Multi-Agent Co-op Test", status: 'locked' }
    ]
  }
];

const SimToRealRoadmap: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full overflow-y-auto p-4">
      {ROADMAP_DATA.map((phase, idx) => (
        <div key={idx} className="bg-slate-800 border border-slate-700 rounded-xl p-5 flex flex-col">
          <h3 className="text-lg font-bold text-slate-200 mb-4 border-b border-slate-700 pb-2">
            {phase.phase}
          </h3>
          <div className="space-y-4">
            {phase.steps.map((step) => (
              <div key={step.id} className={`flex items-start gap-3 p-3 rounded-lg border ${
                step.status === 'done' ? 'bg-green-900/20 border-green-800' :
                step.status === 'in-progress' ? 'bg-blue-900/20 border-blue-800' :
                step.status === 'locked' ? 'bg-slate-900/50 border-slate-800 opacity-60' :
                'bg-slate-800 border-slate-700'
              }`}>
                <div className="mt-0.5">
                  {step.status === 'done' ? <CheckCircle2 className="w-5 h-5 text-green-500" /> :
                   step.status === 'in-progress' ? <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /> :
                   step.status === 'locked' ? <Lock className="w-5 h-5 text-slate-500" /> :
                   <Circle className="w-5 h-5 text-slate-400" />}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-slate-300">{step.label}</div>
                  {/* Risk Badge */}
                  {'risk' in step && step.status !== 'done' && step.status !== 'locked' && (
                     <div className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                       step.risk === 'low' ? 'bg-slate-700 text-slate-300' :
                       step.risk === 'medium' ? 'bg-yellow-900/50 text-yellow-400' :
                       step.risk === 'high' ? 'bg-orange-900/50 text-orange-400' :
                       'bg-red-900/50 text-red-400'
                     }`}>
                       <AlertTriangle className="w-3 h-3" /> {step.risk} Risk
                     </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default SimToRealRoadmap;
