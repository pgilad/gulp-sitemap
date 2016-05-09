'use strict';
var gulp = require('gulp');
var sitemap = require('./index');
var execSync = require('child_process').execSync;

gulp.task('default', function () {
    gulp.src('test/fixtures/**/*.html', {
        read: false
    })
    .pipe(sitemap({
        siteUrl: 'http://www.amazon.com/',
        priority: '0.5',
        changefreq: 'weekly'
    }))
    .pipe(gulp.dest('./'));
});

gulp.task('hreflang', function () {
    gulp.src('test/fixtures/**/*.html', {
        read: false
    })
    .pipe(sitemap({
        siteUrl: 'http://www.amazon.com/',
        priority: '0.5',
        changefreq: 'weekly',
        hreflang: [{
            lang: 'ru',
            getHref: function(siteUrl, file, lang, loc) {
                // return href src for the hreflang. For example:
                return 'http://www.amazon.ru/' + file;
            }
        }]
    }))
    .pipe(gulp.dest('./'));
});

gulp.task('git', function () {
    gulp.src('test/fixtures/**/*.html', {
        read: false
    })
    .pipe(sitemap({
        siteUrl: 'http://www.amazon.com/',
        priority: '0.5',
        changefreq: 'weekly',
        lastmod: function (file) {
            var cmd = 'git log -1 --format=%cI "' + file.relative + '"';
            return execSync(cmd, {
                cwd: file.base
            }).toString().trim();
        }
    }))
    .pipe(gulp.dest('./'));
});
