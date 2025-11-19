export enum RobotType {
  GO2 = 'GO2',
  UAV = 'UAV'
}

export enum RobotStatus {
  IDLE = 'IDLE',
  PLANNING = 'PLANNING',
  MOVING = 'MOVING',
  SEARCHING = 'SEARCHING',
  ERROR = 'ERROR',
  RETURNING = 'RETURNING'
}

export interface Position {
  x: number; // Meters relative to tunnel entrance
  y: number; // Meters laterally (-width/2 to width/2)
  z: number; // Altitude
  yaw: number; // Heading
}

export interface RobotState {
  id: string;
  type: RobotType;
  name: string;
  status: RobotStatus;
  position: Position;
  battery: number;
  currentTask: string | null;
  lovonConfidence: number; // 0-1 confidence of object extraction
  navGoal: Position | null;
  sensors: {
    camera: boolean;
    lidar: boolean;
    imu: boolean;
  };
}

export interface Task {
  id: string;
  description: string;
  assignedTo: string | null; // Robot ID
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  type: 'SEARCH' | 'INSPECT' | 'WAIT' | 'RETURN';
  location?: Position;
}

export interface SystemLog {
  timestamp: string;
  source: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  message: string;
}

export enum ViewMode {
  MISSION_CONTROL = 'MISSION_CONTROL',
  ARCHITECTURE = 'ARCHITECTURE',
  SIM_REAL_ROADMAP = 'SIM_REAL_ROADMAP',
  LOVON_DEBUG = 'LOVON_DEBUG',
  CONFIG = 'CONFIG'
}