'use strict';
let nodes_ns = new function() {
	let isPointRectIntersect = (, arr) => {
		let box = b.getDynamicCollisionBox();
		
		let d = 0;
		for(let c = a.length - 1, n = 0; n < a.length; c = n++) {
			a[n].y > this.y != a[c].y > this.y &&
				this.x < (a[c].x - a[n].x) * (this.y - a[n].y) / (a[c].y - a[n].y) + a[n].x &&
				(d = !d);
		};
		return d;
	};
	
	
	let Node = this.Node = class extends Child {
		constructor(p = {}) {
			super();
			
			this._isRenderDebug = false;
			
			this._rotation = p.rotation||0;
			this._position = (p.pos || p.position || vec2()).buf();
			this._scale = (p.scale || vec2(1, 1)).buf();
		}
		
		get pos() { return this.position; }
		get scale() { return this._scale; }
		get position() { return this._position; }
		
		set rotation(v) { this._rotation = v; }
		get rotation() { return this._rotation; }
		
		get globalPos() { return this.globalPosition; }
		get globalScale() { return this._getRelativeScale(Child.MAX_CHILDREN); }
		get globalRotation() { return this._getRelativeRotation(Child.MAX_CHILDREN); }
		get globalPosition() { return this._getRelativePosition(Child.MAX_CHILDREN); }
		
		get globalIsRenderDebug() { return this._getRelativeIsRenderDebug(Child.MAX_CHILDREN); }
		
		_getRelativeIsRenderDebug(nl = 0) {
			if(nl === 0) return this._isRenderDebug;
			
			let v = this._isRenderDebug;
			let tt = this.getChainParent();
			for(let i = 0; i < Math.min(nl, tt.length, Child.MAX_CHILDREN); i++) v |= tt[i]._isRenderDebug;
			return v;
		}
		
		_getRelativeScale(nl = 0) {
			if(nl === 0) return this.scale.buf();
			
			let v = this.scale.buf();
			let tt = this.getChainParent();
			for(let i = 0; i < Math.min(nl, tt.length, Child.MAX_CHILDREN); i++) v.inc(tt[i].scale);
			return v;
		}
		
		_getRelativeRotation(nl = 0) {
			if(nl === 0) return this.rotation;
			
			let v = this.rotation;
			let tt = this.getChainParent();
			
			for(let i = 0; i < Math.min(nl, tt.length, Child.MAX_CHILDREN); i++) v += tt[i].rotation;
			return v;
		}
		
		_getRelativePosition(nl = 0) {
			if(nl === 0) return this.position.buf();
			
			let v = vec2();
			let tt = this.getChainParent();
			let t = this;
			
			for(let i = 0; i < Math.min(nl, tt.length, Child.MAX_CHILDREN); i++) {
				let vv = t.position.buf();
				if(tt[i].rotation !== 0) vv.angle = tt[i].rotation;
				v.plus(vv);
				
				t = tt[i];
			};
			v.plus(t.position);
			return v;
		}
		
		renderDebug(ctx, pos = this.globalPos, c = 30) {
			ctx.beginPath();
			ctx.lineWidth = 1.5;
			ctx.strokeStyle = '#3377ee';
			ctx.moveTo(pos.x-c, pos.y);
			ctx.lineTo(pos.x+c, pos.y);
			ctx.moveTo(pos.x, pos.y-c);
			ctx.lineTo(pos.x, pos.y+c);
			ctx.stroke();
		}
		
		_draw(ctx, pos = this.globalPos) {
			if(this.globalIsRenderDebug) this.renderDebug(ctx, pos, 30);
		}
		
		draw(ctx, pos = this.globalPos) {
			ctx.save();
			this._draw(ctx, pos);
			ctx.restore();
			
			let arr = this._children;
			for(let i = 0; i < arr.length; i++) arr[i].draw(ctx);
		}
		
		appendChild(...args) { return super.appendChild(...args); } // todo: cache
		removeChild(...args) { return super.appendChild(...args); } // todo: cache
	};
	Node.prototype[Symbol.toStringTag] = 'Node';
	
	
	let Spatial = this.Spatial = class extends Node {
		constructor(p = {}) {
			super(p);
			
			this.visible = p.visible||true;
			this._size = (p.size || vec2()).buf();
			
			this._rotationOffsetPoint = (p.rotationOffsetPoint || vec2()).buf();
		}
		
		get size() { return this._size; }
		get globalSize() { return this.globalScale.inc(this._size); }
	};
	Spatial.prototype[Symbol.toStringTag] = 'Spatial';
	
	
	let Sprite = this.Sprite = class extends Spatial {
		constructor(p = {}) {
			super(p);
			
			this.image = p.image;
			this.alpha = p.alpha !== undefined ? p.alpha : 1;
			
			this._size = vec2(p.size?.x||this.image.width, p.size?.y||this.image.height);
			
			this._drawAngleOffset = p.drawAngleOffset||0;
			this._drawOffset = (p.drawOffset || vec2()).buf();
		}
		
		get alpha() { return this._alpha; }
		set alpha(v) { return this._alpha = Math.min(1, Math.max(0, v)); }
		get globalAlpha() { return this._getRelativeAlpha(Child.MAX_CHILDREN); }
		
		_getRelativeAlpha(nl = 0) {
			if(nl === 0) return this.alpha;
			
			let v = this.alpha;
			let tt = this.getChainParent();
			for(let i = 0; i < Math.min(nl, tt.length, Child.MAX_CHILDREN); i++) v *= tt[i].alpha || 1;
			return v;
		}
		
		renderDebug(ctx, pos = this.globalPos, size = this.globalSize, drawPos) {
			drawPos = drawPos || pos.buf().plus(this._drawOffset).minus(size.buf().div(2));
			
			ctx.beginPath();
			ctx.globalAlpha = this.globalAlpha+0.2;
			ctx.lineWidth = 1.5;
			ctx.strokeStyle = '#ffff00';
			ctx.strokeRect(drawPos.x, drawPos.y, size.x, size.y);
			
			ctx.moveTo(pos.x-size.x/3, pos.y);
			ctx.lineTo(pos.x+size.x/3, pos.y);
			ctx.moveTo(pos.x, pos.y-size.y/3);
			ctx.lineTo(pos.x, pos.y+size.y/3);
			ctx.stroke();
		}
		
		_draw(ctx, pos = this.globalPos, size = this.globalSize) {
			if(!this.visible) return;
			
			ctx.beginPath();
			ctx.globalAlpha = this.globalAlpha;
			
			if(this.globalRotation !== 0) ctx.rotateOffset(this.globalRotation+this._drawAngleOffset, pos.buf().plus(this._rotationOffsetPoint));
			
			let drawPos = pos.buf().plus(this._drawOffset).minus(size.buf().div(2));
			
			ctx.drawImage(this.image, drawPos.x, drawPos.y, size.x, size.y);
			
			if(this.globalIsRenderDebug) this.renderDebug(ctx, pos, size, drawPos);
		}
	};
	Sprite.prototype[Symbol.toStringTag] = 'Sprite';
	
	
	let CollisionObject = this.CollisionObject = class extends Spatial {
		constructor(p = {}) {
			super(p);
		}
		
		getStaticCollisionBox() {
			let hSize = this.globalSize.div(2);
			
			return [
				this.pos.buf().minus(hSize), this.pos.buf().plus(hSize.x, -hSize.y),
				this.pos.buf().plus(-hSize.x, hSize.y), this.pos.buf().plus(hSize), 
			];
		}
		
		getDynamicCollisionBox() {
			let pos = this.globalPos;
			let rotation = this.globalRotation;
			let hSize = this.globalSize.div(2);
			
			let lt = hSize.buf().invert(),
				rt = vec2(hSize.x, -hSize.y),
				rb = hSize.buf(),
				lb = vec2(-hSize.x, hSize.y);
			
			lt.angle = rt.angle = rb.angle = lb.angle = rotation;
			
			return [lt.plus(pos), rt.plus(pos), rb.plus(pos), lb.plus(pos)];
		}
		
		getCollisionBox() {
			return this.globalRotation === 0 ? this.getStaticCollisionBox() : this.getDynamicCollisionBox();
		}
		
		getBoundingRect() {
			let pos = this.globalPos, size = this.globalSize;
			return {
				x: pos.x, w: size.x, width: size.x,
				y: pos.y, h: size.y, height: size.y,
				
				left: pos.x - size.x/2,
				right: pos.x + size.x/2,
				top: pos.y - size.y/2,
				bottom: pos.y + size.y/2
			};
		}
		
		isStaticRectIntesect(b) {
			let a = this.getBoundingRect(), b = b.getBoundingRect();
			return a.right > b.left && b.right > a.left && a.bottom > b.top && b.bottom > a.top;
		}
		
		isDynamicRectIntesect(b) {
			
		}
		
		isIntersect(b) {
			return this.globalRotation === 0 ? this.isStaticRectIntesect(b) : this.isDynamicRectIntesect(b);
		}
		
		renderDebug(ctx, pos = this.globalPos, size = this.globalSize) {
			let box = this.getCollisionBox();
			
			ctx.beginPath();
			ctx.globalAlpha = 0.5;
			ctx.lineWidth = 1.5;
			ctx.fillStyle = '#227777';
			ctx.strokeStyle = '#33ffff';
			ctx.moveTo(box[0].x, box[0].y);
			for(let i = 1; i < box.length; i++) ctx.lineTo(box[i].x, box[i].y);
			ctx.closePath();
			ctx.fill();
			ctx.stroke();
		}
	};
	CollisionObject.prototype[Symbol.toStringTag] = 'CollisionObject';
	
	
	let PhysicsBody = this.PhysicsBody = class extends CollisionObject {
		constructor(p = {}) {
			super(p);
			
			this._velocity = vec2(); // motion
			this._prevPos = this.globalPos;
		}
		
		get vel() { return this.velocity; }
		get velocity() { return this._velocity; }
		
		collisionHandler() {
			
		}
		
		updata(dt) {
			this.collisionHandler();
		}
	};
	PhysicsBody.prototype[Symbol.toStringTag] = 'PhysicsBody';
	
	
	let NodeTree = this.NodeTree = class extends Node {
		constructor(p = {}) {
			super(p);
		}
	};
	NodeTree.prototype[Symbol.toStringTag] = 'NodeTree';
	
	
	
	
	
	let BaseNode = this.BaseNode = class extends Child {
		constructor(p = {}) {
			super();
			this.type = 'BaseNode';
			
			this.pos = p.pos||vec2();
			this.vel = p.vel||vec2();
			this.size = p.size||vec2();
			this.scale = p.scale||vec2(1, 1);
			
			this.angle = 0;
			this.offsetAngle = p.offsetAngle||0;
			this.alpha = p.alpha !== undefined ? p.alpha : 1;
		}
		get globalPos() {
			let pos = this.pos.buf();
			let tt = this.getChainParent();
			for(let i = 0; i < tt.length; i++) pos.plus(tt[i].pos);
			return pos;
		}
		get globalScale() {
			let scale = this.scale.buf();
			let tt = this.getChainParent();
			for(let i = 0; i < tt.length; i++) scale.inc(tt[i].scale);
			return scale;
		}
		
		setPos(v) { return this.pos.set(v).buf(); }
		setPosC(v) { return this.pos.set(v.buf().minus(this.size.buf().inc(this.globalScale).div(2))).buf(); }
		getPos() { return this.pos.buf(); }
		getPosC() { return this.pos.buf().plus(this.size.buf().inc(this.globalScale).div(2)); }
		
		moveAngle(mv, a) { return this.pos.moveAngle(mv, a); }
		moveTo(v, mv) { return this.pos.moveTo(v, mv); }
		moveToC(v, mv) { return this.pos.moveTo(v.buf().minus(this.size.buf().inc(this.globalScale).div(2)), mv); }
		moveTime(v, t) { return this.pos.moveTime(v, t); }
		moveTimeC(v, t) { return this.pos.moveTime(v.buf().minus(this.size.buf().inc(this.globalScale).div(2)), t); }
		
		getBoundingRect() {
			let pos = this.globalPos, scale = this.globalScale;
			return {
				x: pos.x, w: this.size.x*scale.x,
				y: pos.y, h: this.size.y*scale.y,
			};
		}
		isStaticRectIntesect(b) {
			if(b.getBoundingRect) b = getBoundingRect();
			let a = this.getBoundingRect();
			return a.x+a.w > b.x && b.x+b.w > a.x && a.y+a.h > b.y && b.y+b.h > a.y;
		}
	};
	
	
	let ImageNode = this.ImageNode = class extends BaseNode {
		constructor(p = {}) {
			super(p);
			this.type = 'ImageNode';
			this._isRenderBorder = false;
			
			this.sizePlus = p.sizePlus||vec2();
			this.image = p.image;
			
			if(!p.size || p.size.isSame(Vector2.ZERO)) this.size = vec2(this.image.width, this.image.height);
			else {
				let w = p.size.x;
				let h = p.size.y;
				let s = this.image.width/this.image.height;
				if(!w !== !h) this.size = vec2(w?w : h*s, h?h : w/s);
				else this.size = p.size;
			};
			
			if(p.posC) this.setPosC(p.posC);
		}
		
		draw(ctx, pos = this.globalPos) {
			ctx.save();
		//	let pos = this.pos;//.buf().floor().plus(0.5);
			if(this.angle !== 0) ctx.setTranslate(this.offsetAngle+this.angle, this.getPosC());
			ctx.globalAlpha = this.alpha;
			ctx.drawImage(this.image, pos.x, pos.y, this.size.x*this.globalScale.x+this.sizePlus.x, this.size.y*this.globalScale.y+this.sizePlus.y);
			
			if(this._isRenderBorder) {
				ctx.strokeStyle = '#ffff00';
				ctx.strokeRect(this.pos.x, this.pos.y, this.size.x*this.globalScale.x, this.size.y*this.globalScale.y);
				ctx.strokeRect(this.pos.x-ctx.lineWidth/2, this.pos.y-ctx.lineWidth/2, this.size.x*this.globalScale.x+ctx.lineWidth, this.size.y*this.globalScale.y+ctx.lineWidth);
			};
			ctx.restore();
		}
	};
	
	
	let Player = this.Player = class extends ImageNode {
		constructor(p = {}) {
			super(p);
			this.prevPos = this.pos.buf();
			
			this.speed = p.speed||1;
			this.resist = p.resist||0.9;
			
		//	this.physicsBox = new PhysicsBox(this.getBoundingRect());
		}
		
		hasCollide(b) {
			if(this.isStaticRectIntesect(b)) {
				let dir = null;
				
				let size = this.globalScale.inc(this.size);
				
				let a = {
					x: this.prevPos.x,
					w: size.x,
					y: this.prevPos.y,
					h: size.y
				};
				//*
				if(a.x <= b.x - a.w) dir = 'left'
				if(a.x >= b.x + b.w) dir = 'right';
				if(a.y <= b.y - a.h) dir = 'top';
				if(a.y >= b.y + b.h) dir = 'bottom';
				
				this.emit('collide', dir, a, b);
				this.collideHandler(dir, a, b);
			};
		}
		
		collideHandler(dir, a, b) {
			let c = 0;
			
			if(dir === 'left') {
				this.vel.x = 0;
				this.pos.x = b.x - a.w + c;
			} else if(dir === 'right') {
				this.vel.x = 0;
				this.pos.x = b.x + b.w - c;
			} else if(dir === 'top') {
				this.vel.y = 0;
				this.pos.y = b.y - a.h + c;
			} else if(dir === 'bottom') {
				this.vel.y = 0;
				this.pos.y = b.y + b.h - c;
			};
		}
		
		updata() {
			this.vel.inc(this.resist);
			this.pos.plus(this.vel);
		}
		
		draw(ctx, pos = this.globalPos, scale = this.globalScale) {
			super.draw(ctx, pos, scale);
			
			ctx.save();
			ctx.beginPath();
			ctx.drawImage(this.image, pos.x, pos.y, this.size.x*scale.x, this.size.y*scale.y);
			ctx.restore();
		}
	};
};
