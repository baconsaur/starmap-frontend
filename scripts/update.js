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
		controls.update(dt);
	}

	if (!mobileMode && currentMap.type == 'galaxy') {
		updateGalaxyMap();
	}
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
		currentMap.selected.object.geometry.colors[currentMap.selected.index].set( 0xdd6600 );
		currentMap.lastSelected = currentMap.selected.index;

		currentMap.stars.geometry.colorsNeedUpdate = true;
	} else {
		currentMap.selected = false;
	}
}

function getCameraDirection() {
	width = window.innerWidth;
	height = window.innerHeight;
	var screenCenter = new THREE.Vector2(width - 1, height + 1);
	raycaster.setFromCamera(screenCenter, currentMap.camera);
	return raycaster.ray.direction;
}
