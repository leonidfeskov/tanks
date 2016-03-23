// один блок на карте
var Block = function(type){
	this.type = type;
	this.name = 'empty';
	this.isPervious = false;
	this.isDestroy = false;
	this.heals = 0;

	switch (type) {
		case 0:
			this.name = 'empty';
			this.isPervious = true;
			break;
		case 1:
			this.name = 'brick';
			this.heals = 1;
			this.isDestroy = true;
			break;
		case 2:
			this.name = 'block';
			this.heals = 1;
			break;
		case 3:
			this.name = 'grass';
			this.isPervious = true;
			break;
		case 4:
			this.name = 'water';
			break;
		case 9:
			this.name = 'base';
			this.heals = 1;
			this.isDestroy = true;
			break;
	}
};

var Map = function(map){
	this.width = this.height = map.length;
	this.blocks = [];
	for (var y = 0; y < map.length; y++) {
		var row = [];
		for (var x = 0; x < map.length; x++) {
			var block = new Block(map[y][x]);
			row.push(block);
		}
		this.blocks.push(row);
	}
	this.cellSize = 30;
};

Map.prototype.createBlock = function(x, y, type){
	this.blocks[y][x] = new Block(type);
};

Map.prototype.removeBlock = function(x, y){
	this.blocks[y][x] = new Block(0);
};

// Танк
var Tank = function(position, offset, team){
	this.team = team;
	this.HTML = document.createElement('div');
	this.HTML.className = 'tank tank_' + team;
	//  координаты танка на карте
	this.position = {
		x: position.x,
		y: position.y
	};
	// смещение указывает направление танка
	this.offset = {
		dx: offset.dx,
		dy: offset.dy,
	};
};

Tank.prototype.move = function(){
	this.position.x += this.offset.dx;
	this.position.y += this.offset.dy;
};

Tank.prototype.rotate = function(offset){
	this.offset = {
		dx: offset.dx,
		dy: offset.dy
	};
};

// пуля
var Shot = function(owner){
	this.HTML = document.createElement('div');
	this.HTML.className = 'shot shot_'+ getDirection(owner.offset);
	this.owner = owner;
	this.offset = {
		dx: owner.offset.dx,
		dy: owner.offset.dy
	};
}

var AI = function(game, tank){
	this.interval = setInterval(function(){
		var isPervious = game.checkPervious(tank);
		var random = getRandomInt(1, 10);
		// танк просто стоит, думает о жизни
		if (random == 1 || random == 2) {
			return;
		}
		// танк едет вперед
		if (isPervious) {
			tank.move();
			game.HTMLredraw.updateTankPosition(tank);
		} else {
			tank.rotate(getRandomDirection());
			game.HTMLredraw.updateTankRotate(tank);
		}
		// поворачиваем танк в случайном направлении
		if (random == 3) {
			tank.rotate(getRandomDirection());
			game.HTMLredraw.updateTankRotate(tank);
		}
		// танк стреляет
		if (random == 4) {
			game.fire(tank);
		}
	}, 400)
}

var GameInfo = function(){
	// timer
	var HTMLTime = document.getElementById('time');
	var HTMLTimeMin = HTMLTime.querySelector('.min');
	var HTMLTimeSec = HTMLTime.querySelector('.sec');

	var sec = 0;
	var min = 0;
	var timer = setInterval(function(){
		sec++
		if (sec > 59) {
			sec = 0;
			min++;
		}
		HTMLTimeSec.innerHTML = sec < 10 ? '0'+sec : sec;
		HTMLTimeMin.innerHTML = min < 10 ? '0'+min : min;
	}, 1000);

	// kill counter
	this.kills = 0;
}

GameInfo.prototype.updateKills = function(){
	var HTMLKills = document.getElementById('kills');
	HTMLKills.innerHTML = this.kills;
}

// вспомогательные функции
// получаем направление движения по координатам смещения
var getDirection = function(offset){
	if (offset.dx == 0 && offset.dy == -1) {
		return 'up';
	}
	if (offset.dx == 0 && offset.dy == 1) {
		return 'down';
	}
	if (offset.dx == -1 && offset.dy == 0) {
		return 'left';
	}
	if (offset.dx == 1 && offset.dy == 0) {
		return 'right';
	}
};

// получаем смещение в зависимости от нажатой кнопки
var getOffsetKeyboard = function(keyCode){
	if (keyCode == 38) return {dx: 0, dy: -1}; // up
	if (keyCode == 40) return {dx: 0, dy: 1};  // down
	if (keyCode == 37) return {dx: -1, dy: 0}; // left
	if (keyCode == 39) return {dx: 1, dy: 0};  // right	
};

// получаем x,y ячейки по координатам в px
var getBlockCoordinate = function(left, top){
	var block = {};
	block.x = Math.floor(left/cellSize);
	block.y = Math.floor(top/cellSize);

	return block;
}

// возвращает true, если пуля попала в танк
// direction - направление пули
// shotPosition - текушие координаты пули
// tankPosition - координаты танка, в которого стреляли
var checkHitTank = function(direction, shotPosition, tankPosition){
	switch (direction){
		case 'up':
			if ((shotPosition.x == tankPosition.x   && shotPosition.y == tankPosition.y+1) ||
				(shotPosition.x == tankPosition.x-1 && shotPosition.y == tankPosition.y+1) ||
				(shotPosition.x == tankPosition.x+1 && shotPosition.y == tankPosition.y+1)) {
				return true;
			}
			break;
		case 'down':
			if ((shotPosition.x == tankPosition.x   && shotPosition.y == tankPosition.y) ||
				(shotPosition.x == tankPosition.x-1 && shotPosition.y == tankPosition.y) ||
				(shotPosition.x == tankPosition.x+1 && shotPosition.y == tankPosition.y)) {
				return true;
			}
			break;
		case 'left':
			if ((shotPosition.x == tankPosition.x+1 && shotPosition.y == tankPosition.y  ) ||
				(shotPosition.x == tankPosition.x+1 && shotPosition.y == tankPosition.y-1) ||
				(shotPosition.x == tankPosition.x+1 && shotPosition.y == tankPosition.y+1)) {
				return true;
			}
			break;
		case 'right':
			if ((shotPosition.x == tankPosition.x && shotPosition.y == tankPosition.y  ) ||
				(shotPosition.x == tankPosition.x && shotPosition.y == tankPosition.y-1) ||
				(shotPosition.x == tankPosition.x && shotPosition.y == tankPosition.y+1)) {
				return true;
			}
			break;
	}
	return false;
}

// проверяем хочет ли игрок переместиться или просто повернуть танк в другую сторону
var checkTankRotate = function(oldOffset, newOffset) {
	if (oldOffset.dx == newOffset.dx && oldOffset.dy == newOffset.dy) return false;
	return true;
}

var getRandomInt = function(min, max){
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

var getRandomDirection = function(){
	var rnd = getRandomInt(1, 4);
	if (rnd == 1) return {dx: 0, dy: -1}; // up
	if (rnd == 2) return {dx: 0, dy: 1};  // down
	if (rnd == 3) return {dx: -1, dy: 0}; // left
	if (rnd == 4) return {dx: 1, dy: 0};  // right
}