renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

var currentMap;
var saveMainMap;
var zooming;
var shift = false;
var raycaster = new THREE.Raycaster();
var cursor = new THREE.Vector2();

$(document).ready(function() {
	createEventListeners();
	var galaxyMap = new Map('galaxy');

	$.get('http://localhost:3000/stars')
	.done(function(stars) {
		galaxyMap.stars = new THREE.Points(createStarGeometry(stars), createStarMaterial());
		galaxyMap.scene.add(galaxyMap.stars);

		currentMap = galaxyMap;
		currentMap.camera.position.z = 200;
		currentMap.lastSelected = false;

		render();
	});
});

function render () {
	requestAnimationFrame( render );

	if (currentMap.type == 'galaxy') {
		updateGalaxyMap();
	}

	renderer.render(currentMap.scene, currentMap.camera);
}

function updateGalaxyMap() {
	raycaster.setFromCamera( cursor, currentMap.camera, 0, 1);	
	var selected = raycaster.intersectObjects(currentMap.scene.children, true);

	if (selected.length) {
		currentMap.selected = selected[0];

		if (currentMap.lastSelected !== currentMap.selected.index) {
			$('.label').text(currentMap.stars.geometry.label[currentMap.selected.index]);
			if (currentMap.lastSelectedColor) {
				currentMap.stars.geometry.colors[currentMap.lastSelected].set(currentMap.lastSelectedColor);
			}
			currentMap.lastSelectedColor = new THREE.Color().copy(currentMap.selected.object.geometry.colors[currentMap.selected.index]);
		}
		currentMap.selected.object.geometry.colors[currentMap.selected.index].set( 0x55eeff );
		currentMap.lastSelected = currentMap.selected.index;

		currentMap.stars.geometry.colorsNeedUpdate = true;
	} else {
		currentMap.selected = false;
	}
}

function starSprite() {
	var canvas = document.createElement( 'canvas' );
	canvas.width = 16;
	canvas.height = 16;

	var context = canvas.getContext( '2d' );
	var gradient = context.createRadialGradient( canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width / 2 );
	gradient.addColorStop( 0.25, 'rgba(255,255,255,1)' );
	gradient.addColorStop( 0.4, 'rgba(255,255,255,0.5)' );
	gradient.addColorStop( 0.8, 'rgba(255,255,255,0)' );
	context.fillStyle = gradient;
	context.fillRect( 0, 0, canvas.width, canvas.height );

	return canvas;
}

function createEventListeners() {
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
					currentMap.camera.position.x -= direction;
				} else {
					currentMap.camera.position.y += direction;
				}
			} else if(direction > 0 && currentMap.camera.position.z >= 100 || direction < 0 && currentMap.camera.position.z <= 300) {
				currentMap.camera.position.z -= direction;
			}
		}, 10);
	} else {
		clearInterval(zooming);
		zooming = false;
	}
}

function createStarGeometry(stars) {
	var starGeometry = new THREE.Geometry();
	starGeometry.vertices = stars.map(function(star) {
		return new THREE.Vector3( star.x, star.y, star.z);
	});
	starGeometry.colors = stars.map(function(star) {
		var hsl = 'hsl(' + star.h + ', ' + Math.abs(star.s) + '%, ' + star.l + '%)';
		return new THREE.Color(hsl);
	});
	starGeometry.label = stars.map(function(star) {
		return star.name;
	});
	starGeometry.starId = stars.map(function(star) {
		return star.id;
	});
	starGeometry.rotateY(2.5);
	starGeometry.rotateX(0.2);
	starGeometry.rotateZ(-0.2);

	return starGeometry;
}

function createStarMaterial() {
	var sprite = new THREE.CanvasTexture(starSprite());
	return new THREE.PointsMaterial({
		size: 0.9,
		vertexColors: THREE.VertexColors,
		map: sprite,
		blending: THREE.AdditiveBlending,
		transparent: true,
		depthWrite: false,
	});
}

function Map(type) {
	this.type = type;
	this.scene = new THREE.Scene();
	this.scene.fog = new THREE.FogExp2(0x5500dd, 0.01);
	this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );
}

function setUpStarMap (star_id) {
	var starMap = new Map('star');
	switchMap(starMap);
	$('.label').text(star_id);
	$('.back').css('display', 'block');
	$('.zoom-controls').css('display', 'none');
}

function switchMap (map) {
	if (map) {
		saveMainMap = currentMap;
		currentMap = map;
	} else {
		currentMap = saveMainMap;
		$('.zoom-controls').css('display', 'block');
		$('.back').css('display', 'none');
	}
}

