# 🎮 AI TANK - TÀI LIỆU TRAINING CHO TEAM

## 📁 Cấu Trúc Bot Mới

```
Bots/Javascript/
├── Client.js        # Bot mẫu gốc (random movement)
└── SmartBot.js      # Bot AI thông minh của team ⭐
```

---

## 🚀 Cách Chạy Test

### Test SmartBot vs Bot Gốc
```bash
./TestSmartBot.sh
```

### Test SmartBot vs SmartBot (Mirror Match)
```bash
./TestMirror.sh
```

### Chạy thủ công
```bash
# Terminal 1: Server
node Server/Server.js -p 3011 -k 30 11 -r Replay/Last.glr

# Terminal 2: SmartBot
node Bots/Javascript/SmartBot.js -h 127.0.0.1 -p 3011 -k 30

# Terminal 3: Bot đối thủ (hoặc SmartBot khác)
node Bots/Javascript/Client.js -h 127.0.0.1 -p 3011 -k 11

# Mở Observer/index.html trong browser để xem
```

---

## 🧠 Các Tính Năng Của SmartBot

### 1. BFS Pathfinding
Bot tìm đường đi ngắn nhất tránh vật cản.

```javascript
function BFS(startX, startY, targetX, targetY)
// Trả về mảng các hướng đi [DIRECTION_UP, DIRECTION_RIGHT, ...]
// Trả về null nếu không tìm được đường
```

### 2. Target Prioritization
Hệ thống ưu tiên mục tiêu thông minh:

| Mục tiêu | Priority Score |
|----------|---------------|
| Enemy Main Base | 200 - distance |
| Enemy Tank (HP thấp) | 100 - HP + (20 - distance) |
| Power-up gần | 90 - distance |
| Enemy Side Base | 80 - distance |

### 3. Dodge System
- Tự động né Airstrike/EMP trong bán kính 4 ô
- Phát hiện đạn địch đang bay tới
- Ưu tiên né khi HP thấp

### 4. Tank Roles
Bot tự phân vai cho xe tăng:
- **Attacker**: Tấn công mục tiêu chính
- **Defender**: Heavy tank bảo vệ căn cứ
- **Flanker**: Tấn công từ hướng khác
- **Collector**: Thu thập power-up

### 5. Smart Power-up Usage
- Dùng Airstrike khi >= 2 xe địch gần nhau
- Dùng EMP khi xe địch tập trung
- Target căn cứ địch khi HP < 150

---

## 📊 Thông Số Xe Tăng (Quan Trọng!)

| Loại | HP | Speed | Damage | Cooldown | DPS |
|------|-----|-------|--------|----------|-----|
| **Light** | 80 | 0.5 | 50 | 20 ticks | 25 |
| **Medium** | 110 | 0.25 | 40 | 10 ticks | 40 |
| **Heavy** | 170 | 0.2 | 7 | 2 ticks | 35 |

### Phân tích:
- **Light**: DPS thấp nhất nhưng nhanh nhất → Hit-and-run, collect power-up
- **Medium**: DPS cao nhất, cân bằng → Sát thủ chính
- **Heavy**: HP cao, DPS khá → Tank/chặn đường

---

## 🗺️ Bản Đồ 22x22

```
Legend:
2 = Hard Obstacle (không phá được)
3 = Soft Obstacle (phá được)
4 = Base
1 = Water (không đi được)
0 = Ground (đi được)

Vùng chơi: x,y từ 1-20 (viền là tường)
```

### Vị Trí Quan Trọng:
- **Căn cứ chính TEAM_1**: (1.5, 10.5) - Bên trái
- **Căn cứ chính TEAM_2**: (19.5, 10.5) - Bên phải
- **Power-up spawn**: (10.5, 1.5), (10.5, 10.5), (10.5, 19.5) - Cầu giữa

### Mô Tả Chi Tiết Bản Đồ
- **Viền cứng**: Hàng rào `2` bao xung quanh (tọa độ 0 và 21) tạo biên không thể phá.
- **Vùng nước**: Ô `1` nằm dọc trục x = 10 và x = 11 gây nghẽn nhẹ ở trung tâm, buộc xe đi vòng cầu.
- **Chướng ngại mềm**: Cụm số `3` tạo thành vòng bảo vệ quanh mỗi căn cứ chính (ví dụ cụm C16, C17 ở giữa bản đồ). Các ô này phá được nên cần dọn đường trước khi áp sát base.
- **Chướng ngại cứng**: Các cột `2` lớn ở bốn góc vùng chơi (C0, C4, C24, C28) tạo choke point, thích hợp đặt Heavy để chặn lane.
- **Căn cứ phụ**: Ô `4` vàng nằm sát mỗi cụm soft obstacle giúp phòng thủ hai bên mid; phá được để giành lợi thế điểm nếu trận kéo dài.
- **Lane chính**: Trên (y ≈ 3), giữa (y ≈ 10) và dưới (y ≈ 17). Lane giữa rộng nhất nhưng dễ bị camp từ cầu nên cần scout bằng Light tank.

Mô tả bản đồ: 

    0	1	2	3	4	5	6	7	8	9	10	11	12	13	14	15	16	17	18	19	20	21	
0	2	2	2	2	2	2	2	2	2	2	2	2	2	2	2	2	2	2	2	2	2	2	0
1	2	C0	0	0	0	C1	0	0	C2	0	0	0	C3	0	0	0	C4	0	0	0	C5	2	1
2	2	0	2	2	2	5	3	3	0	0	0	0	0	0	3	3	0	2	2	2	0	2	2
3	2	0	2	4	4	0	3	3	0	0	1	1	0	0	3	3	0	4	4	2	0	2	3
4	2	0	2	4	4	0	3	3	0	0	1	1	0	0	3	3	6	4	4	2	0	2	4
5	2	0	0	0	0	0	3	3	0	0	1	1	0	0	3	3	0	0	0	0	0	2	5
6	2	C6	0	0	0	C7	0	0	C8	0	1	1	C9	0	0	0	C10	0	0	0	C11	2	6
7	2	M	0	0	0	0	0	0	0	0	1	1	0	0	0	0	0	0	0	0	0	2	7
8	2	0	0	5	0	0	0	2	0	0	1	1	0	0	2	0	0	6	0	0	0	2	8
9	2	3	3	3	0	0	0	2	0	0	0	0	0	0	2	0	0	0	3	3	3	2	9
10	2	4	4	3	0	C13	5	2	C14	0	0	0	C15	0	2	0	C16	0	3	4	4	2	10
11	2	4	4	3	0	0	0	2	0	0	0	0	0	0	2	0	0	0	3	4	4	2	11
12	2	3	3	3	0	0	0	2	0	0	0	0	0	0	2	0	0	0	3	3	3	2	12
13	2	0	0	0	0	0	0	2	0	0	1	1	0	0	2	0	0	6	0	0	0	2	13
14	2	0	0	0	5	0	0	0	0	0	1	1	0	0	0	0	0	0	0	0	0	2	14
15	2	C18	0	0	0	C19	0	0	C20	0	1	1	C21	0	0	0	C22	0	0	0	C23	2	15
16	2	0	0	0	0	0	3	3	0	0	1	1	0	0	3	3	0	0	0	0	0	2	16
17	2	0	2	4	4	0	3	3	0	0	1	1	0	0	3	3	0	4	4	2	0	2	17
18	2	0	2	4	4	0	3	3	0	0	1	1	0	0	3	3	0	4	4	2	0	2	18
19	2	0	2	2	2	0	3	3	0	0	0	0	0	0	3	3	6	2	2	2	0	2	19
20	2	C24	0	0	0	C25	0	0	C26	0	0	0	C27	0	0	0	C28	0	0	0	C29	2	20
21	2	2	2	2	2	2	2	2	2	2	2	2	2	2	2	2	2	2	2	2	2	2	21
    0	1	2	3	4	5	6	7	8	9	10	11	12	13	14	15	16	17	18	19	20	21	
---

## 🎯 Chiến Thuật Đặt Xe (Trong SmartBot)

### TEAM 1 (Trái → Phải):
```javascript
PlaceTank(TANK_MEDIUM, 5, 1);   // Đường trên - DPS cao
PlaceTank(TANK_LIGHT, 4, 7);    // Giữa trên - cơ động
PlaceTank(TANK_LIGHT, 4, 14);   // Giữa dưới - cơ động
PlaceTank(TANK_HEAVY, 5, 20);   // Đường dưới - tank
```

### TEAM 2 (Phải → Trái):
```javascript
PlaceTank(TANK_MEDIUM, 16, 1);  // Đường trên
PlaceTank(TANK_LIGHT, 17, 7);   // Giữa trên
PlaceTank(TANK_LIGHT, 17, 14);  // Giữa dưới
PlaceTank(TANK_HEAVY, 16, 20);  // Đường dưới
```

---

## 🛠️ Hướng Dẫn Tùy Chỉnh

### Thay đổi ưu tiên mục tiêu
Trong hàm `findBestTarget()`:
```javascript
// Tăng priority cho căn cứ chính (rush strat)
var priority = (base.m_type == BASE_MAIN) ? 300 - dist : 80 - dist;
```

### Thay đổi chiến thuật đặt xe
Trong hàm `OnPlaceTankRequest()`:
```javascript
// Thử full Light (aggressive)
PlaceTank(TANK_LIGHT, 5, 1);
PlaceTank(TANK_LIGHT, 4, 7);
PlaceTank(TANK_LIGHT, 4, 14);
PlaceTank(TANK_LIGHT, 5, 20);
```

### Thay đổi độ nhạy né đạn
Trong hàm `detectIncomingBullet()`:
```javascript
// Luôn né (defensive)
if (bulletDodge) { // Bỏ điều kiện && tank.m_HP < 50
```

---

## 📝 Checklist Trước Thi Đấu

- [ ] Test SmartBot vs Client.js nhiều trận
- [ ] Test SmartBot vs SmartBot (mirror)
- [ ] Điều chỉnh vị trí đặt xe nếu cần
- [ ] Điều chỉnh priority mục tiêu
- [ ] Test với các chiến thuật khác nhau
- [ ] Backup code trước khi thay đổi

---

## 🐛 Debug Tips

### Thêm log để theo dõi:
```javascript
console.log("Tank " + i + " targeting: " + target.type + " at " + target.x + "," + target.y);
console.log("Tank " + i + " HP: " + tank.m_HP + " Cooldown: " + tank.m_coolDown);
```

### Chạy với log file:
```bash
node Bots/Javascript/SmartBot.js -h 127.0.0.1 -p 3011 -k 30 -l debug.log
```

---

## 📅 Lịch Training

| Ngày | Mục tiêu |
|------|----------|
| Ngày 1-2 | Hiểu code, test SmartBot |
| Ngày 3-4 | Tùy chỉnh chiến thuật |
| Ngày 5 | Đấu thử, rút kinh nghiệm |
| Ngày 6-9 | Cải thiện dựa trên đấu thử |
| Ngày 10-12 | Polish & sẵn sàng thi |

---

## 🎯 HƯỚNG DẪN TUNING & NÂNG CAO TỶ LỆ THẮNG

### 📊 Phân Tích Meta Game

#### Hiểu Rõ Cơ Chế Thắng

| Điều kiện | Ưu tiên | Chiến thuật |
|-----------|---------|-------------|
| Phá căn cứ chính địch (400 HP) | ⭐⭐⭐⭐⭐ | Rush strategy |
| Tiêu diệt 4 xe địch | ⭐⭐⭐⭐ | Kill strategy |
| Nhiều side base hơn (hết giờ) | ⭐⭐⭐ | Control strategy |
| Nhiều tank sống (sudden death) | ⭐⭐ | Survival strategy |

---

### 🔧 A. TUNING VỊ TRÍ ĐẶT XE

Yếu tố **CỰC KỲ QUAN TRỌNG** quyết định 30% thắng thua!

#### Nguyên tắc đặt xe:
```
1. Không đặt chồng chéo
2. Đặt gần đường đi chính (không bị block)
3. Cover cả 3 lane (trên, giữa, dưới)
4. Ít nhất 1 xe bảo vệ base
```

#### Formation 1: Aggressive Rush (TEAM_1)
```javascript
// Tập trung đường giữa, rush nhanh
PlaceTank(TANK_LIGHT, 5, 9);    // Rush giữa trên
PlaceTank(TANK_LIGHT, 5, 12);   // Rush giữa dưới
PlaceTank(TANK_MEDIUM, 4, 10);  // Main DPS giữa
PlaceTank(TANK_MEDIUM, 4, 11);  // Support DPS
```

#### Formation 2: Balanced (TEAM_1)
```javascript
// Chia đều 3 lane
PlaceTank(TANK_LIGHT, 5, 1);    // Lane trên - scout
PlaceTank(TANK_MEDIUM, 5, 10);  // Lane giữa - main
PlaceTank(TANK_MEDIUM, 5, 11);  // Lane giữa - support
PlaceTank(TANK_HEAVY, 5, 20);   // Lane dưới - tank
```

#### Formation 3: Defensive (TEAM_1)
```javascript
// Bảo vệ base, counter attack
PlaceTank(TANK_HEAVY, 3, 9);    // Guard base trên
PlaceTank(TANK_HEAVY, 3, 12);   // Guard base dưới
PlaceTank(TANK_MEDIUM, 5, 5);   // Counter top
PlaceTank(TANK_MEDIUM, 5, 16);  // Counter bot
```

---

### 🔧 B. TUNING ƯU TIÊN MỤC TIÊU

Mở file `SmartBot.js`, tìm hàm `findBestTarget()`:

#### Strategy 1: Rush Base (Khuyến nghị cho trận ngắn)
```javascript
// PRIORITY 1: Enemy main base - RẤT CAO
var priority = (base.m_type == BASE_MAIN) ? 500 - dist : 80 - dist;

// PRIORITY 2: Chỉ đánh tank nếu gần (< 5 ô)
if (dist < 5) {
    targets.push({
        type: 'tank',
        priority: 150 - dist,
        // ...
    });
}
```

#### Strategy 2: Kill First (An toàn hơn)
```javascript
// Tank địch - priority cao
var priority = 200 - enemy.m_HP/2 + (15 - dist) * 2;
// Base địch - priority thấp hơn
var priority = (base.m_type == BASE_MAIN) ? 150 - dist : 50 - dist;
```

#### Strategy 3: Adaptive (Thông minh nhất)
```javascript
// Đếm xe địch còn sống
var enemyAlive = 0;
for (var i = 0; i < NUMBER_OF_TANK; i++) {
    if (GetEnemyTank(i) && GetEnemyTank(i).m_HP > 0) enemyAlive++;
}
// Nếu địch còn <= 2 xe -> Rush base
var baseMultiplier = (enemyAlive <= 2) ? 3 : 1;
```

---

### 🔧 C. TUNING SHOOTING LOGIC

#### Cải thiện độ chính xác bắn:
```javascript
function shouldShoot(tank, target) {
    // Tolerance dựa trên kích thước target
    var tolerance = (target.type == 'base') ? 1.5 : 0.8;
    
    // Kiểm tra line of sight (không có vật cản)
    if (Math.abs(dy) < tolerance && dx > 0) {
        if (tank.m_direction == DIRECTION_RIGHT && 
            !hasObstacleBetween(tank.m_x, tank.m_y, target.x, target.y)) {
            inLineOfFire = true;
        }
    }
    // ... tương tự cho các hướng khác
}

// Hàm kiểm tra vật cản giữa 2 điểm
function hasObstacleBetween(x1, y1, x2, y2) {
    var dx = Math.sign(x2 - x1);
    var dy = Math.sign(y2 - y1);
    var x = Math.floor(x1) + dx;
    var y = Math.floor(y1) + dy;
    
    while (x != Math.floor(x2) || y != Math.floor(y2)) {
        var tile = GetTileAt(x, y);
        if (tile == BLOCK_HARD_OBSTACLE || tile == BLOCK_SOFT_OBSTACLE) {
            return true;
        }
        x += dx;
        y += dy;
    }
    return false;
}
```

---

### 🔧 D. TUNING NÉ ĐẠN NÂNG CAO

```javascript
function predictBulletHit(bullet, tank) {
    var bx = bullet.m_x, by = bullet.m_y;
    var tx = tank.m_x, ty = tank.m_y;
    
    // Dự đoán trajectory trong 20 ticks
    for (var t = 1; t <= 20; t++) {
        if (bullet.m_direction == DIRECTION_UP) by -= bullet.m_speed;
        else if (bullet.m_direction == DIRECTION_DOWN) by += bullet.m_speed;
        else if (bullet.m_direction == DIRECTION_LEFT) bx -= bullet.m_speed;
        else if (bullet.m_direction == DIRECTION_RIGHT) bx += bullet.m_speed;
        
        // Check collision với tank (hitbox 1x1)
        if (Math.abs(bx - tx) < 1 && Math.abs(by - ty) < 1) {
            return t; // Thời gian đạn sẽ trúng
        }
        
        // Dừng nếu đạn ra ngoài map hoặc chạm obstacle
        if (bx < 1 || bx > 20 || by < 1 || by > 20) break;
        if (isBlocked(bx, by)) break;
    }
    return null;
}
```

---

### 🔧 E. TUNING POWER-UP STRATEGY

```javascript
function usePowerUpSmart() {
    // STRATEGY 1: Finish base nếu HP thấp (<= 60)
    if (mainBase && mainBase.m_HP <= 60 && HasAirstrike()) {
        UseAirstrike(mainBase.m_x, mainBase.m_y);
        return;
    }
    
    // STRATEGY 2: Hit cluster >= 2 enemies
    var cluster = findEnemyCluster();
    if (cluster && cluster.count >= 2) {
        if (HasAirstrike()) UseAirstrike(cluster.x, cluster.y);
        else if (HasEMP()) UseEMP(cluster.x, cluster.y);
        return;
    }
    
    // STRATEGY 3: Defensive EMP - freeze enemy rushing our base
    for (var i = 0; i < NUMBER_OF_TANK; i++) {
        var enemy = GetEnemyTank(i);
        if (!enemy || enemy.m_HP == 0) continue;
        
        var distToBase = distance(enemy.m_x, enemy.m_y, myMainBase.m_x, myMainBase.m_y);
        if (distToBase < 4 && HasEMP()) {
            UseEMP(enemy.m_x, enemy.m_y);
            return;
        }
    }
}
```

---

### 📈 MẸO NÂNG CAO

#### 1. Kiting (Hit and Run) - Cho tank Light
```javascript
// Bắn rồi chạy khi đang cooldown
if (tank.m_coolDown > 0 && dist < 4) {
    var retreatDir = getDirectionAway(tank, target);
    return { direction: retreatDir, move: true, shoot: false };
}
```

#### 2. Focus Fire (Tập trung hỏa lực)
```javascript
// Tất cả tank cùng đánh 1 mục tiêu yếu nhất
var globalTarget = null;
function getGlobalTarget() {
    // Tìm enemy có HP thấp nhất
    var weakest = null, lowestHP = 999;
    for (var i = 0; i < NUMBER_OF_TANK; i++) {
        var enemy = GetEnemyTank(i);
        if (enemy && enemy.m_HP > 0 && enemy.m_HP < lowestHP) {
            lowestHP = enemy.m_HP;
            weakest = enemy;
        }
    }
    return weakest;
}
```

#### 3. Lane Control
```javascript
// Phân công xe theo lane
var laneAssignments = {
    0: 0, // Tank 0 -> top lane (y < 7)
    1: 1, // Tank 1 -> mid lane (7 <= y <= 14)
    2: 1, // Tank 2 -> mid lane
    3: 2  // Tank 3 -> bot lane (y > 14)
};
```

---

### 🎮 TRAINING EXERCISES

#### Bài tập 1: Thử các formation
1. Chạy 10 trận với Formation Aggressive
2. Chạy 10 trận với Formation Balanced
3. Chạy 10 trận với Formation Defensive
4. So sánh tỷ lệ thắng

#### Bài tập 2: Tuning priority
1. Test Rush Base strategy (priority base = 500)
2. Test Kill First strategy (priority tank = 200)
3. Test Adaptive strategy
4. Ghi chú kết quả

#### Bài tập 3: Phân tích replay
1. Xem replay ở `Observer/indexReplay.html`
2. Load file `Replay/Last.glr`
3. Tìm lỗi: Xe bị stuck? Bắn hụt? Không né?
4. Fix từng lỗi

---

### 📋 CHECKLIST OPTIMIZATION

- [ ] Vị trí đặt xe cover 3 lane
- [ ] Priority mục tiêu phù hợp chiến thuật
- [ ] Shooting logic có check line of sight
- [ ] Dodge system hoạt động
- [ ] Power-up không lãng phí
- [ ] Không có xe bị stuck
- [ ] Focus fire khi cần
- [ ] Có chiến thuật rõ ràng

---

### 🏆 META TIPS TỪ KINH NGHIỆM

1. **TANK_MEDIUM là OP** - DPS 40, cao nhất game
2. **Rush mid lane** thường hiệu quả vì đường ngắn nhất
3. **Power-up spawn ở cầu** - control cầu giữa = control game
4. **2 phút rất ngắn** - cần aggressive play
5. **Sudden death removes obstacles** - thay đổi chiến thuật khi vào SD
6. **Friendly fire có thật** - cẩn thận Airstrike/EMP trúng quân mình

---

**Chúc team thành công! 🏆**
