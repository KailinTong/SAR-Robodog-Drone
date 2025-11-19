# SAR-Link: Language-Guided Multi-Robot Tunnel Search & Rescue

**System Version:** 1.0.0-alpha
**ROS2 Distribution:** Humble / Iron
**Simulation:** Gazebo Harmonic / Ignition

## 1. System Overview
This repository contains the unified framework for coordinating a Unitree Go2 (Quadruped) and a Custom UAV for tunnel search and rescue operations. The system leverages **Gemini 3** for high-level task orchestration and **LOVON** (Language-Oriented Voxel Object Navigation) for semantic perception and local motion planning.

---

## 2. ROS2 Workspace Structure

```bash
~/sar_ws/src/
├── sar_common_msgs/          # Custom messages (Task.msg, RobotStatus.msg)
├── sar_bringup/              # Main launch files (sim & real)
├── sar_llm_coordinator/      # Python node interfacing with Gemini API
├── sar_lovon_bridge/         # LOVON implementation (L2MM, IOE, OvD)
├── sar_nav_agents/           # Nav2 BT navigators for Go2/UAV
├── go2_driver/               # Unitree Go2 ROS2 hardware interface
└── uav_driver/               # MAVROS/DDS bridge for flight controller
```

## 3. The LOVON Pipeline Implementation

LOVON solves the "Language to Action" problem. In this architecture, it runs as a lifecycle node `/lovon_node` on each robot (or centrally on the edge server).

### 3.1 Pipeline Steps
1.  **IOE (Instance Object Extraction):** 
    *   *Input:* "Find the red backpack near the entrance."
    *   *Output:* Target Class: `backpack`, Attribute: `red`.
2.  **OvD (Open-Vocabulary Detection):**
    *   Uses YOLO-World or OWL-ViT subscribed to `/camera/image_raw`.
    *   Publishes bounding boxes and depth-aligned 3D coordinates.
3.  **L2MM (Language-to-Motion Model):**
    *   Maps "near the entrance" + Current Odom -> Search Area.
    *   Generates `geometry_msgs/PoseStamped` goal for Nav2.

### 3.2 Integration Logic (Python Pseudocode)

```python
# sar_lovon_bridge/lovon_node.py

class LovonNode(Node):
    def __init__(self):
        super().__init__('lovon_node')
        # Subscribers
        self.sub_img = self.create_subscription(Image, 'camera/image_raw', self.img_cb, 10)
        self.sub_task = self.create_subscription(String, 'lovon/task_text', self.task_cb, 10)
        
        # Publishers
        self.pub_goal = self.create_publisher(PoseStamped, 'nav2/goal_pose', 10)
        self.pub_cmd = self.create_publisher(Twist, 'cmd_vel', 10) # Direct control for visual servoing

    def task_cb(self, msg):
        # Step 1: IOE via LLM or Spacy
        target, color = self.extract_entities(msg.data)
        self.current_target = target
        
    def img_cb(self, img_msg):
        if not self.current_target: return
        
        # Step 2: OvD (YOLO-World)
        detections = self.detector.predict(img_msg, classes=[self.current_target])
        
        if detections:
            # Step 3: Visual Servoing or Waypoint Generation
            target_pose = self.depth_project(detections[0])
            self.publish_nav_goal(target_pose)
```

---

## 4. Unified Topic Graph

Both Simulation and Real Hardware must expose these exact topics:

### **Shared Interfaces**
| Topic | Type | Description |
| :--- | :--- | :--- |
| `/sar/mission_command` | `std_msgs/String` | Natural language input from operator |
| `/sar/task_allocation` | `sar_common_msgs/TaskArray` | JSON plan parsed from Gemini |
| `/tf` | `tf2_msgs/TFMessage` | Standard TF tree (map -> odom -> base_link) |

### **Unitree Go2 Namespace (`/go2`)**
| Topic | Type | Purpose |
| :--- | :--- | :--- |
| `cmd_vel` | `geometry_msgs/Twist` | Motion Control (Max 0.5m/s safe mode) |
| `odom` | `nav_msgs/Odometry` | VIO/Lidar Odometry |
| `camera_front/image_raw`| `sensor_msgs/Image` | Input for LOVON |
| `scan` | `sensor_msgs/LaserScan` | Input for Nav2 Costmap |

### **UAV Namespace (`/drone`)**
| Topic | Type | Purpose |
| :--- | :--- | :--- |
| `cmd_vel` | `geometry_msgs/Twist` | Velocity setpoints |
| `mavros/state` | `mavros_msgs/State` | Arming/Mode status |
| `nav/navigate_to_pose` | `Action` | Nav2 wrapper for flight controller |

---

## 5. Sim-to-Real Migration Roadmap

### Phase 1: Simulation (Gazebo)
1.  **Tunnel World:** Generate a `.sdf` world with low-light conditions and cluttered debris.
2.  **Sensor Noise:** Apply Gaussian noise to IMU and Camera plugins in URDF to match real hardware drift.
3.  **Validation:** Robot must achieve >80% Success Rate (SR) finding a "victim" dummy in sim.

### Phase 2: Real Hardware (Passive)
1.  **Network:** Setup 5GHz WiFi bridge. Gemini runs on Laptop, ROS2 Driver runs on Robot.
2.  **Passive LOVON:** Robot moves via manual joystick. LOVON prints "Target Detected" logs but does **not** send velocity commands.
3.  **Safety:** Verify TF tree alignment between real Camera and Base Link.

### Phase 3: Real Hardware (Active Assisted)
1.  **Geofence:** Limit UAV to < 2.0m altitude and Go2 to < 20m range.
2.  **Speed Limit:** Clamp `cmd_vel` to 0.3 m/s.
3.  **Execution:** Allow LOVON to drive the robot, but Operator holds a "Deadman Switch" on the controller to kill power instantly.

---

## 6. Gemini Coordinator Prompt Template

Used in `sar_llm_coordinator/coordinator.py`:

```text
SYSTEM: You are the Mission Commander for a Search & Rescue operation.
Robots available: [Go2-Alpha, Sky-Eye-1]
Capabilities: 
- Go2: Ground traversal, limited height, high obstacle avoidance.
- UAV: Fast scan, high view, limited battery, no contact.

Constraint Checklist:
1. UAV must not enter "unstable" zones defined in map.
2. Go2 requires light verification before entering deep tunnel.
3. If battery < 20%, issue RETURN task immediately.

Output Format: JSON
{
  "tasks": [
    {"robot_id": "go2_01", "action": "nav_to", "params": {"x": 10, "y": 0}, "priority": 1},
    {"robot_id": "uav_01", "action": "lovon_search", "params": {"target": "person"}, "priority": 2}
  ]
}
```
