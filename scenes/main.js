'use strict';
Scene.create('main', function() {
	let { screenSize, netmap, CameraMoveingObject, Joystick } = global_ns;
	let { Player, Node, Sprite, CollisionObject } = nodes_ns;
	
	let player = null, map = null;
	let rootNode = null, node2 = null, homeSprite = null, mapSprite = null;
	
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
		
		rootNode.scale.set(7/cvs.vw);
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
		
		rootNode = new Node({
			name: 'root',
		});
	//	rootNode._isRenderDebug = 1;
		
		
		mapSprite = rootNode.appendChild(new Sprite({
			name: 'Map',
			
			scale: vec2().set(3),
			image: db.map
		}));
		mapSprite._isRenderDebug = 2;
		mapSprite.pos.plus(mapSprite.size.buf().div(10));
		
		
		player = rootNode.appendChild(new Player({
			name: 'Player',
			
			scale: vec2().set(1)
		}));
		
		player.appendChild(new Sprite({
			image: db.player,
		}));
		
		player.appendChild(new CollisionObject({
			size: vec2(player.getChild('Sprite').size.x, 2),
			pos: vec2(0, player.getChild('Sprite').size.y/2-1),
		}));
		
		
		node2 = rootNode.appendChild(new Node({
			name: 'Node2',
			
			pos: vec2(0, 100)
		}));
		
		node2.appendChild(new Sprite({
			image: db.player
		}));
		
		node2.appendChild(new CollisionObject({
			size: node2.getChild('Sprite').size
		}));
		
		
		homeSprite = rootNode.appendChild(new Sprite({
			name: 'Home',
			
			pos: vec2(10, 10),
			scale: vec2(1.7, 1.7),
			image: db.home
		}));
		
		
		player.addScript('main', function() {
			let sprite = this.getChild('Sprite');
			
			this.update = function(dt) {
				sprite.image = db[(Math.cos(joystick.angle) < 0) ? 'player' : 'inv_player'];
				this.position.moveAngle(joystick.value*17/dt, joystick.angle);
			};
			
			console.log('init main script');
		}, { db, joystick });
		
		
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
		main.imageSmoothingEnabled = false;
		joystick.update(touches);
		
		
	//	for(let i = 0; i < boxes.length; i++) player.hasCollide(boxes[i]);
		
		rootNode.update(dt);
		
		main.camera.moveTime(player.globalPos.minus(screenSize.buf().div(2)), 5);
		
	//	player.prevPos.set(player.pos);
		//==================================================//


		//==========DRAW==========//--vs--//==========RENDER==========//
		main.ctx.clearRect(0, 0, cvs.width, cvs.height);
		
		netmap.draw(main);
		
		rootNode.render(main);
		
		
	//	for(let i = 0; i < boxes.length; i++) boxes[i].draw(main);
		
		
	//	if(o.collision.isRectIntersect(o.collision2)) o.sprite.image = db.unnamed;
	//	else o.sprite.image = db.player;
		
	//	else if(o.collision2.isRectIntersect(o.collision)) o.sprite.image = db.unnamed;
	//	else o.sprite.image = db.player;
		
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
