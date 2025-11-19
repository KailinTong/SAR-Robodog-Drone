import React from 'react';
import { RobotState, RobotType, Position } from '../types';
import { MapPin, Navigation, ShieldAlert } from 'lucide-react';

interface MissionMapProps {
  robots: RobotState[];
}

const TUNNEL_LENGTH = 100; // meters
const TUNNEL_WIDTH = 10; // meters

const MissionMap: React.FC<MissionMapProps> = ({ robots }) => {
  // Convert meters to percentage for CSS positioning
  const toPctX = (x: number) => Math.max(0, Math.min(100, (x / TUNNEL_LENGTH) * 100));
  const toPctY = (y: number) => Math.max(0, Math.min(100, ((y + TUNNEL_WIDTH / 2) / TUNNEL_WIDTH) * 100));

  return (
    <div className="relative w-full h-96 bg-slate-900 border border-slate-700 rounded-lg overflow-hidden shadow-inner">
      {/* Tunnel Background / Grid */}
      <div className="absolute inset-0 opacity-20" 
           style={{ 
             backgroundImage: 'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)', 
             backgroundSize: '20px 20px' 
           }}>
      </div>
      
      {/* Tunnel Walls */}
      <div className="absolute top-0 left-0 right-0 h-4 bg-slate-800 border-b border-slate-600 flex items-center justify-center text-xs text-slate-500">NORTH WALL</div>
      <div className="absolute bottom-0 left-0 right-0 h-4 bg-slate-800 border-t border-slate-600 flex items-center justify-center text-xs text-slate-500">SOUTH WALL</div>

      {/* Distance Markers */}
      {[0, 20, 40, 60, 80, 100].map((dist) => (
        <div key={dist} className="absolute bottom-6 text-xs text-slate-600 font-mono" style={{ left: `${dist}%` }}>
          {dist}m
        </div>
      ))}

      {/* Robots */}
      {robots.map((robot) => (
        <div
          key={robot.id}
          className="absolute transition-all duration-500 ease-in-out flex flex-col items-center z-10"
          style={{
            left: `${toPctX(robot.position.x)}%`,
            top: `${toPctY(robot.position.y)}%`,
            transform: `translate(-50%, -50%)`
          }}
        >
          <div className={`relative p-2 rounded-full border-2 ${robot.type === RobotType.UAV ? 'border-cyan-500 bg-cyan-900/50' : 'border-orange-500 bg-orange-900/50'}`}>
            {robot.type === RobotType.UAV ? (
              <Navigation className="w-5 h-5 text-cyan-400 animate-pulse" style={{ transform: `rotate(${robot.position.yaw}deg)`}} />
            ) : (
              <div className="w-5 h-5 bg-orange-500 rounded-sm" style={{ transform: `rotate(${robot.position.yaw}deg)`}} />
            )}
            
            {/* Nav Goal Vector */}
            {robot.navGoal && (
               <svg className="absolute top-1/2 left-1/2 w-32 h-32 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                 <line 
                   x1="50%" y1="50%" 
                   x2={`${50 + (robot.navGoal.x - robot.position.x) * 2}%`} 
                   y2={`${50 + (robot.navGoal.y - robot.position.y) * 10}%`} 
                   stroke={robot.type === RobotType.UAV ? "cyan" : "orange"} 
                   strokeWidth="2" 
                   strokeDasharray="4"
                 />
               </svg>
            )}
          </div>
          <span className="text-[10px] mt-1 font-mono bg-slate-900/80 px-1 rounded text-white whitespace-nowrap">
            {robot.name}
          </span>
        </div>
      ))}

      {/* Simulated Detection Zone (LOVON) */}
      {robots.filter(r => r.status === 'SEARCHING').map(r => (
         <div 
            key={`fov-${r.id}`}
            className={`absolute rounded-full opacity-20 blur-xl transition-all duration-1000 ${r.type === RobotType.UAV ? 'bg-cyan-400' : 'bg-orange-400'}`}
            style={{
              left: `${toPctX(r.position.x)}%`,
              top: `${toPctY(r.position.y)}%`,
              width: r.type === RobotType.UAV ? '150px' : '100px',
              height: r.type === RobotType.UAV ? '150px' : '100px',
              transform: 'translate(-50%, -50%)'
            }}
         />
      ))}
      
      {/* Legend Overlay */}
      <div className="absolute top-2 right-2 bg-slate-900/90 p-2 rounded border border-slate-700 text-xs font-mono">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-3 h-3 bg-orange-500 rounded-sm"></div> GO2 (Ground)
        </div>
        <div className="flex items-center gap-2">
          <Navigation className="w-3 h-3 text-cyan-400" /> UAV (Air)
        </div>
      </div>
    </div>
  );
};

export default MissionMap;
