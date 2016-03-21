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
