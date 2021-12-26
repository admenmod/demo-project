'use strict';
Scene.create('main', function() {
	let { screenSize, netmap, CameraMoveingObject, Joystick } = global_ns;
	let { Player, Node, Sprite, CollisionObject, PhysicsBody } = nodes_ns;
	
	let player = null, map = null, ropo = [];
	let rootNode = null, homeNode = null, mapSprite = null;
	
	let cameraMoveingObject = new CameraMoveingObject(main.camera);
	
	this.preload(
		loadImage('./img/player.png').then(img => db.player = img)
		.then(() => generateImage(db.player.width, db.player.height, (ctx, size) => {
			ctx.drawImage(db.player, 0, 0, size.x, size.y);
			
			let imgdata = ctx.getImageData(0, 0, size.x, size.y);
			let a = imgdata.data;
			
			let newimgdata = new ImageData(size.x, size.y);
			let b = newimgdata.data;
			
			for(let i = 0; i < a.length; i += 4) {
				let l = a.length;
				let w = imgdata.width*4;
				
				let dx = i % w;
				let dy = Math.floor(i/w);
				
				let i2 = dy*w + w-dx;
				
				for(let j = 0; j < 4; j++) b[i+j] = a[i2+j];
			};
			
			ctx.putImageData(newimgdata, 0, 0);
		}).then(img => db.inv_player = img)));
	
	this.preload(loadImage('./img/car.png').then(img => db.car = img));
	this.preload(loadImage('./img/tank.png').then(img => db.tank = img));
	this.preload(loadImage('./img/home2.png').then(img => db.home = img));
	this.preload(loadImage('./img/unnamed.png').then(img => db.unnamed = img));
	
	
	this.preload(MapParser.loadMap('map.json', 'map/').then(data => {
		map = global_ns.map = data;
		
		return generateImage(map.width*map.tilewidth, map.height*map.tileheight, ctx => {
			map.draw(ctx);
		}).then(img => db.map = img);
	}));
	
	
	let joystick = new Joystick({
		colors: [0, '#223344', 1, '#556677'],
		coreColors: [0, '#334455', 1, '#8899aa']
	});
	
	
	let resizeHandler = e => {
		netmap.size.set(screenSize);
		joystick.pos.set(screenSize.buf().minus(90));
		
	//	rootNode.scale.set(5/cvs.vw);
	};
	
	
	let idBorders = [203, 204, 211, 212, 228, 236];
	let boxes = [];


	//===============load===============//
	this.load = () => {
		console.log(map);
		console.log('loaded');
	};


	//===============init===============//
	this.init = () => {
		netmap.tile.set(map.tilewidth*3);
		
		
		rootNode = new Node({ name: 'root' });
		rootNode._isRenderDebug = 1;
		
		
		mapSprite = rootNode.appendChild(new Sprite({
			name: 'Map',
			
			scale: vec2().set(3),
			image: db.map
		}));
		mapSprite.pos.plus(mapSprite.size.buf().div(10));
		mapSprite._isRenderDebug = 2;
		
		
		player = rootNode.appendChild(new Player({
			name: 'Player',
			
			pos: vec2(-100, -100),
			scale: vec2().set(0.3),
			
			speed: 0.1, resist: 0.97
		}));
		player._collision_check_objects = ropo;
		
		player.appendChild(new Sprite({
			image: db.car,
		//	pos: vec2(85, 0),
		//	drawAngleOffset: -Math.PI/2
		}));
		player.size.set(player.getChild('Sprite').size);
		
		let partsNode = player.getChild('Sprite').appendChild(new Node({
			name: 'Parts',
		}));
		partsNode._isRenderDebug = 2;
		
		partsNode.appendChild(new nodes_ns.Parts({
			name: 'wel1',
			pos: vec2(-100, -50)
		}));
	//	player._isRenderDebug = 1;
		
		partsNode.appendChild(new nodes_ns.Parts({
			name: 'wel2',
			pos: vec2(100, -50)
		}));
		
		partsNode.appendChild(new nodes_ns.Parts({
			name: 'wel3',
			pos: vec2(100, 50)
		}));
		
		partsNode.appendChild(new nodes_ns.Parts({
			name: 'wel4',
			pos: vec2(-100, 50)
		}));
		
		
		player.getChild('Sprite').appendChild(new CollisionObject({
			size: player.getChild('Sprite').size,
			// size: vec2(player.getChild('Sprite').size.x, 2),
			// pos: vec2(0, player.getChild('Sprite').size.y/2-1),
		}));
		
		homeNode = rootNode.appendChild(new PhysicsBody({
			name: 'Home',
			type: 'static',
			
			pos: vec2(50, 50),
			scale: vec2(1.7, 1.7)
		}));
		homeNode._collision_check_objects = ropo;
		homeNode.appendChild(new Sprite({ image: db.home }));
		homeNode.size.set(homeNode.getChild('Sprite').size);
		
		
		ropo.push(player, homeNode);
		
		
		player.rotationVel = 0;
		
		window.handler = function(dt) {
			let node = player;
			
		//	sprite.image = db[(Math.cos(joystick.angle) < 0) ? 'player' : 'inv_player'];
			
			
			node.speedRotation = 1/1000;
			node.targetRotation = joystick.angle + Math.PI/2;
			
			let rot = vec2(Math.cos(node.rotation), Math.sin(node.rotation));
			let rotTarget = vec2(Math.cos(node.targetRotation), Math.sin(node.targetRotation));
			
			let speedRotate = node.speedRotation * node.velocity.module;
			let speed = 0;
			
			if(Math.sin(joystick.angle) < 0) speed = node.speed;
			else speed = -node.speed/1.5;
			
			
			node.velRot += speedRotate * Math.cos(joystick.angle) * Math.sign(speed);
			
		//	node.velocity.moveAngle(joystick.value*speed * 16/dt, node.rotation);
			node.resist = 0.97;
			node.vel.moveAngle(0.3*joystick.value * 16/dt, joystick.angle);
		};
		
	//	player.on('update', handler);
		
		
		
		let drit = new CameraImitationCanvas(document.createElement('canvas').getContext('2d'));
		drit.canvas.width = 2000;
		drit.canvas.height = 2000;
		
		
		let ii = 0;
		
		player.on('render', (ctx, e) => {
			let pos = player.globalPos;
			let offset = vec2(-1000, -1000);
			
			let max = 5;
			let mod = player.vel.module;
			
			if(ii-- < 0 && mod > 1) {
				drit.camera.set(offset);
				partsNode.alpha = 0.2;
				partsNode.render(drit);
				
				ii = -10;
			};
			
			main.drawImage(drit.canvas, offset.x, offset.y, drit.canvas.width, drit.canvas.height);
		});
		
		/*
		player.addScript('main', function() {
			let sprite = this.getChild('Sprite');
			
			this.resist = 0.97;
			this.speed = 0.2;
			
			this.script_interface.update = function(dt) {
				sprite.image = db[(Math.cos(joystick.angle) < 0) ? 'player' : 'inv_player'];
				this.velocity.moveAngle(joystick.value*this.speed * 16/dt, joystick.angle);
				this.rotation = joystick.angle + Math.PI/2;
			};
			
			console.log('init main script');
		}, { db, joystick });
		*/
		
		resizeHandler();
		cvs.on('resize', resizeHandler);
		
		
		rootNode.ready();
		
		console.log('inited');
	};


	//===============update===============//
	this.update = function(dt) {
		//=======prePROCES=======//--vs--//=======EVENTS=======//
	//	cameraMoveingObject.update(touches, main.camera);
		//==================================================//


		//=======PROCES=======//--vs--//=======UPDATE=======//
		back.imageSmoothingEnabled = false;
		joystick.update(touches);
		
		
	//	for(let i = 0; i < boxes.length; i++) player.hasCollide(boxes[i]);
	
	//	rootNode.getChild('Player/Sprite').rotation += 0.01;
		handler(dt);
		rootNode.update(dt);
		player._prevPos.set(player.pos);
		
		
		main.camera.moveTime(player.globalPos.minus(screenSize.buf().div(2)), 5);
		//==================================================//


		//==========DRAW==========//--vs--//==========RENDER==========//
		main.ctx.clearRect(0, 0, cvs.width, cvs.height);
		back.ctx.clearRect(0, 0, cvs.width, cvs.height);
		
		netmap.draw(main);
		
		rootNode.render(main);
		
		
	//	for(let i = 0; i < boxes.length; i++) boxes[i].draw(main);
		
		joystick.draw(main.ctx);
		
		main.save();
		main.fillStyle = '#ffffff';
		main.font = 'bold 15px Arial';
		main.ctx.fillText('FPS: '+(1000/dt).toFixed(2), 20, 20);
		main.restore();
	}; //==============================//


	this.exit = function() {
		console.log('exited');
	};
});


Scene.run('main');
