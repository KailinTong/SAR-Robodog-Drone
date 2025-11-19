import React from 'react';

const ArchitectureView: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 bg-slate-900 overflow-y-auto">
      <div className="max-w-5xl w-full bg-slate-800/50 p-8 rounded-xl border border-slate-700">
        <h2 className="text-2xl font-bold text-white mb-8 text-center">System Architecture: LOVON + ROS2 + Gemini</h2>
        
        <div className="relative w-full aspect-video border border-slate-600 bg-slate-900 rounded-lg p-4 shadow-2xl">
          {/* SVG Diagram */}
          <svg width="100%" height="100%" viewBox="0 0 800 400" className="overflow-visible">
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
              </marker>
            </defs>

            {/* Nodes */}
            {/* External User */}
            <g transform="translate(50, 200)">
              <rect x="0" y="-30" width="100" height="60" rx="8" fill="#3b82f6" fillOpacity="0.2" stroke="#3b82f6" strokeWidth="2" />
              <text x="50" y="5" textAnchor="middle" fill="white" className="text-xs font-bold">Human CMD</text>
            </g>

            {/* Gemini Agent */}
            <g transform="translate(200, 200)">
              <rect x="0" y="-40" width="120" height="80" rx="8" fill="#a855f7" fillOpacity="0.2" stroke="#a855f7" strokeWidth="2" />
              <text x="60" y="-15" textAnchor="middle" fill="#d8b4fe" className="text-xs font-bold">Gemini 3</text>
              <text x="60" y="5" textAnchor="middle" fill="#d8b4fe" className="text-[10px]">Coordinator</text>
              <text x="60" y="25" textAnchor="middle" fill="#d8b4fe" className="text-[10px]">Task Decomp</text>
            </g>

            {/* LOVON Node */}
            <g transform="translate(400, 100)">
              <rect x="0" y="-35" width="120" height="70" rx="8" fill="#10b981" fillOpacity="0.2" stroke="#10b981" strokeWidth="2" />
              <text x="60" y="-10" textAnchor="middle" fill="#6ee7b7" className="text-xs font-bold">LOVON</text>
              <text x="60" y="10" textAnchor="middle" fill="#6ee7b7" className="text-[10px]">L2MM + OvD</text>
            </g>

            {/* Nav2 Stack */}
            <g transform="translate(400, 300)">
              <rect x="0" y="-35" width="120" height="70" rx="8" fill="#f59e0b" fillOpacity="0.2" stroke="#f59e0b" strokeWidth="2" />
              <text x="60" y="-10" textAnchor="middle" fill="#fcd34d" className="text-xs font-bold">Nav2 Stack</text>
              <text x="60" y="10" textAnchor="middle" fill="#fcd34d" className="text-[10px]">Planner / Costmap</text>
            </g>

            {/* ROS2 Bus */}
            <rect x="380" y="190" width="160" height="20" fill="#334155" rx="4" />
            <text x="460" y="204" textAnchor="middle" fill="#94a3b8" className="text-[10px] font-mono">ROS2 DDS / Topics</text>

            {/* Hardware / Sim */}
            <g transform="translate(600, 150)">
              <rect x="0" y="-30" width="120" height="100" rx="8" fill="#ef4444" fillOpacity="0.2" stroke="#ef4444" strokeWidth="2" />
              <text x="60" y="-15" textAnchor="middle" fill="#fca5a5" className="text-xs font-bold">Hardware / Sim</text>
              <text x="60" y="10" textAnchor="middle" fill="#fca5a5" className="text-[10px]">/go2/cmd_vel</text>
              <text x="60" y="30" textAnchor="middle" fill="#fca5a5" className="text-[10px]">/drone/cmd_vel</text>
            </g>

            {/* Connections */}
            <line x1="150" y1="200" x2="200" y2="200" stroke="#64748b" strokeWidth="2" markerEnd="url(#arrowhead)" />
            <line x1="320" y1="200" x2="380" y2="200" stroke="#64748b" strokeWidth="2" markerEnd="url(#arrowhead)" />
            
            {/* LOVON interactions */}
            <path d="M 320 200 Q 350 200 350 150 L 350 135 L 400 135" fill="none" stroke="#64748b" strokeWidth="1" markerEnd="url(#arrowhead)" strokeDasharray="4" />
            
            {/* Nav2 interactions */}
            <path d="M 320 200 Q 350 200 350 250 L 350 300 L 400 300" fill="none" stroke="#64748b" strokeWidth="1" markerEnd="url(#arrowhead)" strokeDasharray="4" />

            <line x1="520" y1="135" x2="600" y2="160" stroke="#64748b" strokeWidth="2" markerEnd="url(#arrowhead)" />
            <line x1="520" y1="300" x2="600" y2="240" stroke="#64748b" strokeWidth="2" markerEnd="url(#arrowhead)" />

            {/* Feedback Loop */}
            <path d="M 660 220 L 660 380 L 260 380 L 260 280" fill="none" stroke="#475569" strokeWidth="2" strokeDasharray="5,5" markerEnd="url(#arrowhead)" />
            <text x="460" y="390" textAnchor="middle" fill="#64748b" className="text-[10px]">Sensor Feedback (Odom/Images)</text>

          </svg>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 text-sm text-slate-400 font-mono">
            <div className="p-3 border border-slate-700 rounded bg-slate-800">
                <strong className="text-cyan-400">Topics (ROS2 Humble):</strong>
                <ul className="list-disc pl-4 mt-2 space-y-1">
                    <li>/sar/task_allocation (JSON)</li>
                    <li>/go2/camera/image_raw</li>
                    <li>/drone/nav/navigate_to_pose</li>
                    <li>/lovon/detection_array</li>
                </ul>
            </div>
            <div className="p-3 border border-slate-700 rounded bg-slate-800">
                <strong className="text-orange-400">Safety Layer:</strong>
                <ul className="list-disc pl-4 mt-2 space-y-1">
                    <li>Geofence Enforcer (Node)</li>
                    <li>Collision Monitor (Nav2)</li>
                    <li>Low-Battery Return Trigger</li>
                    <li>LLM Cmd Validation Middleware</li>
                </ul>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ArchitectureView;
