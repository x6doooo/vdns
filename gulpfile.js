var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var pkg = require('./package.json');
var header = require('gulp-header');
var footer = require('gulp-footer');

var banner = ['/**',
    ' * <%= pkg.name %>',
    ' * @version v<%= pkg.version %>',
    ' * @author <%= pkg.author %>',
    ' * @link <%= pkg.homepage %>',
    ' * @license <%= pkg.license[0].url %>',
    ' */',
    ''].join('\n');

gulp.task('build', function () {
    var t = gulp.src([
            './src/class.js',
            './src/class-methods.js',
            './src/const.js',
            './src/prototype.js'
        ])
        .pipe(concat('vdns.js'))
        .pipe(header('(function(window, $, _, undefined) {'))
        .pipe(footer('window.vdns = vdns;\n})(window, jQuery, _);'))
        .pipe(rename({
            suffix: '-' + pkg.version + ''
        }))
        .pipe(header(banner, {pkg: pkg}))
        .pipe(gulp.dest('dist'))
        .pipe(uglify())
        .pipe(header(banner, {pkg: pkg}))
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(gulp.dest('dist'));
    return t;
});

