var gulp = require('gulp');
var watch = require('gulp-watch');
var browserSync = require('browser-sync');
var sass = require('gulp-sass');

gulp.task('sass', function(){
	return gulp.src('f/scss/**/*.scss')
		.pipe(sass())
		/*.pipe(cmq({
			log: true,
			use_external: true
		}))*/
		.pipe(gulp.dest('f/css'))
		.pipe(browserSync.stream());
});

gulp.task('js', function() {
	return gulp.src('f/js/**/*.js')
		.pipe(browserSync.stream());
});

gulp.task('watch', function(){
	gulp.watch('f/scss/**/*.scss', ['sass']);
	gulp.watch('f/js/**/*.js', ['js']);
});

gulp.task('browserSync', function(){
	browserSync({
		server: {
			baseDir: '',
			open: false
		},
	});
});

gulp.task('default', ['sass', 'js', 'watch', 'browserSync'], function(){
	console.log('Building files');
});