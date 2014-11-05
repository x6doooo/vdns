var gulp = require('gulp');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var info = require('./bower.json');

gulp.task('build', function () {
    var t = gulp.src('./src/**/*.js')
        .pipe(uglify())
        .pipe(rename({
            suffix: '-' + info.version + '.min'
        }))
        .pipe(gulp.dest('dist'));
    return t;
});

