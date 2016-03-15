var gulp = require('gulp');
var browserSync = require('browser-sync');
var reload = browserSync.reload;

gulp.task('serve', function() {
	browserSync({
		server: {
			baseDir: '.'
		},
		port: 8000,
		ui: false
	});
	gulp.watch(['*.html', 'css/*.css', 'scripts/*.js'], {cwd: '.'}, reload);
});
