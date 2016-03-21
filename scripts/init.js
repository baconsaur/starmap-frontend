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

var apiString = 'http://localhost:3000/stars';
//var apiString = 'http://star-map.herokuapp.com/stars';

renderer = new THREE.WebGLRenderer();
effect = new THREE.StereoEffect(renderer);

effect.setSize( window.innerWidth, window.innerHeight );
renderer.setSize( window.innerWidth, window.innerHeight );

element = renderer.domElement;
container = $('#canvasContainer');
container.append(element);

clock = new THREE.Clock();

function init() {
  mobileMode = checkForMobile();

  var galaxyMap = new Map('galaxy');
  galaxyMap.scene.fog = new THREE.FogExp2(0x4400dd, 0.004);

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
