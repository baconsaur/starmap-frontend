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
	} else if (currentMap.type == 'star' && currentMap.sphere) {
		starAnimator.update(80 * dt);
		glowAnimator.update(80 * dt);
		currentMap.sphere.rotation.y += 0.001;	
	}
}

socket.on('update', function (data) {
	if(userID) {
		for (var i in data) {
			if (users[i]) {
				var moveTo = new THREE.Vector3(data[i].position.x, data[i].position.y, data[i].position.z);
				users[i].position.lerp(moveTo, 0.5);
				var quaternion = new THREE.Quaternion();
				quaternion.setFromEuler(new THREE.Euler(data[i].rotation.x - 1.57, data[i].rotation.y, data[i].rotation.z + 1.57));
				users[i].quaternion.slerp(quaternion, 0.5);
			} else if (i != userID){
				var marker = shipModel.clone();
				marker.position.set(data[i].position.x, data[i].position.y, data[i].position.z);
				marker.rotation.set(data[i].rotation.x, data[i].rotation.y, data[i].rotation.z);
				currentMap.scene.add(marker);
		
				users[i] = marker;
			}
		}
		for (i in users) {
			if (!data[i]) {
				delete users[i];
			}
		}
		socket.emit('update', {position: {x: currentMap.camera.position.x + 1.57, y: currentMap.camera.position.y, z: currentMap.camera.position.z - 1.57}, rotation: {x: currentMap.camera.rotation._x, y: currentMap.camera.rotation._y, z: currentMap.camera.rotation._z}});
	}
});

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
