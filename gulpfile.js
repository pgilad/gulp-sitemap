'use strict';
var gulp = require('gulp');
var sitemap = require('./index');

gulp.task('default', function() {
    gulp.src('test/fixtures/**/*.html', {
        read: false
    }).pipe(sitemap({
        siteUrl: 'http://www.amazon.com/',
        priority: '0.5',
        changefreq: 'weekly'
    })).pipe(gulp.dest('./'));
});
