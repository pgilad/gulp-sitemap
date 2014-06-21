/* global it */
'use strict';
var should = require('should');
var gutil = require('gulp-util');
var gulp = require('gulp');
var fs = require('fs');
var sitemap = require('../index');

it('should throw if not provided with site url', function () {
    try {
        sitemap();
    } catch (e) {
        e.should.containEql({
            message: 'siteUrl is a required param'
        });
    }
});

it('should generate a sitemap.xml using default values', function (cb) {
    var stream = sitemap({
        siteUrl: 'http://www.amazon.com'
    });
    var expectedLastmod;
    var testedFile = 'test/fixtures/test.html';
    var fileStat = fs.statSync(__filename);

    stream.on('data', function (data) {
        data.path.should.containEql('sitemap.xml');
        var contents = data.contents.toString();

        contents.should.containEql('test.html');
        contents.should.not.containEql('home.html');
        contents.should.containEql('<loc>http://www.amazon.com/fixtures/test.html</loc>');
        contents.should.containEql('<changefreq>daily</changefreq>');
        contents.should.containEql('<priority>0.5</priority>');
        contents.should.containEql('<lastmod>' + fileStat.mtime.toISOString() + '</lastmod>');
    });

    stream.on('end', cb);
    expectedLastmod = fs.statSync(testedFile).mtime;

    stream.write(new gutil.File({
        cwd: __dirname,
        base: __dirname,
        path: testedFile,
        contents: new Buffer('hello there'),
        stat: fileStat
    }));

    stream.end();
});

it('should generate a sitemap.xml with correct html files included', function (cb) {
    var stream = sitemap({
        siteUrl: 'http://www.amazon.com'
    });

    stream.on('data', function (data) {
        data.path.should.containEql('sitemap.xml');
        var contents = data.contents.toString();

        contents.should.containEql('test.html');
        contents.should.containEql('nested/article.html');
        contents.should.not.containEql('404.html');
        contents.should.not.containEql('home.html');
        contents.should.not.containEql('index.html');
    });

    stream.on('end', cb);

    gulp.src('test/fixtures/**/*.html')
        .pipe(stream);
});

it('should handle a case with no file.stats', function (cb) {
    var stream = sitemap({
        siteUrl: 'http://www.amazon.com'
    });
    var expectedLastmod;

    stream.on('data', function (data) {
        data.path.should.containEql('sitemap.xml');
        var contents = data.contents.toString();

        contents.should.containEql('test.html');
        contents.should.not.containEql('home.html');
        contents.should.containEql('<lastmod>' + expectedLastmod.toISOString() + '</lastmod>');
    });

    stream.on('end', cb);

    expectedLastmod = fs.statSync('test/fixtures/test.html').mtime;

    stream.write(new gutil.File({
        cwd: __dirname,
        base: __dirname,
        path: 'test/fixtures/test.html',
        contents: new Buffer('hello there'),
        stat: null
    }));

    stream.end();
});
