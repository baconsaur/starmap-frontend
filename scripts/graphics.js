function generateSprite(type) {
	var canvas = document.createElement( 'canvas' );
	canvas.width = 16;
	canvas.height = 16;

	var context = canvas.getContext( '2d' );
	var gradient = context.createRadialGradient( canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width / 2 );
	if (type === 'star') {
		gradient.addColorStop( 0.3, 'rgba(255,255,255,1)' );
		gradient.addColorStop( 0.6, 'rgba(255,255,255,0.3)' );
		gradient.addColorStop( 0.9, 'rgba(255,255,255,0)' );
	} else if (type === 'view') {
		gradient.addColorStop( 0.7, 'rgba(255,255,255,0.15)' );
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
				blending: THREE.AdditiveBlending
			});
			var sprite = new THREE.Sprite(material);
			sprite.scale.set(size, size, 1);
			sprite.position.copy(currentMap.stars.geometry.vertices[i]);
			sprite.starId = currentMap.stars.geometry.starId[i];

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
		return new THREE.Color('rgb(' + Math.floor(star.r) + ', ' + Math.floor(star.g) + ', ' + Math.floor(star.b) +')');
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

function createOneStarGeometry(starData) {
	console.log(starData);
	$('.label').text(starData.name);
	$('.info').text('Distance: ' + starData.distance + ' light years');
	$('.search').css('display', 'none');
	var geometry = new THREE.SphereGeometry( starData.mag, 32, 32 );
	var material = new THREE.MeshBasicMaterial( { color: 'rgb(' + Math.floor(starData.r-50) + ', ' + Math.floor(starData.g-50) + ', ' + Math.floor(starData.b-50) +')' } );
	var cube = new THREE.Mesh( geometry, material );
	currentMap.scene.add( cube );

	currentMap.camera.position.z = 150;
}
