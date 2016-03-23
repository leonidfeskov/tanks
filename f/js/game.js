var Game = function(map, base, playerRespawn, enemiesRespawn) {
	this.settings = {
		mute: false
	};
	this.base = base;
	this.playerRespawn = playerRespawn;
	this.enemiesRespawn = enemiesRespawn;
	this.init(map);
	this.start();
};

Game.prototype.init = function(map){
	// создаем обект карты
	this.map = new Map(map);

	// создаем игрока
	this.player = new Tank(this.playerRespawn, {dx:0, dy:-1}, 'player');

	// создаем танки-враги
	this.enemies = [];
	this.enemiesAI = [];
	for (var i = 0; i < this.enemiesRespawn.length; i++) {
		var enemyTank = new Tank(this.enemiesRespawn[i], {dx: 0, dy: 1}, 'enemy');
		this.enemies.push(enemyTank);
	}

	// объект отвечает за перерисовку карты
	this.HTMLredraw = new HTMLredraw(this.map, this.settings);
};

Game.prototype.start = function(){
	alert('Start!');
	var self = this;

	this.info = new GameInfo();
	// рисуем карту
	this.HTMLredraw.drawMap();

	// рисуем бaзу
	this.HTMLredraw.drawBase(this.base);

	// рисуем игрока
	this.HTMLredraw.drawTank(this.player);

	// рисуем танки-враги
	this.ai = [];
	for (var i = 0; i < this.enemies.length; i++) {
		this.HTMLredraw.drawTank(this.enemies[i]);
		// запускаем ИИ
		this.ai[i] = new AI(this, this.enemies[i]);
	}

	this.KeyboardEvent();

	var muteBtn = document.getElementById('mute');
	muteBtn.addEventListener('click', function (event) {
		if (self.settings.mute) {
			muteBtn.className = 'btn-mute';
			self.settings.mute = false;
		} else {
			muteBtn.className = 'btn-mute disable';
			self.settings.mute = true;
		}
		
	})
};

Game.prototype.respawnTank = function(i){
	var randowPosition = getRandomInt(0, this.enemiesRespawn.length-1);
	var enemyTank = new Tank(this.enemiesRespawn[randowPosition], {dx: 0, dy: 1}, 'enemy');
	this.enemies[i] = enemyTank;
	this.HTMLredraw.drawTank(this.enemies[i]);
	this.ai[i] = new AI(this, this.enemies[i]);
};

// события клавиатуры
Game.prototype.KeyboardEvent = function(){
	var self = this;
	var isDrive = false;
	var driveTimer;
	this.isRecharge = false;
	this.rechargeTimer;

	document.addEventListener('keydown', function (event) {
		// обработка нажатия стрелок
		if (event.keyCode >= 37 && event.keyCode <= 40) {
			var offset = getOffsetKeyboard(event.keyCode); // return dx, dy

			// игрок хочет только повернуться
			if (checkTankRotate(self.player.offset, offset)) {
				self.player.rotate(offset);
				self.HTMLredraw.updateTankRotate(self.player);
				return;
			}

			// проверяем, может ли игрок двигаться в заданном направлении и перемещаем танк
			var isPervious = self.checkPervious(self.player);
			if (isPervious && !isDrive) {
				isDrive = true;
				self.player.move();

				driveTimer = setTimeout(function(){
					isDrive = false;
					clearTimeout(driveTimer);
				}, 180);
			}
			
			self.HTMLredraw.updateTankPosition(self.player);
			event.preventDefault();
		}
		// обработка нажатия пробела (выстрел)
		if (event.keyCode == 32) {
			if (!self.isRecharge) {
				self.isRecharge = true;
				self.fire(self.player);

				self.rechargeTimer = setTimeout(function(){
					self.isRecharge = false;
					clearTimeout(self.rechargeTimer);
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
		}
		
		self.HTMLredraw.updateShotPosition(shot);
	}, 1000/24);
}

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

		if (checkHitTank(direction, {x: x1, y: y1}, {x: otherTank.position.x, y: otherTank.position.y})) {
			return false;
		}
	}

	// проверяем на столкновение с игроком
	if (checkHitTank(direction, {x: x1, y: y1}, {x: this.player.position.x, y: this.player.position.y})) {
		return false;
	}

	if (this.map.blocks[y1] && this.map.blocks[y2]) {
		var block1 = this.map.blocks[y1][x1];
		var block2 = this.map.blocks[y2][x2];
		if (block1 && block2 && block1.isPervious && block2.isPervious) return true;
	}
	return false;
};

// проверка на попадание пулей в цель
Game.prototype.checkHit = function(shot){
	var style = getComputedStyle(shot.HTML)
	var left = parseInt(shot.HTML.style.left) + parseInt(style.marginLeft);
	var top = parseInt(shot.HTML.style.top) + parseInt(style.marginTop);
	var width = this.map.width*this.map.cellSize;
	var height = this.map.height*this.map.cellSize;

	// пуля ушла за границы карты
	if (left < 0 || left > width || top < 0 || top > height) {
		// можно не ждать перезарядки и сразу стрелять 
		if (shot.owner.team == 'player') {
			this.isRecharge = false;
			clearTimeout(this.rechargeTimer);
		}
		return true;
	}

	// получаем координаты блока, над которым находится пуля
	var blockCoord1 = getBlockCoordinate(left, top);
	var blockCoord2 = {
		x: blockCoord1.x,
		y: blockCoord1.y
	}

	// пуля может уничтожить 2 соседних блока за раз, поэтому проверяем и соседний блок
	switch (getDirection(shot.offset)){
		case 'up':
			blockCoord2.x = blockCoord1.x + 1;
			break;
		case 'down':
			blockCoord2.x = blockCoord1.x + 1;
			break;
		case 'left':
			blockCoord2.y = blockCoord1.y + 1;
			break;
		case 'right':
			blockCoord2.y = blockCoord1.y + 1;
			break;
	}

	// пуля попала во вражеский танк
	if (shot.owner.team == 'player') {
		for (var i = 0; i < this.enemies.length; i++) {

			if (this.enemies[i] && checkHitTank(getDirection(shot.offset), blockCoord1, this.enemies[i].position)) {
				// можно не ждать перезарядки и сразу стрелять 
				this.isRecharge = false;
				clearTimeout(this.rechargeTimer);
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

	// пуля попала в игрока
	if (shot.owner.team == 'enemy') {
		if (this.player && checkHitTank(getDirection(shot.offset), blockCoord1, this.player.position)) {
			// уничтожаем танк
			this.HTMLredraw.destroyTank(this.player);
			alert('Game over!');
			location.reload();
		}
	}

	if (this.map.blocks[blockCoord1.y]) {
		var block1 = this.map.blocks[blockCoord1.y][blockCoord1.x];
	}

	if (this.map.blocks[blockCoord2.y]) {
		var block2 = this.map.blocks[blockCoord2.y][blockCoord2.x];
	}

	// попали в цель и ее можно уничтожить 
	if (block1 && block1.heals || block2 && block2.heals) {
		// можно не ждать перезарядки и сразу стрелять 
		if (shot.owner.team == 'player') {
			this.isRecharge = false;
			clearTimeout(this.rechargeTimer);
		}
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
		if (block1.name == 'base' || block2.name == 'base') {
			alert('Game over!');
			location.reload();
		}

		return true;
	}

	return false;
};