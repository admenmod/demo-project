'use strict';
let physics_ns = new function() {
	let registerOfPhysicalObjects = this.registerOfPhysicalObjects = {
		objects: [],
		register(obj) {
			if(this.objects.includes(obj)) return;
			this.objects.push(obj);
		},
		updata() {
			let arr = this.objects;
			
			
		}
	};
	
	
	let PhysicsBox = this.PhysicsBox = class {
		constructor(p) {
			this.x = p.x;
			this.y = p.y;
			this.w = p.w;
			this.h = p.h;
		}
		
		hasCollide(b) {
			if(this.isStaticIntersect(b)) {
				let dir = null;
				
				let a = {
					x: this.prevPos.x, w: this.w,
					y: this.prevPos.y, h: this.h
				};
				
				if(a.x <= b.x - a.w) dir = 'left'
				if(a.x >= b.x + b.w) dir = 'right';
				if(a.y <= b.y - a.h) dir = 'top';
				if(a.y >= b.y + b.h) dir = 'bottom';
				
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
	};
	
	
};
