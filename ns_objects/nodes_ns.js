'use strict';
let nodes_ns = new function() {
	function emptyFunction() {};
	
	let range = (v, min, max) => Math.min(Math.max(v, min), max);
	
	let isPointRectIntersect = (v, arr) => {
		let d = 0;
		for(let c = arr.length-1, n = 0; n < arr.length; c = n++) {
			arr[n].y > v.y != arr[c].y > v.y &&
			v.x < (arr[c].x - arr[n].x) * (v.y - arr[n].y) / (arr[c].y - arr[n].y) + arr[n].x &&
			(d = !d);
		};
		return d;
	};
	/*
	let NodeCollection = class {
		constructor(arr) {
			this.length = 0;
			arr.forEach(i => Array.prototype.push.call(this, i));
			
			console.log(this);
		}
	};
	
	new NodeCollection([53, 34]);
	*/
	let Node = this.Node = class extends Child {
		constructor(p = {}) {
			super();
			this.name = p.name||this.NODE_TYPE;
			
			this._isRenderDebug = 0;
			
			this._rotation = p.rotation||0;
			this._position = (p.pos || p.position || vec2()).buf();
			this._scale = (p.scale || vec2(1, 1)).buf();
			this._zIndex = p.zIndex||0;
			
			this.scripts = {};
			this.script_interface = {
				position: this.position, rotation: this.rotation, scale: this.scale,
				ready: emptyFunction, update: emptyFunction, render: emptyFunction,
				
				getChild: name => this.getChild(name)
			};
			
			this.useAPI = {
				Vector2, vec2, VectorN, vecN, EventEmitter, random, JSONcopy,
				Promise, Proxy, WeakRef,
				console, Date, Math, JSON, Set, Map, WeakSet, WeakMap,
				Object, Array, Function, Number, String, RegExp, BigInt, Symbol
			};
		}
		
		get NODE_TYPE() { return this.__proto__[Symbol.toStringTag]; }
		
		set zIndex(v) { this._zIndex = v; }
		get zIndex() { return this._zIndex; }
		
		get pos() { return this._position; }
		get position() { return this._position; }
		
		get scale() { return this._scale; }
		
		set rot(v) { this._rotation = v; }
		get rot() { return this._rotation; }
		set rotation(v) { this._rotation = v; }
		get rotation() { return this._rotation; }
		
		
		get globalScale() { return this._getRelativeScale(Child.MAX_CHILDREN); }
		get globalRotation() { return this._getRelativeRotation(Child.MAX_CHILDREN); }
		
		get globalPos() { return this.globalPosition; }
		get globalPosition() { return this._getRelativePosition(Child.MAX_CHILDREN); }
		set globalPosition(v) {
			if(this.getParent()) this.pos.set(v.sub(this.getParent().globalPosition).div(this.getParent().scale));
			else this.pos.set(v);
		}
		
		get globalIsRenderDebug() { return this._getRelativeIsRenderDebug(Child.MAX_CHILDREN); }
		
		_getRelativeIsRenderDebug(nl = 0, arr = this.getChainParent()) {
			let l = Math.min(nl, arr.length, Child.MAX_CHILDREN);
			let acc = this._isRenderDebug;
			
			for(let i = 0; i < l; i++) {
				if(acc) break;
				acc = arr[i]._isRenderDebug;
			};
			
			return acc;
		}
		
		_getRelativeScale(nl = 0, arr = this.getChainParent()) {
			let l = Math.min(nl, arr.length, Child.MAX_CHILDREN);
			let acc = this.scale.buf();
			
			for(let i = 0; i < l; i++) acc.inc(arr[i].scale);
			
			return acc;
		}
		
		_getRelativeRotation(nl = 0, arr = this.getChainParent()) {
			let l = Math.min(nl, arr.length, Child.MAX_CHILDREN);
			let acc = this.rotation;
			
			for(let i = 0; i < l; i++) acc += arr[i].rotation;
			
			return acc;
		}
		
		_getRelativePosition(nl = 0, arr = this.getChainParent()) {
			let l = Math.min(nl, arr.length, Child.MAX_CHILDREN);
			let acc = vec2();
			
			let prev = this, next = null;
			
			if(!arr.length) acc.add(this.position);
			
			for(let i = 0; i < l; i++) {
				next = arr[i];
				
				acc.add(prev.position).inc(next.scale);
				if(next.rotation !== 0) acc.angle = next.rotation;
				
				prev = next;
			};
			
			if(arr.length) acc.add(arr[arr.length-1].position);
			
			return acc;
		}
		
		runScript(name) { this.scripts[name]?.call(this); }
		// addScript(name, code, addAPI) { this.scripts[name] = codeShell(code, Object.assign(addAPI, this.useAPI)); }
		addScript(name, code, addAPI) { this.scripts[name] = code; }
		
		_ready() {}
		ready() {
			this.emit('ready');
			this._ready();
			
			let arr = this._children;
			for(let i = 0; i < arr.length; i++) arr[i].ready();
		}
		
		_update() {}
		update(dt = 1000/60) {
			this.emit('update', dt);
			this._update(dt);
			
			let arr = this._children;
			for(let i = 0; i < arr.length; i++) arr[i].update(dt);
		}
		_render(ctx) {
			ctx.save();
			this.draw(ctx);
			ctx.restore();
		}
		render(ctx) {
			let prevented = false;
			let e = { preventDefault: () => prevented = true };
			
			this.emit('render', ctx, e);
			
			if(prevented) return;
			this._render(ctx);
			
			let arr = this.getChildren().sort((a, b) => a.zIndex - b.zIndex);
			for(let i = 0; i < arr.length; i++) arr[i].render(ctx);
		}
		
		draw(ctx) {
			if(this.globalIsRenderDebug === 1) this.renderDebug(ctx, 30);
		}
		
		renderDebug(ctx, c = 30) {
			let pos = this.globalPosition;
			
			ctx.beginPath();
			ctx.lineWidth = 1;
			ctx.strokeStyle = '#3377ee';
			ctx.moveTo(pos.x-c, pos.y);
			ctx.lineTo(pos.x+c, pos.y);
			ctx.moveTo(pos.x, pos.y-c);
			ctx.lineTo(pos.x, pos.y+c);
			ctx.stroke();
			/*
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.font = 'bold 15px Arial';
			
			ctx.strokeStyle = '#111111';
			ctx.strokeText(this.name, pos.x, pos.y);
			ctx.fillStyle = '#eeeeee';
			ctx.fillText(this.name, pos.x, pos.y);
			*/
		}
		
		getChild(path) {
			let l = path.search('/');
			if(!~l) return this._children.find(i => i.name === path);
			
			let left = path.slice(0, l);
			let right = path.slice(l+1);
			
			return this.getChild(left).getChild(right);
		}
		appendChild(node) {
			if(this.getChild(node.name)) return Error('err: name match');
			return super.appendChild(node);
		}
		
	//	appendChild(...args) { return super.appendChild(...args); } // todo: cache
	//	removeChild(...args) { return super.appendChild(...args); } // todo: cache
	};
	Node.prototype[Symbol.toStringTag] = 'Node';
	
	
	let Spatial = this.Spatial = class extends Node {
		constructor(p = {}) {
			super(p);
			
			this.visible = p.visible||true;
			
			this._rotationOffsetPoint = (p.rotationOffsetPoint || vec2()).buf();
			this.alpha = p.alpha !== undefined ? p.alpha : 1;
		}
		
		get alpha() { return this._alpha; }
		set alpha(v) { return this._alpha = Math.min(1, Math.max(0, v)); }
		get globalAlpha() { return this._getRelativeAlpha(Child.MAX_CHILDREN); }
		
		_getRelativeAlpha(nl = 0, arr = this.getChainParent()) {
			let l = Math.min(nl, arr.length, Child.MAX_CHILDREN);
			let acc = this.alpha;
			
			for(let i = 0; i < l; i++) {
				if(arr[i].alpha !== undefined) acc *= arr[i].alpha;
			};
			
			return acc;
		}
	};
	Spatial.prototype[Symbol.toStringTag] = 'Spatial';
	
	
	let Sprite = this.Sprite = class extends Spatial {
		constructor(p = {}) {
			super(p);
			
			if(!p.image) throw Error('Invalid parameter image');
			this.image = p.image;
			
			this._size = vec2(p.size?.x||this.image.width, p.size?.y||this.image.height);
			
			this._drawAngleOffset = p.drawAngleOffset||0;
			this._drawOffset = (p.drawOffset || vec2()).buf();
		}
		
		get size() { return this._size; }
		get globalSize() { return this.globalScale.inc(this._size); }
		
		renderDebug(ctx) {
			let pos = this.globalPosition, size = this.globalSize;
			let drawPos = pos.buf().add(this._drawOffset).sub(size.buf().div(2));
			
			ctx.beginPath();
			ctx.globalAlpha = this.globalAlpha+0.2;
			ctx.lineWidth = 1;
			ctx.strokeStyle = '#ffff00';
		//	ctx.strokeRect(drawPos.x+ctx.lineWidth/2, drawPos.y+ctx.lineWidth/2, size.x-ctx.lineWidth, size.y-ctx.lineWidth);
		//	ctx.strokeRect(drawPos.x-ctx.lineWidth/2, drawPos.y-ctx.lineWidth/2, size.x+ctx.lineWidth, size.y+ctx.lineWidth);
			ctx.strokeRect(drawPos.x, drawPos.y, size.x, size.y);
			
			ctx.moveTo(pos.x-size.x/3, pos.y);
			ctx.lineTo(pos.x+size.x/3, pos.y);
			ctx.moveTo(pos.x, pos.y-size.y/3);
			ctx.lineTo(pos.x, pos.y+size.y/3);
			ctx.stroke();
		}
		
		draw(ctx) {
			if(!this.visible) return;
			
			let pos = this.globalPosition, rot = this.globalRotation, size = this.globalSize;
			let drawPos = pos.buf().add(this._drawOffset).sub(size.buf().div(2));
			
			ctx.beginPath();
			ctx.globalAlpha = this.globalAlpha;
			
			ctx.rotateOffset(rot+this._drawAngleOffset, pos.buf().add(this._rotationOffsetPoint));
			
			ctx.drawImage(this.image, drawPos.x, drawPos.y, size.x, size.y);
			
			if(this.globalIsRenderDebug === 1) this.renderDebug(ctx, pos, size, drawPos);
			
			super.draw(ctx);
		}
	};
	Sprite.prototype[Symbol.toStringTag] = 'Sprite';
	//======================================================================//
	
	
	let CollisionObject = this.CollisionObject = class extends Spatial {
		constructor(p = {}) {
			super(p);
			this.type_collision = p.type||'rect';
			
			this._size = (p.size || vec2()).buf();
		}
		
		get size() { return this._size; }
		get globalSize() { return this.globalScale.inc(this._size); }
		
		getStaticCollisionBox() {
			let pos = this.globalPosition;
			let hSize = this.globalSize.div(2);
			
			return [
				pos.buf().sub(hSize),
				pos.buf().add(hSize.x, -hSize.y),
				pos.buf().add(hSize), 
				pos.buf().add(-hSize.x, hSize.y)
			];
		}
		
		getDynamicCollisionBox() {
			let pos = this.globalPosition;
			let rotation = this.globalRotation;
			let hSize = this.globalSize.div(2);
			
			let lt = hSize.buf().invert(),
				rt = vec2(hSize.x, -hSize.y),
				rb = hSize.buf(),
				lb = vec2(-hSize.x, hSize.y);
			
			lt.angle = rt.angle = rb.angle = lb.angle = rotation;
			
			return [lt.add(pos), rt.add(pos), rb.add(pos), lb.add(pos)];
		}
		
		getCollisionBox() {
			return this.globalRotation === 0 ? this.getStaticCollisionBox() : this.getDynamicCollisionBox();
		}
		
		getBoundingRect(pos = this.globalPosition) {
			let size = this.globalSize;
			return {
				x: pos.x, w: size.x, width: size.x,
				y: pos.y, h: size.y, height: size.y,
				
				left:	pos.x - size.x/2,
				right:	pos.x + size.x/2,
				top:	pos.y - size.y/2,
				bottom:	pos.y + size.y/2
			};
		}
		
		isStaticRectIntersect(b) {
			let a = this.getBoundingRect();
			b = b.getBoundingRect?.() || b;
			
			let s = vec2(a.w, a.h).add(b.w, b.h).div(2);
			
		//	return !(a.right < b.left || b.right < a.left || a.bottom < b.top || b.bottom < a.top);
		//	return !(a.x < b.x-a.w || a.x > b.x+b.w || a.y < b.y-a.h || a.y > b.y+b.h);
			return !(a.x < b.x-s.x || a.x > b.x+s.x || a.y < b.y-s.y || a.y > b.y+s.y);
		}
		
		isDynamicRectIntersect(b) {
			let v = false;
			let a = this.getDynamicCollisionBox();
			b = b.getDynamicCollisionBox();
			
			for(let i = 0; i < a.length; i++) {
				if(v = isPointRectIntersect(a[i], b)) break;
			};
			
			return v;
		}
		
		isRectIntersect(b) {
			return this.globalRotation !== 0 || b.globalRotation !== 0 ? this.isDynamicRectIntersect(b) : this.isStaticRectIntersect(b);
		}
		
		renderDebug(ctx) {
		//	let box = this.getCollisionBox();
			let b = this.getBoundingRect();
			
			ctx.beginPath();
			ctx.globalAlpha = 0.5;
			ctx.lineWidth = 1;
			ctx.fillStyle = '#227777';
			ctx.strokeStyle = '#33ffff';
		//	ctx.moveTo(box[0].x, box[0].y);
		//	for(let i = 1; i < box.length; i++) ctx.lineTo(box[i].x, box[i].y);
		//	ctx.closePath();
		//	ctx.fill();
		//	ctx.stroke();
			ctx.fillRect(b.left, b.top, b.right-b.left, b.bottom-b.top);
		//	ctx.fillRect(b.x, b.y, b.w, b.h);
		//	ctx.fillRect(b.left, b.top, b.w, b.h);
			ctx.strokeRect(b.left, b.top, b.w, b.h);
			
			super.renderDebug(ctx);
		}
	};
	CollisionObject.prototype[Symbol.toStringTag] = 'CollisionObject';
	
	
	let PhysicsBody = this.PhysicsBody = class extends CollisionObject {
		constructor(p = {}) {
			super(p);
			this.type_physics = p.type||'rigid';
			
			this._prevPos = this.pos.buf();
			
			this._velocity = vec2(); // motion
			this._rebound = vec2();
			this._velocityRotation = 0;
			
			this.resist = p.resist||0.9;
			this.resistRot = p.resistRot||0.9;
			
			this._collision_check_objects = [];
			
			this.script_interface.velocity = this.velocity;
		}
		
		get vel() { return this._velocity; }
		get velocity() { return this._velocity; }
		
		set velRot(v) { this._velocityRotation = v; }
		get velRot() { return this._velocityRotation; }
		set velocityRotation(v) { this._velocityRotation = v; }
		get velocityRotation() { return this._velocityRotation; }
		
		collisionUpdateTo(obj) { // todo: finalize
			if(this.type_physics === 'static') return;
			
			let a = this.getBoundingRect(this._prevPos);
			let b = obj.getBoundingRect();
			
			let t = this.isStaticRectIntersect(b);
			if(!t) {
				this.getChild('Sprite').image = db.car;
				return false;
			}
			this.getChild('Sprite').image = db.player;
			
			
			let cc = 0;
			let c = 1;
			let s = vec2(a.w, a.h).add(b.w, b.h).div(2);
		//	let s = this.globalSize.add(obj.globalSize).div(2); //.div(this.getRootNode().scale);
			let gg = this.globalPosition;
			
			if(a.x > b.x+s.x+cc) {
				this.globalPosition = vec2(b.x+s.x+c, gg.y);
				this.vel.x = this._rebound.x;
			};
			if(a.x < b.x-s.x-cc) {
				this.globalPosition = vec2(b.x-s.x-c, gg.y);
				this.vel.x = -this._rebound.x;
			};
			if(a.y > b.y+s.y+cc) {
				this.globalPosition = vec2(gg.x, b.y+s.y+c);
				this.vel.y = this._rebound.y;
			};
			if(a.y < b.y-s.y-cc) {
				this.globalPosition = vec2(gg.x, b.y-s.y-c);
				this.vel.y = -this._rebound.y;
			};
			
			return t;
		}
		
		collisionUpdate(arr = this._collision_check_objects) {
			for(let i = 0; i < arr.length; i++) {
				if(this !== arr[i]) this.collisionUpdateTo(arr[i]);
			};
		}
		
		_update(dt) {
			this.velRot *= this.resistRot;
			this.rot += this.velRot;
			
			this.vel.inc(this.resist);
			this.pos.add(this.vel);
			
			this.collisionUpdate();
			
			super._update(dt);
		}
	};
	PhysicsBody.prototype[Symbol.toStringTag] = 'PhysicsBody';
	//======================================================================//
	
	
	let Parts = this.Parts = class extends Spatial {
		constructor(p = {}) {
			super(p);
		}
		
		draw(ctx) {
			let pos = this.globalPosition, rot = this.globalRotation;
			let size = vec2(20, 20).inc(this.globalScale);
			
			ctx.rotateOffset(rot, pos);
			
			ctx.globalAlpha = this.globalAlpha;
			ctx.fillStyle = '#000000';
			ctx.fillRect(pos.x - size.x/2, pos.y - size.y/2, size.x, size.y);
			
			super.draw(ctx);
		}
	};
	
	
	/*
			this.sizeadd = p.sizeadd||vec2();
			this.image = p.image;
			
			if(!p.size || p.size.isSame(Vector2.ZERO)) this.size = vec2(this.image.width, this.image.height);
			else {
				let w = p.size.x;
				let h = p.size.y;
				let s = this.image.width/this.image.height;
				if(!w !== !h) this.size = vec2(w?w : h*s, h?h : w/s);
				else this.size = p.size;
			};
	*/
	
	let addOper = (n, c) => {
		let acc = 0;
		
		for(let i = 0; i < c; i++) {
			for(let i = 0; i < c; i++) acc += n;
		};
		
		return acc;
	};
	
	console.log(addOper(4, 4));
	
	
	
	let Player = this.Player = class extends PhysicsBody {
		constructor(p = {}) {
			super(p);
			this.prevPos = this.pos.buf();
			
			this.speed = p.speed||0.2;
			
			this.targetRotation = 0;
			
			this.script_interface.speed = this.speed;
			this.script_interface.resist = this.resist;
		}
	};
};
