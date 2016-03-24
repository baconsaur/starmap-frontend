function generateSprite(type) {
	var canvas = document.createElement( 'canvas' );
	canvas.width = 16;
	canvas.height = 16;

	var context = canvas.getContext( '2d' );
	var gradient = context.createRadialGradient( canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width / 2 );
	if (type === 'star') {
		gradient.addColorStop( 0.3, 'rgba(255,255,255,1)' );
		gradient.addColorStop( 0.6, 'rgba(255,255,255,0.5)' );
		gradient.addColorStop( 0.9, 'rgba(255,255,255,0)' );
	} else if (type === 'view') {
		gradient.addColorStop( 0.7, 'rgba(255,255,255,0.5)' );
		gradient.addColorStop( 1, 'rgba(255,255,255,0)' );
	} else if (type === 'glow') {
		gradient.addColorStop( 0, 'rgba(255,255,255,0.015)' );
		gradient.addColorStop( 1, 'rgba(255,255,255,0)' );
	} else if (type === 'corona') {
		gradient.addColorStop( 0, 'rgba(255,255,255,1)' );
		gradient.addColorStop( 0.5, 'rgba(255,255,255,0.3)' );
		gradient.addColorStop( 1, 'rgba(255,255,255,0)' );
	} else {
		gradient.addColorStop( 0.8, 'rgba(255,255,255,0.7)' );
		gradient.addColorStop( 0.85, 'rgba(255,255,255,0.7)' );
		gradient.addColorStop( 0.9, 'rgba(255,255,255,1)' );
		gradient.addColorStop( 1, 'rgba(255,255,255,0)' );
	}
	context.fillStyle = gradient;
	context.fillRect( 0, 0, canvas.width, canvas.height );

	return canvas;
}

function createViewSprites() {
	var sprites = [];
	for (var i in currentMap.stars.geometry.vertices) {
		if(currentMap.stars.geometry.views[i]) {
			var	size = currentMap.stars.geometry.views[i];
			var material = new THREE.SpriteMaterial({
				map: new THREE.CanvasTexture(generateSprite('view')),
				color: 0x55ff77,
//				blending: THREE.AdditiveBlending
				fog: false
			});
			var sprite = new THREE.Sprite(material);
			sprite.scale.set(size, size, 1);
			sprite.position.copy(currentMap.stars.geometry.vertices[i]);
			sprite.starId = currentMap.stars.geometry.starId[i];
			sprite.visible = false;

			sprites.push(sprite);
			currentMap.scene.add(sprite);
		}
	}
	return sprites;
}

function createStarsGeometry(stars) {
	var starGeometry = new THREE.Geometry();
	starGeometry.vertices = stars.map(function(star) {
		return new THREE.Vector3( star.x, star.y, star.z);
	});
	starGeometry.colors = stars.map(function(star) {
		var rgb = new THREE.Color('rgb(' + Math.floor(star.r) + ', ' + Math.floor(star.g) + ', ' + Math.floor(star.b) +')');
		var hsl = rgb.getHSL();
		return new THREE.Color().setHSL(hsl.h, 1, hsl.l);
	});
	starGeometry.label = stars.map(function(star) {
		return star.name;
	});
	starGeometry.starId = stars.map(function(star) {
		return star.id;
	});
	starGeometry.distance = stars.map(function(star) {
		return star.distance;
	});
	starGeometry.mag = stars.map(function(star) {
		return star.mag;
	});
	starGeometry.blue = stars.map(function(star) {
		return star.b > star.r;
	});
	starGeometry.red = stars.map(function(star) {
		return star.r > star.b;
	});
	starGeometry.exoplanets = stars.map(function(star) {
		if (star.name == "Sun") {
			return 9;	
		}
		return star.exoplanets;
	});
	starGeometry.hidden = stars.map(function(star) {
		return false;
	});

	starGeometry.views = stars.map(function(star) {
		return star.views;
	});

	return starGeometry;
}

function createGlowGeometry(stars){
	var starGeometry = new THREE.Geometry();
	var brightStars = [];
	for (var i=0;i<stars.length;i+=100) {
		brightStars.push(stars[i]);
	}
	starGeometry.vertices = brightStars.map(function(star) {
		return new THREE.Vector3( star.x, star.y, star.z);
	});
	return starGeometry;
}

function createStarsMaterial() {
	var sprite = new THREE.CanvasTexture(generateSprite('star'));
	return new THREE.PointsMaterial({
		size: 1,
		vertexColors: THREE.VertexColors,
		map: sprite,
		blending: THREE.AdditiveBlending,
		transparent: true,
		depthWrite: false,
	});
}

function createGlowMaterial() {
	var sprite = new THREE.CanvasTexture(generateSprite('glow'));
	if (mobileMode) {
		return new THREE.PointsMaterial({
			size: 150,
			color: new THREE.Color(0x4A0887),
			map: sprite,
			blending: THREE.AdditiveBlending,
			transparent: true,
			depthWrite: false,
			fog: false
		});
	}
	return new THREE.PointsMaterial({
		size: 200,
		color: new THREE.Color(0x9335eb),
		map: sprite,
		blending: THREE.AdditiveBlending,
		transparent: true,
		depthWrite: false,
		fog: false
	});
}

function createOneStarGeometry(starData) {
	$('.label').text(starData.name);
	$('.info').html('<p>Distance: ' + starData.distance + ' light years</p>' + (starData.exoplanets > 0 ? '<p>Planets: ' + starData.exoplanets + '</p>' : ''));
	$('.search').css('display', 'none');
	
	var geometry = new THREE.SphereGeometry( starData.mag, 32, 32 );
	var corona = new THREE.Sprite(new THREE.SpriteMaterial({
		map: glowTexture,
		blending: THREE.AdditiveBlending,
		color: 'rgb(' + Math.floor(starData.r) + ', ' + Math.floor(starData.g) + ', ' + Math.floor(starData.b) +')'
	}));
	var glow = new THREE.Sprite(new THREE.SpriteMaterial({
		map: new THREE.CanvasTexture(generateSprite('corona')),
		blending: THREE.AdditiveBlending,
		color: 'rgb(' + Math.floor(starData.r) + ', ' + Math.floor(starData.g) + ', ' + Math.floor(starData.b) +')'
	}));

	var material = new THREE.MeshBasicMaterial( { map: starTexture, color: 'rgb(' + Math.floor(starData.r) + ', ' + Math.floor(starData.g) + ', ' + Math.floor(starData.b) +')' } );
	currentMap.sphere = new THREE.Mesh( geometry, material );

	corona.scale.set(starData.mag * 2.5, starData.mag * 2.5, 1);
	glow.scale.set(starData.mag * 1.2, starData.mag * 1.2, 1);
	corona.position.setZ(30);
	glow.position.setZ(100);

	currentMap.scene.add(glow);
	currentMap.scene.add(corona);
	currentMap.scene.add(currentMap.sphere);

	currentMap.camera.position.z = 150;
}
