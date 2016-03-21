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
			console.log('enable distance slider');
			filters.distance = true;
		} else {
			console.log('disable distance slider');
			filters.distance = false;
		}
	}
	else if (event.target.id === "search") {
		filterValues.search = event.target.value;	
	}
	else if (event.target.id === "for-magnitude") {
		if($(event.target).is(':checked')) {
			console.log('enable magnitude slider');
			filters.mag = true;
		} else {
			console.log('disable magnitude slider');
			filters.mag = false;
		}
	} else if (event.target.id === "red") {
		if($(event.target).is(':checked')) {
			console.log('Show red stars');
			filters.red = false;
		} else {
			console.log('Hide red stars');
			filters.red = true;
		}
	} else if (event.target.id === "blue") {
		if($(event.target).is(':checked')) {
			console.log('Show blue stars');
			filters.blue = false;
		} else {
			console.log('Hide blue stars');
			filters.blue = true;
		}
	} else if (event.target.id === "exo") {
		if($(event.target).is(':checked')) {
			console.log('Hide stars without exoplanets');
			filters.exoplanets = true;
		} else {
			console.log('Show stars without exoplanets');
			filters.exoplanets = false;
		}
	} else if (event.target.id === "view") {
		if($(event.target).is(':checked')) {
			console.log('Show viewcount indicators');
			toggleViews(true);
		} else {
			console.log('Hide viewcount indicators');
			toggleViews(false);
		}
	} else if (event.target.id === "distance") {
		console.log('Show stars within ' + event.target.value + ' light years');
		$('#distanceValue').text(event.target.value);
		filterValues.distance = parseInt(event.target.value);
	} else if (event.target.id === "magnitude") {
		console.log('Show stars up to ' + event.target.value + ' magnitude');
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