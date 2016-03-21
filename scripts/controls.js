function initializeControls() {
	controls = new THREE.FlyControls(currentMap.camera, element);
	controls.autoForward = true;
	controls.dragToLook = true;
	controls.movementSpeed = 5;
	controls.rollSpeed = 1;

	window.addEventListener('deviceorientation', setOrientationControls, true);
}

function setOrientationControls(event) {
	if (!event.alpha) {
		return;
	}

	controls = new THREE.DeviceOrientationControls(currentMap.camera, true);
	controls.autoForward = true;
	controls.movementSpeed = 5;
	controls.connect();
	controls.update();

	element.addEventListener('click', fullscreen, false);

	window.removeEventListener('deviceorientation', setOrientationControls, true);
}
