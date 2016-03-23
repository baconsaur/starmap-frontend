function trackDragging(oldCoords) {
	$('canvas').on('mousemove', function(event){
		var deltaX = oldCoords.x - event.clientX;
		var deltaY = oldCoords.y - event.clientY;
		if (shift) {
			currentMap.camera.position.x += deltaX/10;
			currentMap.camera.position.y -= deltaY/10;
		} else if (alt) {
			currentMap.camera.rotation.x += deltaY/100;
			currentMap.camera.rotation.y += deltaX/100;
		}
		$('canvas').off('mousemove');
		if(shift || alt) {
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
	} else if (event.which == 18) {
		alt = true;
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
			} else if(direction > 0 && currentMap.camera.position.z >= 0 || direction < 0 && currentMap.camera.position.z <= 500) {
				currentMap.camera.position.z -= direction/2;
			}
		}, 10);
	} else {
		clearInterval(zooming);
		zooming = false;
	}
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
		$('.search').css('display', 'flex');
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

function toggleSettings(event) {
	if(event.target.id === "for-distance") {
		if($(event.target).is(':checked')) {
			filters.distance = true;
		} else {
			filters.distance = false;
		}
	}
	else if (event.target.id === "search") {
		filterValues.search = event.target.value;	
	}
	else if (event.target.id === "for-magnitude") {
		if($(event.target).is(':checked')) {
			filters.mag = true;
		} else {
			filters.mag = false;
		}
	} else if (event.target.id === "red") {
		if($(event.target).is(':checked')) {
			filters.red = false;
		} else {
			filters.red = true;
		}
	} else if (event.target.id === "blue") {
		if($(event.target).is(':checked')) {
			filters.blue = false;
		} else {
			filters.blue = true;
		}
	} else if (event.target.id === "exo") {
		if($(event.target).is(':checked')) {
			filters.exoplanets = true;
		} else {
			filters.exoplanets = false;
		}
	} else if (event.target.id === "view") {
		if($(event.target).is(':checked')) {
			toggleViews(true);
		} else {
			toggleViews(false);
		}
	} else if (event.target.id === "distance") {
		$('#distanceValue').text(event.target.value);
		filterValues.distance = parseInt(event.target.value);
	} else if (event.target.id === "magnitude") {
		$('#magValue').text(event.target.value);
		filterValues.mag = parseInt(event.target.value);
	}
	handleStarVisibility();
}

function toggleViews(isHidden) {
	for (var i in currentMap.views) {
		currentMap.views[i].visible = isHidden;
	}
}

function handleStarVisibility() {
	for (var i in currentMap.stars.geometry.vertices) {
		var shouldHide = false;
		if (filterValues.search.length > 0) {
			if (!currentMap.stars.geometry.label[i].toLowerCase().includes(filterValues.search.toLowerCase())) {
				shouldHide = true;
			}
		}
		for (var j in filters) {
			if (j == 'exoplanets' && filters[j] && currentMap.stars.geometry.exoplanets[i] === 0) {
				shouldHide = true;
			}
			else if (j != 'exoplanets' && filters[j] && currentMap.stars.geometry[j][i]) {
				if (j != 'distance' && j != 'mag') {
					shouldHide = true;			
				} else if (j == 'distance' && currentMap.stars.geometry.distance[i] >= filterValues.distance || j == 'mag' && currentMap.stars.geometry.mag[i] >= filterValues.mag) {
					shouldHide = true;
				}
			}
		}	
		if (shouldHide && !currentMap.stars.geometry.hidden[i]) {
			currentMap.stars.geometry.hidden[i] = true;
			currentMap.stars.geometry.vertices[i].z += 2000;	
		} else if (!shouldHide && currentMap.stars.geometry.hidden[i]) {
			currentMap.stars.geometry.hidden[i] = false;
			currentMap.stars.geometry.vertices[i].z -= 2000;
		}
	}
	currentMap.stars.geometry.verticesNeedUpdate = true;
}
