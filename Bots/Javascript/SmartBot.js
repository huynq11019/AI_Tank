// ====================================================================================
//                           SMART BOT - AI TANK CONTEST
//                        Created by AI Tank Training Coach
// ====================================================================================
// Bot này được thiết kế cho team tuyển thủ với các tính năng:
// 1. BFS Pathfinding - Tìm đường thông minh
// 2. Target Prioritization - Ưu tiên mục tiêu
// 3. Dodge System - Né airstrike/EMP
// 4. Smart Shooting - Bắn có tính toán
// 5. Power-up Strategy - Chiến thuật power-up
// ====================================================================================



// ====================================================================================
//       THE CONSTANT. YOU'RE GONNA NEED THIS. MARK THIS FOR LATER REFERENCE
// ====================================================================================
var STATE_WAITING_FOR_PLAYERS = 0;
var STATE_TANK_PLACEMENT = 1;
var STATE_ACTION = 2;
var STATE_SUDDEN_DEATH = 3;
var STATE_FINISHED = 4;

var TEAM_1 = 1;
var TEAM_2 = 2;

var MAP_W = 22;
var MAP_H = 22;

var BLOCK_GROUND = 0;
var BLOCK_WATER = 1;
var BLOCK_HARD_OBSTACLE = 2;
var BLOCK_SOFT_OBSTACLE = 3;
var BLOCK_BASE = 4;

var TANK_LIGHT = 1;
var TANK_MEDIUM = 2;
var TANK_HEAVY = 3;

var DIRECTION_UP = 1;
var DIRECTION_RIGHT = 2;
var DIRECTION_DOWN = 3;
var DIRECTION_LEFT = 4;

var NUMBER_OF_TANK = 4;

var BASE_MAIN = 1;
var BASE_SIDE = 2;

var MATCH_RESULT_NOT_FINISH = 0;
var MATCH_RESULT_TEAM_1_WIN = 1;
var MATCH_RESULT_TEAM_2_WIN = 2;
var MATCH_RESULT_DRAW = 3;
var MATCH_RESULT_BAD_DRAW = 4;

var POWERUP_AIRSTRIKE = 1;
var POWERUP_EMP = 2;

var TANK_SIZE = 1;
var BASE_SIZE = 2;

// Tank stats for reference
var TANK_STATS = {
	[TANK_LIGHT]: { hp: 80, speed: 0.5, damage: 50, cooldown: 20, bulletSpeed: 1.2 },
	[TANK_MEDIUM]: { hp: 110, speed: 0.25, damage: 40, cooldown: 10, bulletSpeed: 1.0 },
	[TANK_HEAVY]: { hp: 170, speed: 0.2, damage: 7, cooldown: 2, bulletSpeed: 0.8 }
};

// ====================================================================================
//                        BEHIND THE SCENE - NETWORKING CODE
// ====================================================================================
var Logger;
try { Logger = require("./NodeWS/Logger"); }
catch (e) { Logger = require("./../NodeWS/Logger"); }
var logger = new Logger();

var host = "127.0.0.1";
var port = 3011;
var key = 0;

for (var i=0; i<process.argv.length; i++) {
	if (process.argv[i] == "-h") host = process.argv[i + 1];
	else if (process.argv[i] == "-p") port = process.argv[i + 1];
	else if (process.argv[i] == "-k") key = process.argv[i + 1];
	else if (process.argv[i] == "-l") logger.startLogfile(process.argv[i + 1]);
}
if (host == null) host = "127.0.0.1";
if (port == null) port = 3011;
if (key == null) key = 0;

// Encoding/Decoding functions
var EncodeInt8 = function (number) { var arr = new Int8Array(1); arr[0] = number; return String.fromCharCode(arr[0]); };
var EncodeInt16 = function (number) { var arr = new Int16Array(1); var char = new Int8Array(arr.buffer); arr[0] = number; return String.fromCharCode(char[0], char[1]); };
var EncodeUInt8 = function (number) { var arr = new Uint8Array(1); arr[0] = number; return String.fromCharCode(arr[0]); };
var EncodeUInt16 = function (number) { var arr = new Uint16Array(1); var char = new Uint8Array(arr.buffer); arr[0] = number; return String.fromCharCode(char[0], char[1]); };
var EncodeFloat32 = function (number) { var arr = new Float32Array(1); var char = new Uint8Array(arr.buffer); arr[0] = number; return String.fromCharCode(char[0], char[1], char[2], char[3]); };
var DecodeInt8 = function (string, offset) { var arr = new Int8Array(1); var char = new Int8Array(arr.buffer); arr[0] = string.charCodeAt(offset); return char[0]; };
var DecodeInt16 = function (string, offset) { var arr = new Int16Array(1); var char = new Int8Array(arr.buffer); for (var i=0; i<2; ++i) { char[i] = string.charCodeAt(offset + i); } return arr[0]; };
var DecodeUInt8 = function (string, offset) { return string.charCodeAt(offset); };
var DecodeUInt16 = function (string, offset) { var arr = new Uint16Array(1); var char = new Uint8Array(arr.buffer); for (var i=0; i<2; ++i) { char[i] = string.charCodeAt(offset + i); } return arr[0]; };
var DecodeFloat32 = function (string, offset) { var arr = new Float32Array(1); var char = new Uint8Array(arr.buffer); for (var i=0; i<4; ++i) { char[i] = string.charCodeAt(offset + i); } return arr[0]; };

// Game objects
function Obstacle() { this.m_id = 0; this.m_x = 0; this.m_y = 0; this.m_HP = 0; this.m_destructible = true; }
function Base () { this.m_id = 0; this.m_team = 0; this.m_type = 0; this.m_HP = 0; this.m_x = 0; this.m_y = 0; }
function Tank() { this.m_id = 0; this.m_x = 0; this.m_y = 0; this.m_team = TEAM_1; this.m_type = TANK_LIGHT; this.m_HP = 0; this.m_direction = DIRECTION_UP; this.m_speed = 0; this.m_rateOfFire = 0; this.m_coolDown = 0; this.m_damage = 0; this.m_disabled = 0; }
function Bullet() { this.m_id = 0; this.m_x = 0; this.m_y = 0; this.m_team = TEAM_1; this.m_type = TANK_MEDIUM; this.m_direction = DIRECTION_UP; this.m_speed = 0; this.m_damage = 0; this.m_live = false; }
function Strike() { this.m_id = 0; this.m_x = 0; this.m_y = 0; this.m_team = TEAM_1; this.m_type = POWERUP_AIRSTRIKE; this.m_countDown = 0; this.m_live = false; }
function PowerUp() { this.m_id = 0; this.m_active = 0; this.m_type = 0; this.m_x = 0; this.m_y = 0; }

var g_team = -1;
var g_state = STATE_WAITING_FOR_PLAYERS;
var g_map = new Array();
var g_obstacles = new Array();
var g_hardObstacles = new Array();
var g_tanks = new Array();
	g_tanks[TEAM_1] = new Array();
	g_tanks[TEAM_2] = new Array();
var g_bullets = new Array();
	g_bullets[TEAM_1] = new Array();
	g_bullets[TEAM_2] = new Array();
var g_bases = new Array();
	g_bases[TEAM_1] = new Array();
	g_bases[TEAM_2] = new Array();
var g_powerUps = new Array();
var g_strikes = new Array();
	g_strikes[TEAM_1] = new Array();
	g_strikes[TEAM_2] = new Array();
var g_matchResult;
var g_inventory = new Array();
	g_inventory[TEAM_1] = new Array();
	g_inventory[TEAM_2] = new Array();
var g_timeLeft = 0;

// Network
var WebSocket;
try { WebSocket = require("./NodeWS"); }
catch (e) { WebSocket = require("./../NodeWS"); }

var SOCKET_IDLE = 0, SOCKET_CONNECTING = 1, SOCKET_CONNECTED = 2;
var COMMAND_PING = 0, COMMAND_SEND_KEY = 1, COMMAND_SEND_TEAM = 2, COMMAND_UPDATE_STATE = 3;
var COMMAND_UPDATE_MAP = 4, COMMAND_UPDATE_TANK = 5, COMMAND_UPDATE_BULLET = 6, COMMAND_UPDATE_OBSTACLE = 7;
var COMMAND_UPDATE_BASE = 8, COMMAND_REQUEST_CONTROL = 9, COMMAND_CONTROL_PLACE = 10, COMMAND_CONTROL_UPDATE = 11;
var COMMAND_UPDATE_POWERUP = 12, COMMAND_MATCH_RESULT = 13, COMMAND_UPDATE_INVENTORY = 14;
var COMMAND_UPDATE_TIME = 15, COMMAND_CONTROL_USE_POWERUP = 16, COMMAND_UPDATE_STRIKE = 17;

var socket = null;
var socketStatus = SOCKET_IDLE;

socket = WebSocket.connect("ws://" + host + ":" + port, [], function () {
	logger.print("Socket connected");
	socketStatus = SOCKET_CONNECTED;
	SendKey();
});
socket.on("error", function (code, reason) { socketStatus = SOCKET_IDLE; logger.print("Socket error: " + code); });
socket.on("text", function (data) { OnMessage(data); });
socketStatus = SOCKET_CONNECTING;

function Send(data) { socket.sendText(data); }
function OnMessage(data) {
	var readOffset = 0;
	while (true) {
		var command = DecodeUInt8(data, readOffset); readOffset++;
		if (command == COMMAND_SEND_TEAM) { g_team = DecodeUInt8(data, readOffset); readOffset++; }
		else if (command == COMMAND_UPDATE_STATE) {
			var state = DecodeUInt8(data, readOffset); readOffset++;
			if (g_state == STATE_WAITING_FOR_PLAYERS && state == STATE_TANK_PLACEMENT) {
				g_state = state;
				setTimeout(OnPlaceTankRequest, 100);
			}
		}
		else if (command == COMMAND_UPDATE_MAP) {
			g_hardObstacles = new Array();
			for (var i=0; i<MAP_W; i++) {
				for (var j=0; j<MAP_H; j++) {
					g_map[j * MAP_W + i] = DecodeUInt8(data, readOffset); readOffset += 1;
					if (g_map[j * MAP_W + i] == BLOCK_HARD_OBSTACLE) {
						var temp = new Obstacle(); temp.m_id = -1; temp.m_x = i; temp.m_y = j; temp.m_HP = 9999; temp.m_destructible = false;
						g_hardObstacles.push(temp);
					}
				}
			}
		}
		else if (command == COMMAND_UPDATE_TIME) { g_timeLeft = DecodeInt16(data, readOffset); readOffset += 2; }
		else if (command == COMMAND_UPDATE_OBSTACLE) { readOffset += ProcessUpdateObstacleCommand(data, readOffset); }
		else if (command == COMMAND_UPDATE_TANK) { readOffset += ProcessUpdateTankCommand(data, readOffset); }
		else if (command == COMMAND_UPDATE_BULLET) { readOffset += ProcessUpdateBulletCommand(data, readOffset); }
		else if (command == COMMAND_UPDATE_BASE) { readOffset += ProcessUpdateBaseCommand(data, readOffset); }
		else if (command == COMMAND_MATCH_RESULT) { readOffset += ProcessMatchResultCommand(data, readOffset); }
		else if (command == COMMAND_UPDATE_POWERUP) { readOffset += ProcessUpdatePowerUpCommand(data, readOffset); }
		else if (command == COMMAND_UPDATE_STRIKE) { readOffset += ProcessUpdateStrikeCommand(data, readOffset); }
		else if (command == COMMAND_UPDATE_INVENTORY) { readOffset += ProcessUpdateInventoryCommand(data, readOffset); }
		else if (command == COMMAND_REQUEST_CONTROL) { Update(); }
		else { readOffset++; logger.print("Invalid command id: " + command); }
		if (readOffset >= data.length) break;
	}
}
function SendKey() { if (socketStatus == SOCKET_CONNECTED) { var packet = ""; packet += EncodeUInt8(COMMAND_SEND_KEY); packet += EncodeInt8(key); Send(packet); } }

function ProcessUpdateObstacleCommand(data, originalOffset) {
	var offset = originalOffset;
	var id = DecodeUInt8(data, offset); offset++; var x = DecodeUInt8(data, offset); offset++;
	var y = DecodeUInt8(data, offset); offset++; var HP = DecodeUInt8(data, offset); offset++;
	if (g_obstacles[id] == null) g_obstacles[id] = new Obstacle();
	g_obstacles[id].m_id = id; g_obstacles[id].m_x = x; g_obstacles[id].m_y = y; g_obstacles[id].m_HP = HP;
	if (g_obstacles[id].m_HP <= 0) g_map[y * MAP_W + x] = BLOCK_GROUND;
	return offset - originalOffset;
}
function ProcessUpdateTankCommand(data, originalOffset) {
	var offset = originalOffset;
	var id = DecodeUInt8(data, offset); offset++; var team = DecodeUInt8(data, offset); offset++;
	var type = DecodeUInt8(data, offset); offset++; var HP = DecodeUInt16(data, offset); offset+=2;
	var dir = DecodeUInt8(data, offset); offset++; var speed = DecodeFloat32(data, offset); offset+=4;
	var ROF = DecodeUInt8(data, offset); offset++; var cooldown = DecodeUInt8(data, offset); offset++;
	var damage = DecodeUInt8(data, offset); offset++; var disabled = DecodeUInt8(data, offset); offset++;
	var x = DecodeFloat32(data, offset); offset+=4; var y = DecodeFloat32(data, offset); offset+=4;
	if (g_tanks[team][id] == null) g_tanks[team][id] = new Tank();
	g_tanks[team][id].m_id = id; g_tanks[team][id].m_team = team; g_tanks[team][id].m_type = type;
	g_tanks[team][id].m_HP = HP; g_tanks[team][id].m_direction = dir; g_tanks[team][id].m_speed = speed;
	g_tanks[team][id].m_rateOfFire = ROF; g_tanks[team][id].m_coolDown = cooldown; g_tanks[team][id].m_damage = damage;
	g_tanks[team][id].m_disabled = disabled; g_tanks[team][id].m_x = x; g_tanks[team][id].m_y = y;
	return offset - originalOffset;
}
function ProcessUpdateBulletCommand(data, originalOffset) {
	var offset = originalOffset;
	var id = DecodeUInt8(data, offset); offset++; var live = DecodeUInt8(data, offset); offset++;
	var team = DecodeUInt8(data, offset); offset++; var type = DecodeUInt8(data, offset); offset++;
	var dir = DecodeUInt8(data, offset); offset++; var speed = DecodeFloat32(data, offset); offset+=4;
	var damage = DecodeUInt8(data, offset); offset++; var hit = DecodeUInt8(data, offset); offset++;
	var x = DecodeFloat32(data, offset); offset+=4; var y = DecodeFloat32(data, offset); offset+=4;
	if (g_bullets[team][id] == null) g_bullets[team][id] = new Bullet();
	g_bullets[team][id].m_id = id; g_bullets[team][id].m_live = live; g_bullets[team][id].m_team = team;
	g_bullets[team][id].m_type = type; g_bullets[team][id].m_direction = dir; g_bullets[team][id].m_speed = speed;
	g_bullets[team][id].m_damage = damage; g_bullets[team][id].m_x = x; g_bullets[team][id].m_y = y;
	return offset - originalOffset;
}
function ProcessUpdatePowerUpCommand(data, originalOffset) {
	var offset = originalOffset;
	var id = DecodeUInt8(data, offset); offset++; var active = DecodeUInt8(data, offset); offset++;
	var type = DecodeUInt8(data, offset); offset++; var x = DecodeFloat32(data, offset); offset+=4;
	var y = DecodeFloat32(data, offset); offset+=4;
	if (g_powerUps[id] == null) g_powerUps[id] = new PowerUp();
	g_powerUps[id].m_id = id; g_powerUps[id].m_active = active; g_powerUps[id].m_type = type;
	g_powerUps[id].m_x = x; g_powerUps[id].m_y = y;
	return offset - originalOffset;
}
function ProcessUpdateBaseCommand(data, originalOffset) {
	var offset = originalOffset;
	var id = DecodeUInt8(data, offset); offset++; var team = DecodeUInt8(data, offset); offset++;
	var type = DecodeUInt8(data, offset); offset++; var HP = DecodeUInt16(data, offset); offset+=2;
	var x = DecodeFloat32(data, offset); offset+=4; var y = DecodeFloat32(data, offset); offset+=4;
	if (g_bases[team][id] == null) g_bases[team][id] = new Base();
	g_bases[team][id].m_id = id; g_bases[team][id].m_team = team; g_bases[team][id].m_type = type;
	g_bases[team][id].m_HP = HP; g_bases[team][id].m_x = x; g_bases[team][id].m_y = y;
	return offset - originalOffset;
}
function ProcessUpdateInventoryCommand(data, originalOffset) {
	g_inventory[TEAM_1] = new Array(); g_inventory[TEAM_2] = new Array();
	var offset = originalOffset;
	var number1 = DecodeUInt8(data, offset); offset++;
	for (var i=0; i<number1; i++) { g_inventory[TEAM_1][i] = DecodeUInt8(data, offset); offset++; }
	var number2 = DecodeUInt8(data, offset); offset++;
	for (var i=0; i<number2; i++) { g_inventory[TEAM_2][i] = DecodeUInt8(data, offset); offset++; }
	return offset - originalOffset;
}
function ProcessUpdateStrikeCommand(data, originalOffset) {
	var offset = originalOffset;
	var id = DecodeUInt8(data, offset); offset++; var team = DecodeUInt8(data, offset); offset++;
	var type = DecodeUInt8(data, offset); offset++; var live = DecodeUInt8(data, offset); offset++;
	var countDown = DecodeUInt8(data, offset); offset++; var x = DecodeFloat32(data, offset); offset+=4;
	var y = DecodeFloat32(data, offset); offset+=4;
	if (g_strikes[team][id] == null) g_strikes[team][id] = new Strike();
	g_strikes[team][id].m_id = id; g_strikes[team][id].m_live = live; g_strikes[team][id].m_team = team;
	g_strikes[team][id].m_type = type; g_strikes[team][id].m_countDown = countDown;
	g_strikes[team][id].m_x = x; g_strikes[team][id].m_y = y;
	return offset - originalOffset;
}
function ProcessMatchResultCommand(data, originalOffset) {
	var offset = originalOffset;
	g_matchResult = DecodeUInt8(data, offset); offset++;
	g_state = STATE_FINISHED;
	return offset - originalOffset;
}

// Command variables
function ClientCommand() { var g_direction = 0; var g_move = false; var g_shoot = false; var g_dirty = false; }
var clientCommands = new Array();
for (var i=0; i<NUMBER_OF_TANK; i++) { clientCommands.push(new ClientCommand()); }
var g_commandToBeSent = "";



// ====================================================================================
//                          COMMAND FUNCTIONS
// ====================================================================================
function PlaceTank(type, x, y) {
	g_commandToBeSent += EncodeUInt8(COMMAND_CONTROL_PLACE);
	g_commandToBeSent += EncodeUInt8(type);
	g_commandToBeSent += EncodeUInt8(x >> 0);
	g_commandToBeSent += EncodeUInt8(y >> 0);
}

function CommandTank(id, turn, move, shoot) {
	if (turn != null) { clientCommands[id].m_direction = turn; }
	else { clientCommands[id].m_direction = g_tanks[g_team][id].m_direction; }
	clientCommands[id].m_move = move;
	clientCommands[id].m_shoot = shoot;
	clientCommands[id].m_dirty = true;
}

function UseAirstrike(x, y) {
	if (HasAirstrike()) {
		g_commandToBeSent += EncodeUInt8(COMMAND_CONTROL_USE_POWERUP);
		g_commandToBeSent += EncodeUInt8(POWERUP_AIRSTRIKE);
		g_commandToBeSent += EncodeFloat32(x);
		g_commandToBeSent += EncodeFloat32(y);
	}
}

function UseEMP(x, y) {
	if (HasEMP()) {
		g_commandToBeSent += EncodeUInt8(COMMAND_CONTROL_USE_POWERUP);
		g_commandToBeSent += EncodeUInt8(POWERUP_EMP);
		g_commandToBeSent += EncodeFloat32(x);
		g_commandToBeSent += EncodeFloat32(y);
	}
}

function SendCommand() {
	for (var i=0; i<NUMBER_OF_TANK; i++) {
		if (clientCommands[i].m_dirty == true) {
			g_commandToBeSent += EncodeUInt8(COMMAND_CONTROL_UPDATE);
			g_commandToBeSent += EncodeUInt8(i);
			g_commandToBeSent += EncodeUInt8(clientCommands[i].m_direction);
			g_commandToBeSent += EncodeUInt8(clientCommands[i].m_move);
			g_commandToBeSent += EncodeUInt8(clientCommands[i].m_shoot);
			clientCommands.m_dirty = false;
		}
	}
	Send(g_commandToBeSent);
	g_commandToBeSent = "";
}



// ====================================================================================
//                          HELPER FUNCTIONS
// ====================================================================================
function GetTileAt(x, y) { return g_map[y * MAP_W + x]; }
function GetObstacleList() { var list = []; for (var i=0; i<g_obstacles.length; i++) list.push(g_obstacles[i]); for (var i=0; i<g_hardObstacles.length; i++) list.push(g_hardObstacles[i]); return list; }
function GetMyTeam() { return g_team; }
function GetOpponentTeam() { return (g_team == TEAM_1) ? TEAM_2 : TEAM_1; }
function GetMyTank(id) { return g_tanks[g_team][id]; }
function GetEnemyTank(id) { return g_tanks[(TEAM_1 + TEAM_2) - g_team][id]; }
function GetPowerUpList() { var powerUp = []; for (var i=0; i<g_powerUps.length; i++) if (g_powerUps[i] && g_powerUps[i].m_active) powerUp.push(g_powerUps[i]); return powerUp; }
function HasAirstrike() { for (var i=0; i<g_inventory[g_team].length; i++) if (g_inventory[g_team][i] == POWERUP_AIRSTRIKE) return true; return false; }
function HasEMP() { for (var i=0; i<g_inventory[g_team].length; i++) if (g_inventory[g_team][i] == POWERUP_EMP) return true; return false; }
function GetIncomingStrike() {
	var incoming = [];
	for (var i=0; i<g_strikes[TEAM_1].length; i++) if (g_strikes[TEAM_1][i] && g_strikes[TEAM_1][i].m_live) incoming.push(g_strikes[TEAM_1][i]);
	for (var i=0; i<g_strikes[TEAM_2].length; i++) if (g_strikes[TEAM_2][i] && g_strikes[TEAM_2][i].m_live) incoming.push(g_strikes[TEAM_2][i]);
	return incoming;
}
function GetMyBases() { return g_bases[g_team]; }
function GetEnemyBases() { return g_bases[GetOpponentTeam()]; }



// ====================================================================================
//                       🚀 SMART AI - CORE ALGORITHMS
// ====================================================================================

// ============================================
// 📐 UTILITY FUNCTIONS
// ============================================
function distance(x1, y1, x2, y2) {
	return Math.sqrt((x2-x1)*(x2-x1) + (y2-y1)*(y2-y1));
}

function manhattanDistance(x1, y1, x2, y2) {
	return Math.abs(x2-x1) + Math.abs(y2-y1);
}

function isWalkable(x, y) {
	if (x < 1 || x > 20 || y < 1 || y > 20) return false;
	var tile = GetTileAt(Math.floor(x), Math.floor(y));
	return tile == BLOCK_GROUND;
}

function isBlocked(x, y) {
	if (x < 1 || x > 20 || y < 1 || y > 20) return true;
	var tile = GetTileAt(Math.floor(x), Math.floor(y));
	return tile != BLOCK_GROUND;
}

// ============================================
// 🗺️ BFS PATHFINDING
// ============================================
function BFS(startX, startY, targetX, targetY) {
	// Round to grid
	startX = Math.floor(startX);
	startY = Math.floor(startY);
	targetX = Math.floor(targetX);
	targetY = Math.floor(targetY);
	
	// If already at target
	if (startX == targetX && startY == targetY) return [];
	
	var queue = [{x: startX, y: startY, path: []}];
	var visited = {};
	visited[startX + "," + startY] = true;
	
	var directions = [
		{dx: 0, dy: -1, dir: DIRECTION_UP},
		{dx: 1, dy: 0, dir: DIRECTION_RIGHT},
		{dx: 0, dy: 1, dir: DIRECTION_DOWN},
		{dx: -1, dy: 0, dir: DIRECTION_LEFT}
	];
	
	while (queue.length > 0) {
		var current = queue.shift();
		
		for (var i = 0; i < directions.length; i++) {
			var d = directions[i];
			var nx = current.x + d.dx;
			var ny = current.y + d.dy;
			var key = nx + "," + ny;
			
			if (visited[key]) continue;
			
			// Check if reached target (allow 1 cell proximity for bases)
			if (nx == targetX && ny == targetY) {
				return current.path.concat([d.dir]);
			}
			
			// Check if walkable
			if (isWalkable(nx, ny) && !isTankAt(nx, ny)) {
				visited[key] = true;
				queue.push({
					x: nx,
					y: ny,
					path: current.path.concat([d.dir])
				});
			}
		}
		
		// Limit search depth for performance
		if (queue.length > 400) break;
	}
	
	return null; // No path found
}

// Check if any tank is at position
function isTankAt(x, y) {
	for (var t = 0; t < NUMBER_OF_TANK; t++) {
		var myTank = GetMyTank(t);
		var enemyTank = GetEnemyTank(t);
		
		if (myTank && myTank.m_HP > 0) {
			if (Math.floor(myTank.m_x) == x && Math.floor(myTank.m_y) == y) return true;
		}
		if (enemyTank && enemyTank.m_HP > 0) {
			if (Math.floor(enemyTank.m_x) == x && Math.floor(enemyTank.m_y) == y) return true;
		}
	}
	return false;
}

// ============================================
// 🎯 TARGET SELECTION SYSTEM
// ============================================
function findBestTarget(tank) {
	var targets = [];
	
	// 1. Enemy tanks (priority by HP - target weak ones first)
	for (var i = 0; i < NUMBER_OF_TANK; i++) {
		var enemy = GetEnemyTank(i);
		if (enemy && enemy.m_HP > 0) {
			var dist = distance(tank.m_x, tank.m_y, enemy.m_x, enemy.m_y);
			var priority = 100 - enemy.m_HP + (20 - dist); // Lower HP = higher priority
			targets.push({
				type: 'tank',
				x: enemy.m_x,
				y: enemy.m_y,
				priority: priority,
				obj: enemy
			});
		}
	}
	
	// 2. Enemy main base (highest priority if path is clear)
	var enemyBases = GetEnemyBases();
	for (var i = 0; i < enemyBases.length; i++) {
		var base = enemyBases[i];
		if (base && base.m_HP > 0) {
			var dist = distance(tank.m_x, tank.m_y, base.m_x, base.m_y);
			var priority = (base.m_type == BASE_MAIN) ? 200 - dist : 80 - dist;
			targets.push({
				type: 'base',
				x: base.m_x,
				y: base.m_y,
				priority: priority,
				obj: base
			});
		}
	}
	
	// 3. Power-ups (if close enough)
	var powerUps = GetPowerUpList();
	for (var i = 0; i < powerUps.length; i++) {
		var pu = powerUps[i];
		var dist = distance(tank.m_x, tank.m_y, pu.m_x, pu.m_y);
		if (dist < 8) { // Only consider if reasonably close
			targets.push({
				type: 'powerup',
				x: pu.m_x,
				y: pu.m_y,
				priority: 90 - dist,
				obj: pu
			});
		}
	}
	
	// Sort by priority (highest first)
	targets.sort(function(a, b) { return b.priority - a.priority; });
	
	return targets.length > 0 ? targets[0] : null;
}

// ============================================
// 🔫 SMART SHOOTING
// ============================================
function shouldShoot(tank, target) {
	if (!target) return false;
	if (tank.m_coolDown > 0) return false;
	
	var dx = target.x - tank.m_x;
	var dy = target.y - tank.m_y;
	
	// Check if target is in line of fire
	var inLineOfFire = false;
	var correctDirection = null;
	
	// Check horizontal alignment
	if (Math.abs(dy) < 1.5) {
		if (dx > 0 && tank.m_direction == DIRECTION_RIGHT) inLineOfFire = true;
		if (dx < 0 && tank.m_direction == DIRECTION_LEFT) inLineOfFire = true;
		if (dx > 0) correctDirection = DIRECTION_RIGHT;
		if (dx < 0) correctDirection = DIRECTION_LEFT;
	}
	
	// Check vertical alignment
	if (Math.abs(dx) < 1.5) {
		if (dy > 0 && tank.m_direction == DIRECTION_DOWN) inLineOfFire = true;
		if (dy < 0 && tank.m_direction == DIRECTION_UP) inLineOfFire = true;
		if (dy > 0) correctDirection = DIRECTION_DOWN;
		if (dy < 0) correctDirection = DIRECTION_UP;
	}
	
	return { shoot: inLineOfFire, suggestedDirection: correctDirection };
}

// Get direction towards target
function getDirectionTowards(fromX, fromY, toX, toY) {
	var dx = toX - fromX;
	var dy = toY - fromY;
	
	// Prefer moving along the axis with greater distance
	if (Math.abs(dx) > Math.abs(dy)) {
		return dx > 0 ? DIRECTION_RIGHT : DIRECTION_LEFT;
	} else {
		return dy > 0 ? DIRECTION_DOWN : DIRECTION_UP;
	}
}

// ============================================
// 🛡️ DODGE SYSTEM
// ============================================
function getDodgeDirection(tank) {
	var strikes = GetIncomingStrike();
	var AOE_RADIUS = 3;
	
	for (var i = 0; i < strikes.length; i++) {
		var strike = strikes[i];
		var dist = distance(tank.m_x, tank.m_y, strike.m_x, strike.m_y);
		
		// If within danger zone, dodge!
		if (dist < AOE_RADIUS + 1) {
			// Find safest direction
			var directions = [
				{dir: DIRECTION_UP, dx: 0, dy: -1},
				{dir: DIRECTION_RIGHT, dx: 1, dy: 0},
				{dir: DIRECTION_DOWN, dx: 0, dy: 1},
				{dir: DIRECTION_LEFT, dx: -1, dy: 0}
			];
			
			var bestDir = null;
			var bestDist = dist;
			
			for (var j = 0; j < directions.length; j++) {
				var d = directions[j];
				var newX = tank.m_x + d.dx * 2;
				var newY = tank.m_y + d.dy * 2;
				
				if (isWalkable(newX, newY)) {
					var newDist = distance(newX, newY, strike.m_x, strike.m_y);
					if (newDist > bestDist) {
						bestDist = newDist;
						bestDir = d.dir;
					}
				}
			}
			
			if (bestDir) return bestDir;
		}
	}
	
	return null;
}

// Detect incoming bullets
function detectIncomingBullet(tank) {
	var enemyTeam = GetOpponentTeam();
	var bullets = g_bullets[enemyTeam];
	
	for (var i = 0; i < bullets.length; i++) {
		var bullet = bullets[i];
		if (!bullet || !bullet.m_live) continue;
		
		// Predict bullet path
		var bx = bullet.m_x;
		var by = bullet.m_y;
		
		// Check if bullet is heading towards our tank
		var willHit = false;
		
		if (bullet.m_direction == DIRECTION_UP && by > tank.m_y && Math.abs(bx - tank.m_x) < 1) willHit = true;
		if (bullet.m_direction == DIRECTION_DOWN && by < tank.m_y && Math.abs(bx - tank.m_x) < 1) willHit = true;
		if (bullet.m_direction == DIRECTION_LEFT && bx > tank.m_x && Math.abs(by - tank.m_y) < 1) willHit = true;
		if (bullet.m_direction == DIRECTION_RIGHT && bx < tank.m_x && Math.abs(by - tank.m_y) < 1) willHit = true;
		
		if (willHit) {
			var dist = distance(tank.m_x, tank.m_y, bx, by);
			if (dist < 5) { // Close enough to be dangerous
				// Dodge perpendicular to bullet
				if (bullet.m_direction == DIRECTION_UP || bullet.m_direction == DIRECTION_DOWN) {
					// Move left or right
					if (isWalkable(tank.m_x + 1, tank.m_y)) return DIRECTION_RIGHT;
					if (isWalkable(tank.m_x - 1, tank.m_y)) return DIRECTION_LEFT;
				} else {
					// Move up or down
					if (isWalkable(tank.m_x, tank.m_y - 1)) return DIRECTION_UP;
					if (isWalkable(tank.m_x, tank.m_y + 1)) return DIRECTION_DOWN;
				}
			}
		}
	}
	
	return null;
}

// ============================================
// 💣 POWER-UP USAGE STRATEGY
// ============================================
function usePowerUpSmart() {
	// Count enemy tanks close together
	var enemyCluster = findEnemyCluster();
	
	if (enemyCluster && enemyCluster.count >= 2) {
		if (HasAirstrike()) {
			UseAirstrike(enemyCluster.x, enemyCluster.y);
			return;
		}
		if (HasEMP()) {
			UseEMP(enemyCluster.x, enemyCluster.y);
			return;
		}
	}
	
	// Target enemy main base if low HP
	var enemyBases = GetEnemyBases();
	for (var i = 0; i < enemyBases.length; i++) {
		var base = enemyBases[i];
		if (base && base.m_type == BASE_MAIN && base.m_HP > 0 && base.m_HP < 150) {
			if (HasAirstrike()) {
				UseAirstrike(base.m_x, base.m_y);
				return;
			}
		}
	}
}

function findEnemyCluster() {
	var enemies = [];
	for (var i = 0; i < NUMBER_OF_TANK; i++) {
		var enemy = GetEnemyTank(i);
		if (enemy && enemy.m_HP > 0) {
			enemies.push(enemy);
		}
	}
	
	if (enemies.length < 2) return null;
	
	// Find centroid of enemies within range of each other
	var bestCluster = null;
	var bestCount = 0;
	
	for (var i = 0; i < enemies.length; i++) {
		var count = 1;
		var sumX = enemies[i].m_x;
		var sumY = enemies[i].m_y;
		
		for (var j = 0; j < enemies.length; j++) {
			if (i != j) {
				var dist = distance(enemies[i].m_x, enemies[i].m_y, enemies[j].m_x, enemies[j].m_y);
				if (dist < 5) { // Within AOE range
					count++;
					sumX += enemies[j].m_x;
					sumY += enemies[j].m_y;
				}
			}
		}
		
		if (count > bestCount) {
			bestCount = count;
			bestCluster = { x: sumX / count, y: sumY / count, count: count };
		}
	}
	
	return bestCluster;
}

// ============================================
// 🎖️ TANK ROLE ASSIGNMENT
// ============================================
var tankRoles = {}; // 'attacker', 'defender', 'flanker', 'collector'

function assignRoles() {
	var aliveTanks = [];
	for (var i = 0; i < NUMBER_OF_TANK; i++) {
		var tank = GetMyTank(i);
		if (tank && tank.m_HP > 0) {
			aliveTanks.push({id: i, tank: tank});
		}
	}
	
	// Assign roles based on tank type and position
	for (var i = 0; i < aliveTanks.length; i++) {
		var t = aliveTanks[i];
		if (t.tank.m_type == TANK_HEAVY) {
			tankRoles[t.id] = 'defender'; // Heavy tanks defend
		} else if (t.tank.m_type == TANK_LIGHT) {
			tankRoles[t.id] = (i % 2 == 0) ? 'attacker' : 'flanker';
		} else {
			tankRoles[t.id] = 'attacker';
		}
	}
	
	// Ensure at least one collector if power-ups exist
	var powerUps = GetPowerUpList();
	if (powerUps.length > 0 && aliveTanks.length > 1) {
		// Find closest tank to power-up
		var closestIdx = -1;
		var closestDist = 999;
		for (var i = 0; i < aliveTanks.length; i++) {
			var t = aliveTanks[i].tank;
			for (var j = 0; j < powerUps.length; j++) {
				var dist = distance(t.m_x, t.m_y, powerUps[j].m_x, powerUps[j].m_y);
				if (dist < closestDist) {
					closestDist = dist;
					closestIdx = aliveTanks[i].id;
				}
			}
		}
		if (closestIdx >= 0 && closestDist < 10) {
			tankRoles[closestIdx] = 'collector';
		}
	}
}



// ====================================================================================
//                           🎮 MAIN GAME FUNCTIONS
// ====================================================================================

function OnPlaceTankRequest() {
	// Chiến thuật đặt xe tối ưu theo team
	if (GetMyTeam() == TEAM_1) {
		// TEAM 1 (bên trái) - Tấn công từ trái sang phải
		PlaceTank(TANK_MEDIUM, 5, 1);   // Trên cùng - đi đường trên
		PlaceTank(TANK_LIGHT, 4, 7);    // Giữa trên - linh hoạt
		PlaceTank(TANK_LIGHT, 4, 14);   // Giữa dưới - linh hoạt  
		PlaceTank(TANK_HEAVY, 5, 20);   // Dưới cùng - đi đường dưới, tank chặn
	}
	else if (GetMyTeam() == TEAM_2) {
		// TEAM 2 (bên phải) - Tấn công từ phải sang trái
		PlaceTank(TANK_MEDIUM, 16, 1);  // Trên cùng
		PlaceTank(TANK_LIGHT, 17, 7);   // Giữa trên
		PlaceTank(TANK_LIGHT, 17, 14);  // Giữa dưới
		PlaceTank(TANK_HEAVY, 16, 20);  // Dưới cùng
	}
	
	SendCommand();
}

function Update() {
	// Check if game ended
	if (g_state == STATE_FINISHED) {
		if (((g_matchResult == MATCH_RESULT_TEAM_1_WIN) && (GetMyTeam() == TEAM_1)) || 
			((g_matchResult == MATCH_RESULT_TEAM_2_WIN) && (GetMyTeam() == TEAM_2))) {
			console.log("🏆 VICTORY! Our AI conquered!");
		} else if (((g_matchResult == MATCH_RESULT_TEAM_2_WIN) && (GetMyTeam() == TEAM_1)) || 
			((g_matchResult == MATCH_RESULT_TEAM_1_WIN) && (GetMyTeam() == TEAM_2))) {
			console.log("💔 Defeat... Time to improve!");
		} else {
			console.log("🤝 Draw match");
		}
		return;
	}
	
	// Assign roles to tanks
	assignRoles();
	
	// Use power-ups strategically
	usePowerUpSmart();
	
	// Control each tank
	for (var i = 0; i < NUMBER_OF_TANK; i++) {
		var tank = GetMyTank(i);
		
		// Skip dead tanks
		if (!tank || tank.m_HP == 0) continue;
		
		// Skip disabled tanks (EMP'd)
		if (tank.m_disabled > 0) continue;
		
		// PRIORITY 1: Dodge incoming strikes
		var dodgeDir = getDodgeDirection(tank);
		if (dodgeDir) {
			CommandTank(i, dodgeDir, true, false);
			continue;
		}
		
		// PRIORITY 2: Dodge incoming bullets (optional - can be aggressive)
		var bulletDodge = detectIncomingBullet(tank);
		if (bulletDodge && tank.m_HP < 50) { // Only dodge if low HP
			CommandTank(i, bulletDodge, true, true);
			continue;
		}
		
		// PRIORITY 3: Execute role-based behavior
		var role = tankRoles[i] || 'attacker';
		var target = findBestTarget(tank);
		
		if (role == 'collector') {
			// Go for power-ups
			var powerUps = GetPowerUpList();
			if (powerUps.length > 0) {
				var closest = powerUps[0];
				var path = BFS(tank.m_x, tank.m_y, closest.m_x, closest.m_y);
				if (path && path.length > 0) {
					CommandTank(i, path[0], true, true);
					continue;
				}
			}
		}
		
		if (target) {
			// Check if we should shoot
			var shootInfo = shouldShoot(tank, target);
			
			if (shootInfo.shoot) {
				// We're aligned - FIRE!
				CommandTank(i, null, false, true);
			} else if (shootInfo.suggestedDirection) {
				// Turn to face target
				CommandTank(i, shootInfo.suggestedDirection, false, true);
			} else {
				// Move towards target using BFS
				var path = BFS(tank.m_x, tank.m_y, target.x, target.y);
				if (path && path.length > 0) {
					CommandTank(i, path[0], true, true);
				} else {
					// No path - move directly
					var dir = getDirectionTowards(tank.m_x, tank.m_y, target.x, target.y);
					CommandTank(i, dir, true, true);
				}
			}
		} else {
			// No target - patrol towards enemy base
			var enemyBases = GetEnemyBases();
			if (enemyBases.length > 0 && enemyBases[0]) {
				var dir = getDirectionTowards(tank.m_x, tank.m_y, enemyBases[0].m_x, enemyBases[0].m_y);
				CommandTank(i, dir, true, true);
			}
		}
	}
	
	SendCommand();
}
