var HTMLredraw = function(map, settings){
	this.settings = settings;
	this.mapHTML = document.querySelector('.map');
	this.map = map;
	this.width = map.width;
	this.height = map.height;
	this.cellSize = map.cellSize;
};

// отрисовываем карту
HTMLredraw.prototype.drawMap = function(){
	for (var y = 0; y < this.height; y++) {
		for (var x = 0; x < this.width; x++) {
			var block = document.createElement('div');
			block.className = 'block block_' + this.map.blocks[y][x].name;
			this.mapHTML.appendChild(block);
		}
	}
	//this.audio('fon');
};

// рисуем базу
HTMLredraw.prototype.drawBase = function(base){
	var HTML = document.createElement('div');
	HTML.className = 'base';
	HTML.style.left = base.x * this.cellSize + 'px';
	HTML.style.top = base.y * this.cellSize + 'px';
	this.mapHTML.appendChild(HTML);
};

HTMLredraw.prototype.drawTank = function(tank){
	// рисуем танк
	this.mapHTML.appendChild(tank.HTML);
	// ставим его на заданную позицию
	this.updateTankPosition(tank);
	// поворачиваем в заданную сторону
	this.updateTankRotate(tank);
};

HTMLredraw.prototype.updateTankGrade = function(tank){
	tank.HTML.className = 'tank tank_' + tank.team + ' tank_v' + tank.grade + ' tank_'+ getDirection(tank.offset);
};

// перемещаем танк
HTMLredraw.prototype.updateTankPosition = function(tank){
	tank.HTML.style.left = tank.position.x * this.cellSize + 'px';
	tank.HTML.style.top = tank.position.y * this.cellSize + 'px';
};

// поворачиваем танк
HTMLredraw.prototype.updateTankRotate = function(tank){
	tank.HTML.className = 'tank tank_' + tank.team + ' tank_v' + tank.grade + ' tank_'+ getDirection(tank.offset);
};

// стираем танк
HTMLredraw.prototype.destroyTank = function(tank){
	this.mapHTML.removeChild(tank.HTML);
	this.drawBang(tank.position.x, tank.position.y);
	this.audio('bangTank');
}

// рисуем пулю
HTMLredraw.prototype.drawShot = function(shot){
	var HTML = shot.HTML;
	HTML.style.left = (shot.owner.position.x * this.cellSize) + 'px';
	HTML.style.top = (shot.owner.position.y * this.cellSize) + 'px';
	
	this.mapHTML.appendChild(HTML);
	this.audio('hit');
}

// перемещаем пулю
HTMLredraw.prototype.updateShotPosition = function(shot){
	var HTML = shot.HTML;
	var speed = 15;
	var leftOld = parseInt(HTML.style.left);
	var topOld = parseInt(HTML.style.top);

	HTML.style.left = (leftOld + speed*shot.offset.dx) + 'px';
	HTML.style.top = (topOld + speed*shot.offset.dy) + 'px';
}

// стираем пулю
HTMLredraw.prototype.destroyShot = function(shot){
	this.mapHTML.removeChild(shot.HTML);
}

// стираем блок на карте
HTMLredraw.prototype.destroyBlock = function(x, y){
	var index = y*this.height + x;
	var HTML = document.querySelectorAll('.block')[index];
	HTML.className = 'block';
	this.drawBang(x, y);
	this.audio('bang');
}

HTMLredraw.prototype.drawBang = function(x, y){
	var self = this;
	var HTML = document.createElement('div');
	HTML.className = 'bang';
	this.mapHTML.appendChild(HTML);
	HTML.style.left = (x * this.cellSize) + 'px';
	HTML.style.top = (y * this.cellSize) + 'px';
	var opacity = 1;
	var interval = setInterval(function(){
		opacity -= 0.2;
		if (opacity <= 0) {
			clearInterval(interval);
			self.mapHTML.removeChild(HTML);
		}
		HTML.style.opacity = opacity;
	},100)
}

HTMLredraw.prototype.audio = function(sound){
	if (!this.settings.mute) {
		switch (sound) {
			case 'fon':
				/*var audioFon = document.createElement('audio');
				audioFon.src = 'f/sounds/fon.wav';
				audioFon.loop = true;
				audioFon.play();*/
				break;
			case 'hit':
				var audioHit = document.createElement('audio');
				audioHit.src = 'f/sounds/hit.wav';
				audioHit.play();
				break;
			case 'bang':
				var audioBang = document.createElement('audio');
				audioBang.src = 'f/sounds/bang.wav';
				audioBang.play();
				break;
			case 'bangTank':
				var audioBangTank = document.createElement('audio');
				audioBangTank.src = 'f/sounds/bang-tank.wav';
				audioBangTank.play();
				break;
		}
	}
};