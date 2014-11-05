var gulp = require('gulp');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var pkg = require('./package.json');
var header = require('gulp-header');

var banner = ['/**',
    ' * <%= pkg.name %>',
    ' * @version v<%= pkg.version %>',
    ' * @author <%= pkg.author %>',
    ' * @link <%= pkg.homepage %>',
    ' * @license <%= pkg.license[0].url %>',
    ' */',
    ''].join('\n');

gulp.task('build', function () {
    var t = gulp.src('./src/**/*.js')
        .pipe(uglify())
        .pipe(rename({
            suffix: '-' + pkg.version + '.min'
        }))
        .pipe(header(banner, {pkg: pkg}))
        .pipe(gulp.dest('dist'));
    return t;
});

