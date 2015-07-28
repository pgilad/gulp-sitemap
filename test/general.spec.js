/* global it,describe */
'use strict';
var fs = require('fs');

var chalk = require('chalk');
var gulp = require('gulp');
var gutil = require('gulp-util');
var rename = require('gulp-rename');
var should = require('should');
var sitemap = require('../index');

describe('general settings', function () {
    var testFile = {
        cwd: __dirname,
        base: __dirname,
        path: 'test/fixtures/test.html',
        contents: new Buffer('hello there')
    };

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
            siteUrl: 'http://www.amazon.com',
            changefreq: 'daily',
            priority: '0.5'
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

    it('should generate a sitemap.xml without lastmod', function (cb) {
        var stream = sitemap({
            siteUrl: 'http://www.amazon.com',
            changefreq: 'daily',
            priority: '0.5',
            lastmod: ''
        });

        stream.on('data', function (data) {
            var contents = data.contents.toString();
            contents.should.not.containEql('<lastmod>');
        }).on('end', cb);

        stream.write(new gutil.File(testFile));
        stream.end();
    });

    it('should generate a sitemap.xml without changefreq', function (cb) {
        var stream = sitemap({
            siteUrl: 'http://www.amazon.com',
            priority: '0.5'
        });

        stream.on('data', function (data) {
            var contents = data.contents.toString();
            contents.should.not.containEql('<changefreq>');
        }).on('end', cb);

        stream.write(new gutil.File(testFile));
        stream.end();
    });

    it('should generate a sitemap.xml without priority', function (cb) {
        var stream = sitemap({
            siteUrl: 'http://www.amazon.com',
            changefreq: 'daily'
        });

        stream.on('data', function (data) {
            var contents = data.contents.toString();
            contents.should.not.containEql('<priority>');
        }).on('end', cb);

        stream.write(new gutil.File(testFile));
        stream.end();
    });

    it('should deprecate changeFreq', function (cb) {

        var write = process.stdout.write;
        var output = [];
        process.stdout.write = (function (stub) {
            return function (string) {
                // stub.apply(process.stdout, arguments);
                output.push(string);
            };
        })(process.stdout.write);

        var stream = sitemap({
            siteUrl: 'http://www.amazon.com',
            changeFreq: 'hourly'
        });

        stream.on('data', function (data) {
            var contents = data.contents.toString();
            contents.should.containEql('<changefreq>hourly</changefreq>');
        }).on('end', function () {
            process.stdout.write = write;
            var msgs = chalk.stripColor(output.join('\n'));
            msgs.should.containEql('deprecated');
            msgs.should.containEql('changeFreq');
            msgs.should.containEql('changefreq');
            cb();
        });

        stream.write(new gutil.File(testFile));
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
        gulp.src('test/fixtures/**/*.html').pipe(stream);
    });

    it('should handle a case with no file.stats', function (cb) {
        var stream = sitemap({
            siteUrl: 'http://www.amazon.com'
        });

        stream.on('data', function (data) {
            var contents = data.contents.toString();
            // get generated timestamp
            var time = contents.match(/<lastmod>(.+)<\/lastmod>/i)[1];
            // make sure the tag exists
            contents.should.containEql('<lastmod>' + time + '</lastmod>');
        }).on('end', cb);

        stream.write(new gutil.File({
            cwd: __dirname,
            base: __dirname,
            path: 'test/fixtures/test.html',
            contents: new Buffer('hello there'),
            stat: null
        }));
        stream.end();
    });

    it('should apply the verbose option', function (cb) {

        var write = process.stdout.write;
        var output = [];
        process.stdout.write = (function (stub) {
            // jshint unused:false
            return function (string) {
                // stub.apply(process.stdout, arguments);
                output.push(string);
            };
        })(process.stdout.write);

        var stream = sitemap({
            siteUrl: 'http://www.amazon.com',
            verbose: true
        });

        stream.on('data', function () {
            console.log(arguments);
        });

        stream.on('end', function () {
            process.stdout.write = write;
            var msgs = chalk.stripColor(output.join('\n'));
            msgs.should.containEql('Files in sitemap: 2');
            cb();
        });

        var testFile2 = {
            cwd: __dirname,
            base: __dirname,
            path: 'test/fixtures/test2.html',
            contents: new Buffer('hello there')
        };

        stream.write(new gutil.File(testFile));
        stream.write(new gutil.File(testFile2));
        stream.end();
    });

    it('should generate a sitemap without extensions', function (cb) {
        var stream = sitemap({
            siteUrl: 'http://www.amazon.com'
        });

        stream.on('data', function (data) {
            data.path.should.containEql('sitemap.xml');
            var contents = data.contents.toString();

            contents.should.containEql('test');
            contents.should.containEql('nested/article');
            contents.should.not.containEql('test.html');
            contents.should.not.containEql('article.html');
        });

        stream.on('end', cb);
        gulp.src('test/fixtures/**/*.html')
        .pipe(rename({
            extname: ''
        }))
        .pipe(stream);
    });
});
