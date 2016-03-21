$(document).ready(function() {
	init();
});

function animate (t) {
	requestAnimationFrame(animate);

	update(clock.getDelta());
	render(clock.getDelta());
}
