var gulp = require('gulp');
var watch = require('gulp-watch');
var browserSync = require('browser-sync');
var sass = require('gulp-sass');
var jade = require('gulp-jade');
var svgSprite = require('gulp-svg-sprite');

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

gulp.task('jade', function() {
	gulp.src('jade/*.jade')
	.pipe(jade({
		pretty: true
	}))
	.pipe(gulp.dest('html'))
});

gulp.task('svg-sprite', function(){
	gulp.src('f/i/sprite-svg/*.svg')
		.pipe(svgSprite({
			shape				: {
				dimension		: {			// Set maximum dimensions 
					maxWidth	: 64,
					maxHeight	: 64
				},
				spacing			: {			// Add padding 
					padding		: 0
				}
			},
			svg					: {			// General options for created SVG files
				xmlDeclaration	: false
			},
			mode				: {
				view			: {			// Activate the «view» mode 
					bust		: false
				},
				symbol			: true		// Activate the «symbol» mode 
			}
		}))
		.pipe(gulp.dest('f/i'));
});

gulp.task('js', function() {
	return gulp.src('f/js/**/*.js')
		.pipe(browserSync.stream());
});

gulp.task('watch', function(){
	gulp.watch('f/scss/**/*.scss', ['sass']);
	gulp.watch('jade/*.jade', ['jade']);
	//gulp.watch('f/i/sprite-svg/*.svg', ['svg-sprite']);
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

gulp.task('default', ['sass', 'jade', /*'svg-sprite', */'js', 'watch', 'browserSync'], function(){
	console.log('Building files');
});