renderer = new THREE.WebGLRenderer();
effect = new THREE.StereoEffect(renderer);

effect.setSize( window.innerWidth, window.innerHeight );
renderer.setSize( window.innerWidth, window.innerHeight );

element = renderer.domElement;
container = $('#canvasContainer');
container.append(element);

clock = new THREE.Clock();

var apiString = 'http://localhost:3000/stars';
//var apiString = 'http://star-map.herokuapp.com/stars';

var currentMap;
var saveMainMap;
var zooming;
var shift = false;
var raycaster = new THREE.Raycaster();
var cursor = new THREE.Vector2();
var controls;
var mobileMode = false;
var vrMode = false;
var travelDistance = 0;

$(document).ready(function() {
	mobileMode = checkForMobile();


	var galaxyMap = new Map('galaxy');
	galaxyMap.scene.fog = new THREE.FogExp2(0x4400dd, 0.005);

	$.get(apiString)
	.done(function(stars) {
		galaxyMap.stars = new THREE.Points(createStarsGeometry(stars), createStarsMaterial());

		galaxyMap.scene.add(galaxyMap.stars);

		currentMap = galaxyMap;
		currentMap.camera.position.z = 300;
		currentMap.lastSelected = false;

		if (!mobileMode) {
			currentMap.views = createViewSprites();
			createWebEventListeners();
		} else {
			$('.hide-mobile').css('display', 'none');
			$('.mobile-controls').css('display', 'block');
			initializeControls();
			createMobileEventListeners();
		}

		animate();
	});
});

function render(dt) {
	renderer.render(currentMap.scene, currentMap.camera);

	if(vrMode) {
		effect.render(currentMap.scene, currentMap.camera);
	}
}

function update(dt) {
	resize();

	currentMap.camera.updateProjectionMatrix();

	if(mobileMode) {
		currentMap.camera.position.y -= dt;
		controls.update(dt);
	}

	if (!mobileMode && currentMap.type == 'galaxy') {
		updateGalaxyMap();
	}
}

function animate (t) {
	requestAnimationFrame(animate);

	update(clock.getDelta());
	render(clock.getDelta());
}

function resize() {
	var width = window.innerWidth;
	var height = window.innerHeight;

	currentMap.camera.aspect = width / height;
	currentMap.camera.updateProjectionMatrix();
	renderer.setSize(width, height);
	effect.setSize(width, height);
}

function updateGalaxyMap() {
	raycaster.setFromCamera( cursor, currentMap.camera, 0, 1);	
	var selected = raycaster.intersectObject(currentMap.stars, true);

	if (selected.length) {
		currentMap.selected = selected[0];

		if (currentMap.lastSelected !== currentMap.selected.index) {
			$('.label').text(currentMap.stars.geometry.label[currentMap.selected.index]);
			var viewCount = currentMap.stars.geometry.views[currentMap.selected.index];
			if(viewCount > 0) {
				$('.counter').text(viewCount + (viewCount === 1 ? ' view' : ' views'));
			}	else {
				$('.counter').text('');
			}
			if (currentMap.lastSelectedColor) {
				currentMap.stars.geometry.colors[currentMap.lastSelected].set(currentMap.lastSelectedColor);
			}
			currentMap.lastSelectedColor = new THREE.Color().copy(currentMap.selected.object.geometry.colors[currentMap.selected.index]);
		}
		currentMap.selected.object.geometry.colors[currentMap.selected.index].set( 0xffffff );
		currentMap.lastSelected = currentMap.selected.index;

		currentMap.stars.geometry.colorsNeedUpdate = true;
	} else {
		currentMap.selected = false;
	}
}

function generateSprite(type) {
	var canvas = document.createElement( 'canvas' );
	canvas.width = 16;
	canvas.height = 16;

	var context = canvas.getContext( '2d' );
	var gradient = context.createRadialGradient( canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width / 2 );
	if (type === 'star') {
		gradient.addColorStop( 0.1, 'rgba(255,255,255,1)' );
		gradient.addColorStop( 0.3, 'rgba(255,255,255,0.3)' );
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

function createWebEventListeners() {
	$(document).on('keydown', function(event) {
		if(!zooming) {
			checkInputValues(event);
		}
	});
	$('#zoom-in').on('mousedown', function(event) {
		zoom(1);
	});
	$('#zoom-out').on('mousedown', function(event) {
		zoom(-1);
	});
	$('canvas').on('mousedown', function(event) {
		if (shift) {
			trackDragging({x: event.clientX, y: event.clientY});
		} else if (currentMap.selected) {
			for(var i in currentMap.views) {
				currentMap.scene.remove(currentMap.views[i]);
			}
			currentMap.stars.geometry.views[currentMap.selected.index]++;
			currentMap.views = createViewSprites();
			setUpStarMap(currentMap.stars.geometry.starId[currentMap.selected.index]);
		}
	});
	$(window).on('mousemove', function(event) {
		cursor.x = ( event.clientX / window.innerWidth ) * 2 - 1;
		cursor.y = - ( event.clientY / window.innerHeight ) * 2 + 1;	
	});

	$('.back').on('click', function(event) {
		switchMap();
	});

	$(window).on('mouseup', function(event) {
		zoom(0);
		$('canvas').off('mousemove');
	});
	$(window).on('keyup', function(event) {
		zoom(0);
		shift = false;
	});
}

function createMobileEventListeners() {
	$('#vr-toggle').click(function() {
		toggleVR();
	});
}

function trackDragging(oldCoords) {
	$('canvas').on('mousemove', function(event){
		var deltaX = oldCoords.x - event.clientX;
		var deltaY = oldCoords.y - event.clientY;
		currentMap.camera.position.x += deltaX/10;
		currentMap.camera.position.y -= deltaY/10;
		$('canvas').off('mousemove');
		if(shift) {
			trackDragging({x: event.clientX, y: event.clientY});
		}
	});
}

function checkInputValues(event) {
	if (event.which == 187) {
		zoom(1);
	} else if (event.which == 189) {
		zoom(-1);
	} else if (event.which == 37) {
		zoom(1, 1);
	} else if (event.which == 39) {
		zoom(-1, 1);
	} else if (event.which == 38) {
		zoom(1, -1);
	} else if (event.which == 40) {
		zoom(-1, -1);
	} else if (event.which == 16) {
		shift = true;
	} else {
		zoom(0);
	}
}

function zoom (direction, pan) {
	if (direction) {
		zooming = setInterval(function(){
			if(pan) {
				if (pan > 0) {
					currentMap.camera.position.x -= direction/2;
				} else {
					currentMap.camera.position.y += direction/2;
				}
			} else if(direction > 0 && currentMap.camera.position.z >= 100 || direction < 0 && currentMap.camera.position.z <= 500) {
				currentMap.camera.position.z -= direction/2;
			}
		}, 10);
	} else {
		clearInterval(zooming);
		zooming = false;
	}
}

function createStarsGeometry(stars) {
	var starGeometry = new THREE.Geometry();
	starGeometry.vertices = stars.map(function(star) {
		return new THREE.Vector3( star.x, star.y, star.z);
	});
	starGeometry.colors = stars.map(function(star) {
		var hsl = 'hsl(' + star.h + ', ' + Math.abs(star.s) + '%, ' + Math.floor(star.l) + '%)';
		return new THREE.Color(hsl);
	});
	starGeometry.label = stars.map(function(star) {
		return star.name;
	});
	starGeometry.starId = stars.map(function(star) {
		return star.id;
	});

	starGeometry.views = stars.map(function(star) {
		return star.views;
	});

	starGeometry.rotateY(2.5);
	starGeometry.rotateX(0.2);
	starGeometry.rotateZ(-0.2);

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
	var hsl = 'hsl(' + starData.h + ', ' + Math.floor(starData.l * 1.5) + '%, ' + starData.l + '%)';
	$('.label').text(starData.name);
	$('.info').text(starData.x + ', ' + starData.y + ', ' + starData.z + ' Views: ' + starData.views);
	var geometry = new THREE.SphereGeometry( starData.l, 32, 32 );
	var material = new THREE.MeshBasicMaterial( { color: hsl } );
	var cube = new THREE.Mesh( geometry, material );
	currentMap.scene.add( cube );

	currentMap.camera.position.z = 150;
}

function Map(type) {
	this.type = type;
	this.scene = new THREE.Scene();
	this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 400 );
}

function setUpStarMap (star_id) {
	var starMap = new Map('star');
	switchMap(starMap);
	$('.back').css('display', 'block');
	$('.zoom-controls').css('display', 'none');
	$.get(apiString + '/' + star_id)
	.then(function(starData) {
		createOneStarGeometry(starData);
	});
}

function switchMap (map) {
	if (map) {
		saveMainMap = currentMap;
		currentMap = map;
	} else {
		currentMap = saveMainMap;
		$('.zoom-controls').css('display', 'block');
		$('.back').css('display', 'none');
		$('.info').text('');
	}
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

function checkForMobile() {
	try {
		document.createEvent("TouchEvent");
		return true;
	} catch(error) {
		return false;
	}
}

function toggleVR() {
	if (vrMode) {
		vrMode = false;
		renderer.setSize( window.innerWidth, window.innerHeight );
		return;
	}
	vrMode = true;
}

function initializeControls() {
	controls = new THREE.OrbitControls(currentMap.camera, element);
	controls.target.set(
		currentMap.camera.position.x + 0.1,
		currentMap.camera.position.y,
		currentMap.camera.position.z
	);

	window.addEventListener('deviceorientation', setOrientationControls, true);
}

function setOrientationControls(event) {
	if (!event.alpha) {
		return;
	}

	controls = new THREE.DeviceOrientationControls(currentMap.camera, true);
	controls.connect();
	controls.update();

	element.addEventListener('click', fullscreen, false);

	window.removeEventListener('deviceorientation', setOrientationControls, true);
}

function fullscreen() {
	if (container.requestFullscreen) {
		container.requestFullscreen();
	} else if (container.msRequestFullscreen) {
		container.msRequestFullscreen();
	} else if (container.mozRequestFullScreen) {
		container.mozRequestFullScreen();
	} else if (container.webkitRequestFullscreen) {
		container.webkitRequestFullscreen();
	}
}
