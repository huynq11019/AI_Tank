# 🎮 AI Tank - Hướng dẫn sử dụng chi tiết

## 📋 Mục lục
- [Tổng quan dự án](#tổng-quan-dự-án)
- [Cấu trúc thư mục](#cấu-trúc-thư-mục)
- [Hướng dẫn chạy trận đấu](#hướng-dẫn-chạy-trận-đấu)
- [Lập trình Bot AI](#lập-trình-bot-ai)
- [Thông số Game](#thông-số-game)
- [API Reference](#api-reference)
- [Lưu ý quan trọng](#lưu-ý-quan-trọng)
- [Tips phát triển AI](#tips-phát-triển-ai)

---

## Tổng quan dự án

AI Tank là một **game đối kháng xe tăng AI** theo thời gian thực, nơi 2 bot AI điều khiển đội xe tăng trên bản đồ 22x22 ô.

### Đặc điểm chính
- 🏆 **Mục tiêu**: Phá căn cứ địch hoặc tiêu diệt toàn bộ xe tăng đối phương
- ⏱️ **Thời gian**: 2 phút thường + 30 giây sudden death (tối đa 2:30)
- 🚗 **Số xe tăng**: Mỗi đội có 4 xe tăng
- 🔄 **Game loop**: 10 ticks/giây

### Kiến trúc hệ thống
```
┌─────────────┐     WebSocket      ┌─────────────┐
│   Bot 1     │◄──────────────────►│             │
│ (AI Player) │                    │   Server    │
└─────────────┘                    │  (Node.js)  │
                                   │             │
┌─────────────┐     WebSocket      │  Game Loop  │
│   Bot 2     │◄──────────────────►│  Collision  │
│ (AI Player) │                    │   Logic     │
└─────────────┘                    └──────┬──────┘
                                          │
                                   ┌──────▼──────┐
                                   │  Observer   │
                                   │  (Browser)  │
                                   └─────────────┘
```

---

## Cấu trúc thư mục

```
AI_Tank/
├── Server/                 # Game server Node.js
│   ├── Server.js          # Entry point
│   ├── Game.js            # Core game loop (10 ticks/sec)
│   ├── Network.js         # Binary protocol
│   ├── Config/
│   │   ├── Enum.js        # Hằng số (directions, block types...)
│   │   └── Setting.js     # Tank stats, map data
│   └── Objects/           # Game entities
│       ├── Tank.js
│       ├── Bullet.js
│       ├── Base.js
│       ├── Obstacle.js
│       ├── PowerUp.js
│       └── Strike.js
│
├── Bots/                   # Bot templates
│   ├── Javascript/
│   │   └── Client.js      # JavaScript bot template ⭐
│   └── C++/
│       └── C++Template/   # C++ bot template (Visual Studio)
│
├── Observer/               # Giao diện xem trận đấu
│   ├── index.html         # Live viewer
│   └── indexReplay.html   # Replay viewer
│
├── Arena/                  # Nơi đặt bot để chạy trận
│
├── NodeWS/                 # Thư viện WebSocket
│
├── Media/BFS/             # Code mẫu thuật toán BFS
│
└── Run.sh                 # Script chạy trận (macOS/Linux)
```

---

## Hướng dẫn chạy trận đấu

### 🍎 Trên macOS/Linux

#### Cách 1: Chạy thủ công (khuyến nghị để debug)

**Terminal 1 - Khởi động Server:**
```bash
cd /path/to/AI_Tank
node Server/Server.js -p 3011 -k 30 11 -r Replay/Last.glr
```

**Terminal 2 - Chạy Bot 1:**
```bash
node Bots/Javascript/Client.js -h 127.0.0.1 -p 3011 -k 30
```

**Terminal 3 - Chạy Bot 2:**
```bash
node Bots/Javascript/Client.js -h 127.0.0.1 -p 3011 -k 11
```

**Xem trận đấu:**
- Mở file `Observer/index.html` trong trình duyệt

#### Cách 2: Dùng script
```bash
chmod +x Run.sh
./Run.sh
```

### 🪟 Trên Windows

Sử dụng các file `.bat` có sẵn:
- `Javascript Bot Versus Itself.bat` - JS bot tự đấu
- `Javascript Bot Versus C++.bat` - JS vs C++ bot
- `P1-vs-P2.bat` - Chạy bot trong thư mục Arena

### Tham số Command Line

#### Server
| Tham số | Mô tả | Ví dụ |
|---------|-------|-------|
| `-p` | Port | `-p 3011` |
| `-k` | Keys cho 2 bot | `-k 30 11` |
| `-r` | File lưu replay | `-r Replay/Last.glr` |

#### Bot Client
| Tham số | Mô tả | Ví dụ |
|---------|-------|-------|
| `-h` | Host address | `-h 127.0.0.1` |
| `-p` | Port | `-p 3011` |
| `-k` | Key xác thực | `-k 30` |
| `-l` | File log | `-l bot.log` |

---

## Lập trình Bot AI

### Cấu trúc Bot JavaScript

File: `Bots/Javascript/Client.js`

```javascript
// ============================================
// HÀM 1: Đặt xe tăng đầu game (gọi 1 lần)
// ============================================
function OnPlaceTankRequest() {
    // Đặt 4 xe tăng với loại và vị trí
    PlaceTank(TANK_LIGHT, 5, 2);    // Xe nhẹ tại (5, 2)
    PlaceTank(TANK_MEDIUM, 3, 8);   // Xe trung tại (3, 8)
    PlaceTank(TANK_HEAVY, 10, 5);   // Xe nặng tại (10, 5)
    PlaceTank(TANK_LIGHT, 15, 3);   // Xe nhẹ tại (15, 3)
    
    SendCommand();  // ⚠️ BẮT BUỘC gọi cuối hàm
}

// ============================================
// HÀM 2: Logic AI chính (gọi mỗi server tick)
// ============================================
function Update() {
    // Lặp qua 4 xe tăng của mình
    for (var i = 0; i < NUMBER_OF_TANK; i++) {
        var tank = GetMyTank(i);
        
        // Kiểm tra xe còn sống
        if (tank == null || tank.m_HP == 0) continue;
        
        // Ra lệnh cho xe tăng
        // CommandTank(id, hướng, có_di_chuyển, có_bắn)
        CommandTank(i, DIRECTION_RIGHT, true, true);
    }
    
    SendCommand();  // ⚠️ BẮT BUỘC gọi cuối hàm
}
```

### Cấu trúc Bot C++

File: `Bots/C++/C++Template/AI_Template/include/ai/AI.h`

```cpp
// Implement trong class AI
void PlaceTank() {
    // Đặt xe tăng
    m_PlaceTankCommands.push_back(PlaceTankCommand(TANK_LIGHT, 5, 2));
    m_PlaceTankCommands.push_back(PlaceTankCommand(TANK_MEDIUM, 3, 8));
    // ...
}

void Update() {
    // Logic AI
    for (int i = 0; i < NUMBER_OF_TANK; i++) {
        Tank* tank = GetMyTank(i);
        if (tank == nullptr || tank->m_HP == 0) continue;
        
        // Tạo command
        ClientCommand cmd;
        cmd.m_TankId = i;
        cmd.m_Direction = DIRECTION_RIGHT;
        cmd.m_IsMove = true;
        cmd.m_IsShoot = true;
        m_Commands.push_back(cmd);
    }
}
```

---

## Thông số Game

### Loại xe tăng

| Loại | Constant | HP | Tốc độ | Sát thương | Cooldown | Tốc độ đạn |
|------|----------|-----|--------|------------|----------|------------|
| Nhẹ | `TANK_LIGHT (1)` | 80 | 0.5 | 50 | 20 ticks | 1.2 |
| Trung | `TANK_MEDIUM (2)` | 110 | 0.25 | 40 | 10 ticks | 1.0 |
| Nặng | `TANK_HEAVY (3)` | 170 | 0.2 | 7 | 2 ticks | 0.8 |

### Đặc điểm từng loại xe

| Loại | Ưu điểm | Nhược điểm | Chiến thuật |
|------|---------|------------|-------------|
| **Light** | Nhanh, sát thương cao | HP thấp | Rush, hit-and-run |
| **Medium** | Cân bằng | Không nổi bật | Đa năng |
| **Heavy** | HP cao, bắn nhanh | Chậm, damage/hit thấp | Tank, chặn đường |

### Loại ô bản đồ

| Constant | Giá trị | Mô tả | Đi được? | Phá được? |
|----------|---------|-------|----------|-----------|
| `BLOCK_GROUND` | 0 | Đất trống | ✅ | - |
| `BLOCK_WATER` | 1 | Nước | ❌ | ❌ |
| `BLOCK_HARD_OBSTACLE` | 2 | Vật cản cứng | ❌ | ❌ |
| `BLOCK_SOFT_OBSTACLE` | 3 | Vật cản mềm | ❌ | ✅ |
| `BLOCK_BASE` | 4 | Căn cứ | ❌ | ✅ |

### Hướng di chuyển

| Constant | Giá trị | Mô tả |
|----------|---------|-------|
| `DIRECTION_UP` | 1 | Lên (y giảm) |
| `DIRECTION_RIGHT` | 2 | Phải (x tăng) |
| `DIRECTION_DOWN` | 3 | Xuống (y tăng) |
| `DIRECTION_LEFT` | 4 | Trái (x giảm) |

### Bản đồ

- **Kích thước**: 22 x 22 ô
- **Vùng chơi**: Tọa độ 1-20 (viền là vật cản không phá được)
- **Công thức truy cập**: `map[y * MAP_WIDTH + x]` hoặc `CONVERT_COORD(x, y)`

### Căn cứ (Base)

| Thuộc tính | Giá trị |
|------------|---------|
| HP căn cứ chính | 400 |
| Kích thước | 2 x 2 ô |

### Power-ups

| Loại | Hiệu ứng | Bán kính | Delay |
|------|----------|----------|-------|
| **Airstrike** | Gây sát thương vùng | 3 ô | 10 ticks |
| **EMP** | Làm tê liệt | 3 ô | 10 ticks |

- Spawn mỗi 30 giây tại 3 điểm cầu trên bản đồ

---

## API Reference

### Thông tin đội

```javascript
GetMyTeam()           // Trả về ID đội mình (TEAM_1 hoặc TEAM_2)
GetOpponentTeam()     // Trả về ID đội địch
```

### Thông tin xe tăng

```javascript
GetMyTank(id)         // Lấy xe tăng mình theo id (0-3)
GetEnemyTank(id)      // Lấy xe tăng địch theo id (0-3)
```

**Thuộc tính Tank:**
```javascript
tank.m_X              // Tọa độ X
tank.m_Y              // Tọa độ Y
tank.m_HP             // Máu hiện tại
tank.m_Direction      // Hướng đang quay
tank.m_Type           // Loại xe (LIGHT/MEDIUM/HEAVY)
tank.m_Cooldown       // Thời gian chờ bắn còn lại
```

### Thông tin bản đồ

```javascript
GetObstacles()        // Danh sách vật cản [{m_X, m_Y, m_Type, m_HP}]
GetPowerUpList()      // Danh sách power-up [{m_X, m_Y, m_Type}]
GetIncomingStrike()   // Các đợt không kích sắp tới [{m_X, m_Y, m_RemainingLoop}]
```

### Thông tin căn cứ

```javascript
GetMyBases()          // Danh sách căn cứ mình [{m_X, m_Y, m_HP}]
GetEnemyBases()       // Danh sách căn cứ địch
```

### Điều khiển xe tăng

```javascript
// Đặt xe tăng (chỉ dùng trong OnPlaceTankRequest)
PlaceTank(type, x, y)
// - type: TANK_LIGHT, TANK_MEDIUM, TANK_HEAVY
// - x, y: Tọa độ đặt (1-20)

// Ra lệnh xe tăng (dùng trong Update)
CommandTank(tankId, direction, isMove, isShoot)
// - tankId: 0-3
// - direction: DIRECTION_UP/RIGHT/DOWN/LEFT
// - isMove: true/false - có di chuyển không
// - isShoot: true/false - có bắn không
```

### Power-up

```javascript
HasAirstrike()        // Kiểm tra có Airstrike không
HasEMP()              // Kiểm tra có EMP không
UseAirstrike(x, y)    // Sử dụng Airstrike tại (x, y)
UseEMP(x, y)          // Sử dụng EMP tại (x, y)
```

### Gửi lệnh

```javascript
SendCommand()         // ⚠️ BẮT BUỘC gọi cuối mỗi hàm
```

---

## Lưu ý quan trọng

### ⚠️ 1. Luôn gọi `SendCommand()`

```javascript
function Update() {
    // ... logic của bạn ...
    
    SendCommand();  // ❌ KHÔNG ĐƯỢC QUÊN DÒNG NÀY!
}

function OnPlaceTankRequest() {
    // ... đặt xe tăng ...
    
    SendCommand();  // ❌ KHÔNG ĐƯỢC QUÊN DÒNG NÀY!
}
```

### ⚠️ 2. Kiểm tra xe tăng còn sống

```javascript
var tank = GetMyTank(i);

// LUÔN kiểm tra trước khi xử lý
if (tank == null) continue;      // Xe không tồn tại
if (tank.m_HP == 0) continue;    // Xe đã chết
```

### ⚠️ 3. Vùng đặt xe hợp lệ

- Tọa độ: 1 ≤ x, y ≤ 20
- Không đặt trùng vị trí
- Không đặt lên vật cản, nước, căn cứ

### ⚠️ 4. Collision Detection

| Object | Kích thước |
|--------|------------|
| Xe tăng | 1 x 1 ô |
| Căn cứ | 2 x 2 ô |
| Đạn | Điểm (0 x 0) |

### ⚠️ 5. Cooldown bắn

- Xe không thể bắn liên tục
- Phải đợi hết cooldown
- Kiểm tra: `tank.m_Cooldown == 0`

### ⚠️ 6. Điều kiện kết thúc game

| Điều kiện | Kết quả |
|-----------|---------|
| Phá căn cứ chính địch | Thắng |
| Tiêu diệt 4 xe tăng địch | Thắng |
| Hết giờ | Tính điểm hoặc hòa |

---

## Tips phát triển AI

### 🎯 Chiến lược cơ bản

1. **Bắt đầu đơn giản**
   - Di chuyển ngẫu nhiên
   - Bắn liên tục khi có thể
   - Test và đảm bảo hoạt động

2. **Thêm tìm đường (Pathfinding)**
   - Implement BFS hoặc A*
   - Xem code mẫu trong `Media/BFS/main.cpp`
   - Né vật cản và nước

3. **Target prioritization**
   ```
   Ưu tiên cao → Căn cứ chính địch
                 Xe tăng địch HP thấp
                 Xe tăng địch gần nhất
                 Power-ups
   Ưu tiên thấp → Di chuyển an toàn
   ```

### 🛡️ Chiến thuật phòng thủ

- Theo dõi `GetIncomingStrike()` để né không kích
- Không dồn xe vào 1 chỗ (dễ bị AoE)
- Giữ ít nhất 1 xe bảo vệ căn cứ

### ⚔️ Chiến thuật tấn công

- Tập trung hỏa lực vào 1 mục tiêu
- Dùng xe Heavy chặn đường, Light tấn công
- Collect power-up khi có thể

### 🔧 Debug tips

```javascript
// In log để debug
console.log("Tank " + i + " position: " + tank.m_X + ", " + tank.m_Y);
console.log("Tank " + i + " HP: " + tank.m_HP);
```

### 📊 Thuật toán tìm đường BFS

```javascript
function BFS(startX, startY, targetX, targetY) {
    var queue = [{x: startX, y: startY, path: []}];
    var visited = {};
    
    var directions = [
        {dx: 0, dy: -1, dir: DIRECTION_UP},
        {dx: 1, dy: 0, dir: DIRECTION_RIGHT},
        {dx: 0, dy: 1, dir: DIRECTION_DOWN},
        {dx: -1, dy: 0, dir: DIRECTION_LEFT}
    ];
    
    while (queue.length > 0) {
        var current = queue.shift();
        var key = current.x + "," + current.y;
        
        if (visited[key]) continue;
        visited[key] = true;
        
        if (current.x == targetX && current.y == targetY) {
            return current.path;
        }
        
        for (var d of directions) {
            var nx = current.x + d.dx;
            var ny = current.y + d.dy;
            
            if (isWalkable(nx, ny)) {
                queue.push({
                    x: nx,
                    y: ny,
                    path: current.path.concat([d.dir])
                });
            }
        }
    }
    
    return null; // Không tìm được đường
}
```

---

## Xem Replay

1. Sau khi chạy trận, replay được lưu tại `Replay/Last.glr`
2. Mở `Observer/indexReplay.html` trong trình duyệt
3. Load file replay để xem lại trận đấu

---

## Troubleshooting

| Vấn đề | Giải pháp |
|--------|-----------|
| Bot không kết nối được | Kiểm tra port và key đúng chưa |
| Xe tăng không di chuyển | Đảm bảo gọi `SendCommand()` |
| Game không hiển thị | Mở `Observer/index.html` sau khi 2 bot kết nối |
| Bot bị disconnect | Kiểm tra không có lỗi runtime trong code |

---

## Liên hệ & Tài liệu

- **Code mẫu BFS**: `Media/BFS/main.cpp`
- **Bot template JS**: `Bots/Javascript/Client.js`
- **Bot template C++**: `Bots/C++/C++Template/`
- **Config game**: `Server/Config/`

---

*Chúc bạn phát triển AI thành công! 🚀*
