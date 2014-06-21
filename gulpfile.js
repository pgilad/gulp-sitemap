'use strict';
var gulp = require('gulp');
var sitemap = require('./index');

gulp.task('default', function () {
    gulp.src('test/fixtures/**/*.html', {
        read: false
    }).pipe(sitemap({
        siteUrl: 'http://www.amazon.com/'
    })).pipe(gulp.dest('./'));
});
