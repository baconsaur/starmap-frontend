socket = io('http://localhost:3000');
//socket = io('http://star-map.herokuapp.com');
var currentMap;
var saveMainMap;
var zooming;
var shift = false;
var alt = false;
var raycaster = new THREE.Raycaster();
var cursor = new THREE.Vector2();
var controls;
var mobileMode = false;
var vrMode = false;
var travelDistance = 0;
var filters = {
	red: false,
	blue: false,
	exoplanets: false,
	distance: false,
	mag: false
};
var filterValues = {
	mag: 50,
	distance: 100,
	search : ''
};
var userID;
var users = {};
var shipModel;
var starTexture;
var glowTexture;
var glowAnimator;
var starAnimator;

var apiString = 'http://localhost:3000/stars';
//var apiString = 'http://star-map.herokuapp.com/stars';

renderer = new THREE.WebGLRenderer({alpha: true}) ;
effect = new THREE.StereoEffect(renderer);

effect.setSize( window.innerWidth, window.innerHeight );
renderer.setSize( window.innerWidth, window.innerHeight );

var element = renderer.domElement;
var container = $('#canvasContainer');
container.append(element);

clock = new THREE.Clock();

function init() {
	mobileMode = checkForMobile();

	var galaxyMap = new Map('galaxy');
	galaxyMap.scene.fog = new THREE.FogExp2(0x4400dd, 0.004);

	var textureLoader = new THREE.TextureLoader();
	var textureFlare0 = textureLoader.load( "/lensflare0.png" );
	var textureFlare2 = textureLoader.load( "/lensflare2.png" );
	var textureFlare3 = textureLoader.load( "/lensflare3.png" );
	var shipTexture = textureLoader.load('scripts/ship.png');
	starTexture = textureLoader.load('scripts/sun_texture.png');
	glowTexture = textureLoader.load('scripts/flare_texture.png');

	starAnimator = new TextureAnimator( starTexture, 5, 5, 25, 10 );
	glowAnimator = new TextureAnimator( glowTexture, 5, 5, 25, 20 );

	var loader = new THREE.JSONLoader();

	loader.load('scripts/ship.js', function ( geometry ) {
		shipModel = new THREE.Mesh( geometry, new THREE.MeshPhongMaterial({
			map: shipTexture,
			specular: 0x999977,
			shininess: 20
		}));
	});

	$.get(apiString)
	.done(function(stars) {
		galaxyMap.stars = new THREE.Points(createStarsGeometry(stars), createStarsMaterial());
		galaxyMap.scene.add(galaxyMap.stars);

		currentMap = galaxyMap;
		currentMap.lastSelected = false;

		currentMap.glow = new THREE.Points(createGlowGeometry(stars), createGlowMaterial());
		currentMap.scene.add(currentMap.glow);

		currentMap.ambientLight = new THREE.AmbientLight( 0xa097a5 );
		currentMap.directionalLight = new THREE.DirectionalLight( 0xdddd99, 1 );
		currentMap.directionalLight.position.set( -0.2, 0.2, 0.1 );

		currentMap.scene.add( currentMap.directionalLight );
		currentMap.scene.add( currentMap.ambientLight );

		var flareColor = new THREE.Color( 0xffffff );
		var lensFlare = new THREE.LensFlare( textureFlare0, 256, 0.0, THREE.AdditiveBlending, flareColor );

		lensFlare.add( textureFlare2, 256, 0.0, THREE.AdditiveBlending );
		lensFlare.add( textureFlare2, 256, 0.0, THREE.AdditiveBlending );
		lensFlare.add( textureFlare2, 256, 0.0, THREE.AdditiveBlending );

		lensFlare.add( textureFlare3, 40, 0.3, THREE.AdditiveBlending );
		lensFlare.add( textureFlare3, 85, 0.5, THREE.AdditiveBlending );
		lensFlare.add( textureFlare3, 128, 0.7, THREE.AdditiveBlending );
		lensFlare.add( textureFlare3, 50, 0.85, THREE.AdditiveBlending );
		lensFlare.add( textureFlare3, 256, 0.9, THREE.AdditiveBlending );
		lensFlare.add( textureFlare3, 90, 1.0, THREE.AdditiveBlending );
		
		lensFlare.position.set(0,0,0);

		currentMap.scene.add( lensFlare );

		socket.emit('new', {position: {x: currentMap.camera.position.x, y: currentMap.camera.position.y, z: currentMap.camera.position.z}, rotation: {x: currentMap.camera.rotation.x, y: currentMap.camera.rotation.y, z: currentMap.camera.rotation.z}});		
		userID = '/#' + socket.io.engine.id;

		if (!mobileMode) {
			currentMap.camera.position.z = 200;
			currentMap.views = createViewSprites();
			createWebEventListeners();
		} else {
			currentMap.camera.position.z = 200;
			$('.hide-mobile').css('display', 'none');
			$('.mobile-controls').css('display', 'block');
			initializeControls();
			createMobileEventListeners();
		}

		animate();
	});
}

function checkForMobile() {
	try {
		document.createEvent("TouchEvent");
		return true;
	} catch(error) {
		return false;
	}
}

function createWebEventListeners() {
	$(document).on('keydown', function(event) {
		if(event.target.id === "search") {
			toggleSettings(event);	
		}

		if(!zooming) {
			checkInputValues(event);
		}
	});
	$('#search').on('focus', function(event) {
		event.target.value = '';
		filterValues.search = '';
		handleStarVisibility();
	});
	$('#zoom-in').on('mousedown', function(event) {
		zoom(1);
	});
	$('#zoom-out').on('mousedown', function(event) {
		zoom(-1);
	});
	$('canvas').on('mousedown', function(event) {
		if (shift || alt) {
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
		alt = false;
		shift = false;
	});

	$('input').on('change', function(event) {
		toggleSettings(event);
	});

	$('.search h2').on('click', function(event) {
		$('.search').toggleClass('maximized');
		if($('.search').hasClass('maximized')) {
			$('.search h2').text('Hide');
			$('.search').animate({
				'width': '20%',
				'top': '0'
			}, 'fast');	
		} else {
			$('.search h2').text('Settings');
			$('.search').animate({
				'width': '4em',
				'top': '-14em'
			}, 'fast');	
		}
	});
}

function createMobileEventListeners() {
	$('canvas').on('touchstart', function() {
		controls.movementSpeed = 100;
	});
	$('canvas').on('touchend', function() {
		controls.movementSpeed = 5;
	});
	$('#vr-toggle').click(function() {
		toggleVR();
	});
}

function Map(type) {
	this.type = type;
	this.scene = new THREE.Scene();
	this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 800 );
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
