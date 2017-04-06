var gulp = require('gulp');
var less = require('gulp-less');
var gutil = require('gulp-util');
var minifyCSS = require('gulp-clean-css');
var runSequence = require('run-sequence');
var coffee = require('gulp-coffee');
// var imagemin = require('gulp-imagemin');


gulp.task('less', function() {
	gulp.src('./css/stylesheet.less')
		.pipe(less()
			.on('error', gutil.log)
			.on('error', gutil.beep)
			.on('error', function(err) {
				//chalk.red('err', err);
				var pathToFile = err.fileName.split('\\');
				file = pathToFile[pathToFile.length - 1];
			})
		)
		.pipe(minifyCSS())
		.pipe(gulp.dest('./css/'));
});

gulp.task('coffee', function() {
	gulp.src('./js/*.coffee')
		.pipe(coffee({bare: true}).on('error', gutil.log))
		.pipe(gulp.dest('./js/'));
});

gulp.task('build',  function(callback) {
	runSequence('less','coffee', callback);
});

gulp.task('images', function() {
	gulp.src('images/logos/*')
		.pipe(imagemin())
		.pipe(gulp.dest('images/logos'));
});