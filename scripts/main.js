var currentMap;
renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

$(document).ready(function() {
	var galaxyMap = new Map();
	$.get('http://localhost:3000/stars')
	.done(function(stars) {
		var sprite = new THREE.CanvasTexture(starSprite());
		var starGeometry = new THREE.Geometry();
		starGeometry.vertices = stars.map(function(star) {
			return new THREE.Vector3( star.x, star.y, star.z);
		});
		starGeometry.colors = stars.map(function(star) {
			var hsl = 'hsl(' + star.h + ', ' + Math.abs(star.s) + '%, ' + star.l + '%)';
			return new THREE.Color(hsl);
		});

		var starMaterial = new THREE.PointsMaterial({
			size: 0.8,
			vertexColors: THREE.VertexColors,
			map: sprite,
			blending: THREE.AdditiveBlending,
			transparent: true,
			depthWrite: false,
		});
		var starPointSystem = new THREE.Points(starGeometry, starMaterial);
		galaxyMap.stars = starPointSystem;
		galaxyMap.scene.add(starPointSystem);
		galaxyMap.camera.position.x = -60;
		galaxyMap.camera.position.y = 10;
		galaxyMap.camera.position.z = 40;
		currentMap = galaxyMap;
		render();
	});

});

function Map() {
	this.scene = new THREE.Scene();
	this.scene.fog = new THREE.FogExp2(0x5500dd, 0.01);
	this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );
}


function render () {
	requestAnimationFrame( render );

	renderer.render(currentMap.scene, currentMap.camera);
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
