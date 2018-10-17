const gulp = require('gulp');
const replace = require('gulp-string-replace');
const del = require('del');
const fs = require('fs');
const browserSync = require('browser-sync').create();

//Paths for the folder structure
let paths = {
	//Source files
	src: 'src/**/*',
	srcJS: 'src/**/*.js',
	srcCSS: 'src/**/*.css',
	srcHTML: 'src/**/*.html',
	//Temporary folder
	tmp: 'tmp',
	tmpIndex: 'tmp/index.html',
	tmpCSS: 'tmp/**/*.css',
	tmpJS: 'tmp/**/*.js',
	//Distribution folder
	dist: 'dist',
	distIndex: 'dist/index.html',
	distCSS: 'dist/**/*.css',
	distJS: 'dist/**/*.js'
};

//Defualt build task
gulp.task('default', ['copy', 'js']);

//Serve and watch
gulp.task('serve', () => {
	browserSync.init({
		server: paths.tmp,
		port: 8000
	});

	gulp.watch(paths.srcJS, ['js-watch']);
});

//Build, serve and watch
gulp.task('serve:build', ['copy', 'js', 'serve']);

//Finish task before browser is reloaded
gulp.task('js-watch', ['js'], done => {
	browserSync.reload();
	done();
});

//Clean output dir
gulp.task('clean', () => {
	del(['tmp/*', 'dist/*']);
});

//Mark-up
gulp.task('html', () => {
	return gulp.src(paths.srcHTML).pipe(gulp.dest(paths.tmp));
});

//CSS
gulp.task('css', () => {
	return gulp.src(paths.srcCSS).pipe(gulp.dest(paths.tmp));
});

//JS
gulp.task('js', () => {
	return gulp.src(paths.srcJS).pipe(gulp.dest(paths.tmp));
});

gulp.task('copy', ['html', 'css', 'js']);