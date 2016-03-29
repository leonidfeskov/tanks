var Game = function(map, base, playersRespawn, enemiesRespawn) {
	this.settings = {
		mute: false
	};
	this.base = base;
	this.playersRespawn = playersRespawn;
	this.enemiesRespawn = enemiesRespawn;

	this.init(map);
};

Game.prototype.init = function(map){
	this.info = new GameInfo();

	// создаем обект карты
	this.map = new Map(map);

	// объект отвечает за перерисовку карты
	this.HTMLredraw = new HTMLredraw(this.map, this.settings);

	// рисуем карту
	this.HTMLredraw.drawMap();
	// рисуем бaзу
	this.HTMLredraw.drawBase(this.base);

	alert('Start!');
	this.createPlayers();
	this.createEnemies();
}

Game.prototype.createPlayers = function(){
	// создаем игроков
	this.players = [];
	for (var i = 0; i < this.playersRespawn.length; i++) {
		var player = new Tank(this.playersRespawn[i], {dx:0, dy:-1}, 'player');
		this.HTMLredraw.drawTank(player);
		this.players.push(player);
	}

	// назначаем клавиши управления игрокам
	if (this.players[0]) this.KeyboardEvent(this.players[0], 65, 87, 68, 83, 32);
	if (this.players[1]) this.KeyboardEvent(this.players[1], 37, 38, 39, 40, 96);
};

Game.prototype.createEnemies = function(){
	// создаем танки-враги
	this.enemies = [];
	this.ai = [];
	for (var i = 0; i < this.enemiesRespawn.length; i++) {
		var enemyTank = new Tank(this.enemiesRespawn[i], {dx: 0, dy: 1}, 'enemy');
		var enemyAi = new AI(this, enemyTank);
		this.HTMLredraw.drawTank(enemyTank);
		this.enemies.push(enemyTank);
		this.ai.push(enemyAi);
	}
};

Game.prototype.respawnTank = function(i){
	var randowPosition = getRandomInt(0, this.enemiesRespawn.length-1);
	var enemyTank = new Tank(this.enemiesRespawn[randowPosition], {dx: 0, dy: 1}, 'enemy');
	this.enemies[i] = enemyTank;
	this.HTMLredraw.drawTank(this.enemies[i]);
	this.ai[i] = new AI(this, this.enemies[i]);
};

// события клавиатуры
Game.prototype.KeyboardEvent = function(player, keyLeft, keyUp, keyRight, keyDown, keyFire){
	var self = this;

	document.addEventListener('keydown', function (event) {
		// обработка нажатия стрелок
		if (event.keyCode == keyLeft || event.keyCode == keyUp || event.keyCode == keyRight || event.keyCode == keyDown) {
			var offset = getOffsetKeyboard(event.keyCode); // return dx, dy

			// игрок хочет только повернуться
			if (checkTankRotate(player.offset, offset)) {
				player.rotate(offset);
				self.HTMLredraw.updateTankRotate(player);
				return;
			}

			// проверяем, может ли игрок двигаться в заданном направлении и перемещаем танк
			var isPervious = self.checkPervious(player);
			if (isPervious && !player.isDrive) {
				player.isDrive = true;
				player.move();
				self.HTMLredraw.updateTankPosition(player);

				player.driveTimer = setTimeout(function(){
					player.isDrive = false;
					clearTimeout(player.driveTimer);
				}, 180);
			}
			
			event.preventDefault();
		}
		// обработка нажатия пробела (выстрел)
		if (event.keyCode == keyFire) {
			if (!player.isRecharge) {
				player.isRecharge = true;
				self.fire(player);

				player.rechargeTimer = setTimeout(function(){
					player.recharge();
				}, 1000);
			}
			event.preventDefault();
		}
	});
};

Game.prototype.fire = function(tank){
	var self = this;
	var shot = new Shot(tank);
	this.HTMLredraw.drawShot(shot);

	var interval = setInterval(function(){
		if (self.checkHit(shot)) {
			clearInterval(interval);
			self.HTMLredraw.destroyShot(shot);
			tank.recharge();
		}
		
		self.HTMLredraw.updateShotPosition(shot);
	}, 1000/24);
};

// проверям может ли игрок переместиться на соседнюю клетку;
Game.prototype.checkPervious = function(tank){
	// танк занимает 2x2 клеток, поэтому проверяем на проходимость две соседние клетки
	// координаты танка всегда в верхнем левом углу квадрата 2x2
	// [x,y][]
	//    [][]

	// координаты, на которые хотим передвинуть танк
	var x1;
	var y1;
	var x2;
	var y2;

	var direction = getDirection(tank.offset);

	switch (direction){
		case 'up':
			x1 = tank.position.x;
			y1 = tank.position.y - 1;
			x2 = tank.position.x + 1;
			y2 = tank.position.y - 1;
			break;
		case 'down':
			x1 = tank.position.x;
			y1 = tank.position.y + 2;
			x2 = tank.position.x + 1;
			y2 = tank.position.y + 2;
			break;
		case 'left':
			x1 = tank.position.x - 1;
			y1 = tank.position.y;
			x2 = tank.position.x - 1;
			y2 = tank.position.y + 1;
			break;
		case 'right':
			x1 = tank.position.x + 2;
			y1 = tank.position.y;
			x2 = tank.position.x + 2;
			y2 = tank.position.y + 1;
			break;
	}

	// проверяем на столкновение с другими танками. ехать сквозь танки нельзя
	for (var i = 0; i < this.enemies.length; i++){
		var otherTank = this.enemies[i];
		if (checkSiblingCoord(direction, {x: x1, y: y1}, {x: otherTank.position.x, y: otherTank.position.y})) {
			return false;
		}
	}

	// проверяем на столкновение с игроком
	for (var i = 0; i < this.players.length; i++){
		var player = this.players[i];
		if (checkSiblingCoord(direction, {x: x1, y: y1}, {x: player.position.x, y: player.position.y})) {
			return false;
		}
	}

	// если обе клетки свободны, то можно ехать
	if (this.map.blocks[y1] && this.map.blocks[y2]) {
		var block1 = this.map.blocks[y1][x1];
		var block2 = this.map.blocks[y2][x2];
		if (block1 && block2 && block1.isPervious && block2.isPervious) return true;
	}
	return false;
};

// проверка на попадание пулей в цель
Game.prototype.checkHit = function(shot){
	var style = getComputedStyle(shot.HTML);
	var left = parseInt(shot.HTML.style.left) + parseInt(style.marginLeft);
	var top = parseInt(shot.HTML.style.top) + parseInt(style.marginTop);
	var width = this.map.width*this.map.cellSize;
	var height = this.map.height*this.map.cellSize;

	// пуля ушла за границы карты
	if (left < 0 || left > width || top < 0 || top > height) {
		return true;
	}

	// получаем координаты блока, над которым находится пуля
	var blockCoord1 = getBlockCoordinate(left, top);
	var blockCoord2 = {
		x: blockCoord1.x,
		y: blockCoord1.y
	};

	// пуля может уничтожить 2 соседних блока за раз, поэтому проверяем и соседний блок
	switch (getDirection(shot.offset)){
		case 'up':
		case 'down':
			blockCoord2.x = blockCoord1.x + 1;
			break;
		case 'left':
		case 'right':
			blockCoord2.y = blockCoord1.y + 1;
			break;
		default:
			break;
	}

	// пуля попала в блок и его можно уничтожить?
	if (this.isHitBlock(shot, blockCoord1, blockCoord2)) {
		return true;
	}

	// пуля попала во вражеский танк?
	if (this.isHitEnemy(shot, blockCoord1)) {
		return true;
	}

	// пуля попала в игрока?
	if (this.isHitPlayer(shot, blockCoord1)) {
		return true;
	}

	// пуля попала в другую пулю (пока не работает)
	/*if (this.isHitShot(shot, blockCoord1)) {
		return true;
	}*/

	return false;
};

Game.prototype.isHitEnemy = function(shot, blockCoord){
	if (shot.owner.team == 'player') {
		for (var i = 0; i < this.enemies.length; i++) {

			if (this.enemies[i] && checkSiblingCoord(getDirection(shot.offset), blockCoord, this.enemies[i].position)) {
				// уничтожаем танк
				if (this.ai[i]) clearInterval(this.ai[i].interval);
				this.HTMLredraw.destroyTank(this.enemies[i]);
				delete this.enemies[i];
				delete this.ai[i];

				// защитываем +1 к убийствам
				this.info.kills++;
				this.info.updateKills();

				// респавним новый вражеский танк
				this.respawnTank(i);
				
				return true;
			}
		}
	}
	return false;
};

Game.prototype.isHitPlayer = function(shot, blockCoord){
	if (shot.owner.team == 'enemy') {
		for (var i = 0; i < this.players.length; i++) {
			if (this.players[i] && checkSiblingCoord(getDirection(shot.offset), blockCoord, this.players[i].position)) {
				// уничтожаем танк
				this.HTMLredraw.destroyTank(this.players[i]);
				this.gameover();
				return true;
			}
		}
	}
	return false;
};

Game.prototype.isHitBlock = function(shot, blockCoord1, blockCoord2){
	if (this.map.blocks[blockCoord1.y]) {
		var block1 = this.map.blocks[blockCoord1.y][blockCoord1.x];
	}

	if (this.map.blocks[blockCoord2.y]) {
		var block2 = this.map.blocks[blockCoord2.y][blockCoord2.x];
	}

	if (block1 && block1.heals || block2 && block2.heals) {
		// стираем текстуру с карты
		if (block1.isDestroy) {
			this.map.blocks[blockCoord1.y][blockCoord1.x] = new Block(0);
			this.HTMLredraw.destroyBlock(blockCoord1.x, blockCoord1.y);
		}

		if (block2.isDestroy) {
			this.map.blocks[blockCoord2.y][blockCoord2.x] = new Block(0);
			this.HTMLredraw.destroyBlock(blockCoord2.x, blockCoord2.y);
		}
		
		// разрушили базу - конец игры
		this.destroyBase(block1, block2);

		return true;
	}
	return false;
};

/*Game.prototype.isHitShot = function(shot, blockCoord){
	if (shot.owner.team == 'player') {
		for (var i in this.shots) {
			var style = getComputedStyle(this.shots[i].HTML);
			var left = parseInt(this.shots[i].HTML.style.left) + parseInt(style.marginLeft);
			var top = parseInt(this.shots[i].HTML.style.top) + parseInt(style.marginTop);
			var otherShotCoord = getBlockCoordinate(left, top);

			if (this.shots[i] && checkSiblingCoord(getDirection(shot.offset), blockCoord, otherShotCoord)) {
				this.HTMLredraw.destroyShot(this.shots[i]);
				delete this.shots[i];
				// уничтожаем танк
				alert('bum');
				return true;
			}
		}
	}
	return false;
};*/

Game.prototype.destroyBase = function(block1, block2){
	if (block1.name == 'base' || block2.name == 'base') {
		this.gameover();
	}
}

Game.prototype.gameover = function(){
	alert('Game over!');
	location.reload();
};

