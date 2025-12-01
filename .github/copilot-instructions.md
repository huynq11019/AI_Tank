# AI Tank - Copilot Instructions

## Project Overview
AI Tank is a real-time tank battle game where two AI bots compete by controlling tanks on a 22x22 grid map. The architecture follows a client-server model with WebSocket communication.

## Architecture

### Component Structure
```
Server/          → Node.js game server (authoritative game state)
  ├── Game.js    → Core game loop (10 ticks/sec), collision, match logic
  ├── Config/    → Enum.js (constants), Setting.js (tank stats, map data)
  └── Objects/   → Tank, Bullet, Base, Obstacle, PowerUp, Strike classes
Bots/            → Bot client templates (implement AI here)
  ├── Javascript/Client.js  → JS bot template with example AI
  └── C++/       → C++ bot template (Visual Studio project)
Observer/        → Browser-based game viewer (60fps interpolated)
NodeWS/          → Custom WebSocket implementation (shared by server/bots)
Arena/           → Place compiled bots (P1.exe/P1.js, P2.exe/P2.js) for matches
```

### Communication Flow
1. Server starts on port 3011, awaits two bot connections with unique keys
2. Bots authenticate via `COMMAND_SEND_KEY`, receive `COMMAND_SEND_TEAM` (TEAM_1 or TEAM_2)
3. Tank placement phase: bots call `PlaceTank(type, x, y)` for 4 tanks
4. Action phase: server sends `COMMAND_REQUEST_CONTROL`, bots respond with commands
5. Binary protocol uses Int8/Int16/Float32 encoding (see `Server/Network.js`)

## Key Constants (from `Server/Config/`)

### Tank Types
| Type | HP | Speed | Damage | Cooldown | Bullet Speed |
|------|-----|-------|--------|----------|--------------|
| TANK_LIGHT (1) | 80 | 0.5 | 50 | 20 loops | 1.2 |
| TANK_MEDIUM (2) | 110 | 0.25 | 40 | 10 loops | 1.0 |
| TANK_HEAVY (3) | 170 | 0.2 | 7 | 2 loops | 0.8 |

### Map Blocks
- `BLOCK_GROUND (0)`, `BLOCK_WATER (1)`, `BLOCK_HARD_OBSTACLE (2)`, `BLOCK_SOFT_OBSTACLE (3)`, `BLOCK_BASE (4)`
- Playable area: 1-20 (border is indestructible obstacles)
- Use `CONVERT_COORD(x, y)` → `y * MAP_W + x` for map array access

### Directions
- `DIRECTION_UP=1`, `DIRECTION_RIGHT=2`, `DIRECTION_DOWN=3`, `DIRECTION_LEFT=4`

## Bot Development

### JavaScript Bot Pattern (`Bots/Javascript/Client.js`)
```javascript
// Tank placement (called once at game start)
function OnPlaceTankRequest() {
    PlaceTank(TANK_LIGHT, 5, 2);  // type, x, y
    PlaceTank(TANK_MEDIUM, 3, 8);
    // ... place 4 tanks total
    SendCommand();  // REQUIRED at end
}

// Main AI loop (called every server tick)
function Update() {
    for (var i = 0; i < NUMBER_OF_TANK; i++) {
        var tank = GetMyTank(i);
        if (tank == null || tank.m_HP == 0) continue;
        CommandTank(i, DIRECTION_RIGHT, true, true); // id, direction, move, shoot
    }
    SendCommand();  // REQUIRED at end
}
```

### C++ Bot Pattern (`Bots/C++/AI_Template/include/ai/AI.h`)
- Implement `PlaceTank()` and `Update()` function pointers
- Use `AI::GetInstance()` for game state access
- Tank commands via `ClientCommand` objects

### Available Bot APIs
- `GetMyTeam()` / `GetOpponentTeam()` - team ID
- `GetMyTank(id)` / `GetEnemyTank(id)` - tank state
- `GetObstacles()`, `GetPowerUpList()`, `GetIncomingStrike()`
- `GetMyBases()` / `GetEnemyBases()` - base positions and HP
- `HasAirstrike()` / `HasEMP()` - check inventory
- `UseAirstrike(x, y)` / `UseEMP(x, y)` - activate power-ups

## Running Matches

### Windows
```batch
# Test bot vs bot (place P1.exe/P1.js and P2.exe/P2.js in Arena/)
P1-vs-P2.bat
```

### macOS (via Run.sh or manual)
```bash
# Terminal 1: Start server
node Server/Server.js -p 3011 -k 30 11 -r Replay/Last.glr

# Terminal 2: Start bot 1
node Bots/Javascript/Client.js -h 127.0.0.1 -p 3011 -k 30

# Terminal 3: Start bot 2
node Bots/Javascript/Client.js -h 127.0.0.1 -p 3011 -k 11

# Open Observer/index.html in browser to watch
```

### Command Line Args
- Server: `-p [port]` `-k [key1] [key2]` `-r [replayFile]`
- Client: `-h [host]` `-p [port]` `-k [key]` `-l [logFile]`

## Game Rules Summary
- Win by destroying enemy main base (400 HP) or all 4 tanks
- Match: 2 min normal + 30 sec sudden death (max 2:30)
- Power-ups spawn every 30 sec on bridges (3 spawn points)
- Airstrike/EMP: 3-unit radius AOE, 10-loop delay after call
- Collision: tanks (1 unit), bases (2 units), bullets (point)
