'use strict';
Scene.create('main', function() {
	let { screenSize, netmap, CameraMoveingObject, Joystick } = global_ns;
	let { Player } = nodes_ns;
	let { PhysicsBox } = physics_ns;
	
	let player = null, map = null, o = {}, ttt = null, ttt2 = null, ttt3 = null;
	
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
	};
	
	resizeHandler();
	cvs.on('resize', resizeHandler);
	
	
	class Box {
		constructor(p = {}) {
			this.x = p.x||0;
			this.y = p.y||0;
			
			this.w = p.w||10;
			this.h = p.h||10;
		}
		
		draw(ctx) {
			ctx.save();
			ctx.beginPath();
			ctx.strokeStyle = '#ffff00';
			ctx.strokeRect(this.x, this.y, this.w, this.h);
			ctx.restore();
		}
	};
	
	
	let idBorders = [
		203, 204, 211, 212, 228, 236
	];
	
	let boxes = [];


	//===============load===============//
	this.load = () => {
		console.log(map);
		
		player = global_ns.player = new Player({
			pos: screenSize.buf().div(2),
			size: vec2(32, 32),
		//	angle: Math.PI/3,
		//	scale: vec2(0.1, 0.1),
			image: db.player,
			
			speed: 0.3,
			resist: 0.85
		});
		
		player._isRenderBorder = true;
		
		// player = global_ns.player = new Player({
		// 	pos: screenSize.buf().div(2),
		// 	scale: vec2(0.1, 0.1),
		// 	image: db.unnamed,
			
		// 	speed: 0.3,
		// 	resist: 0.85
		// });
		
		console.log('loaded');
	};


	//===============init===============//
	this.init = () => {
		netmap.tile.set(8*3);
		
		
		let layer = map.layers[0];
		let size = vec2(map.tilewidth*3, map.tileheight*3);
		netmap.tile.set(size);
		
		for(let i = 0; i < layer.data.length; i++) {
			let id = layer.data[i];
			if(!idBorders.includes(id)) continue;
			
			
			let box = new Box({
				x: i % layer.width * size.x,
				y: Math.floor(i / layer.width) * size.y,
				w: size.x-1,
				h: size.y-1
			});
			
			boxes.push(box);
		};
		
		
		player.on('collide', (dir, a, b) => {
		//	console.log(dir);
		});
		
		
		ttt = new nodes_ns.Sprite({
			pos: vec2(30, 0),
		//	rotation: Math.PI/3,
			scale: vec2(2, 2),
			
			image: db.player
		});
		
		ttt2 = new nodes_ns.Sprite({
			pos: vec2(100, 0),
		//	pos: vec2(100, 70),
			scale: vec2(1.5, 1.5),
			
			image: db.player
		});
		
		ttt3 = new nodes_ns.Sprite({
			pos: vec2(100, 0),
		//	pos: vec2(100, 70),
			scale: vec2(1, 1),
			
			image: db.player
		});
		
		ttt.appendChild(ttt2);
		ttt2.appendChild(ttt3);
		
		
		
		o.root = new nodes_ns.Node({
			pos: vec2(0, 100),
			scale: vec2().set(3)
		});
		
		o.sprite = new nodes_ns.Sprite({
			image: db.player
		});
		
		o.collision = new nodes_ns.CollisionObject({
			size: o.sprite.size
		});
		
		o.root.appendChild(o.sprite);
		o.root.appendChild(o.collision);
		
		console.log('inited');
	};


	//===============updata===============//
	this.updata = function(dt) {
		//=======prePROCES=======//--vs--//=======EVENTS=======//
	//	cameraMoveingObject.updata(touches, main.camera);
		//==================================================//


		//=======PROCES=======//--vs--//=======UPDATA=======//
		main.camera.moveTime(player.getPosC().minus(screenSize.buf().div(2)), 5);
	//	main.imageSmoothingEnabled = false;
		joystick.updata(touches);
		
		player.image = db[(Math.cos(joystick.angle) < 0) ? 'player' : 'inv_player'];
		player.vel.moveAngle(joystick.value*player.speed, joystick.angle);
		
		
		for(let i = 0; i < boxes.length; i++) {
			player.hasCollide(boxes[i]);
		};
		
		
		player.updata();
		
		player.prevPos.set(player.pos);
		//==================================================//


		//==========DRAW==========//--vs--//==========RENDER==========//
		main.ctx.clearRect(0, 0, cvs.width, cvs.height);
		
		main.drawImage(db.map, 0, 0, db.map.width*3, db.map.height*3);
		netmap.draw(main);
		
		player.draw(main);
		
		for(let i = 0; i < boxes.length; i++) boxes[i].draw(main);
		
	//	ttt.draw(main);
	//	ttt2.draw(main);
	//	ttt3.draw(main);
		
	//	ttt.rotation += 0.001;
	//	ttt2.rotation += 0.01;
		
		o.root.pos.plus(-10/dt, 0);
		o.root.draw(main);
		
		
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
