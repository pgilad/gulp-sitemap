/* global it, describe */
'use strict';
require('should');

const fs = require('fs');

const chalk = require('chalk');
const gulp = require('gulp');
const path = require('path');
const rename = require('gulp-rename');
const sitemap = require('../index');
const stripAnsi = require('strip-ansi');
const Vinyl = require('vinyl');

describe('general settings', function () {
    const testFile = {
        cwd: __dirname,
        base: __dirname,
        path: 'test/fixtures/test.html',
        contents: Buffer.from('hello there')
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
        const stream = sitemap({
            siteUrl: 'http://www.amazon.com',
            changefreq: 'daily',
            priority: '0.5'
        });
        let expectedLastmod;
        const testedFile = 'test/fixtures/test.html';
        const fileStat = fs.statSync(__filename);

        stream.on('data', function (data) {
            data.path.should.containEql('sitemap.xml');
            const contents = data.contents.toString();

            contents.should.containEql('test.html');
            contents.should.not.containEql('home.html');
            contents.should.containEql('<loc>http://www.amazon.com/fixtures/test.html</loc>');
            contents.should.containEql('<changefreq>daily</changefreq>');
            contents.should.containEql('<priority>0.5</priority>');
            contents.should.containEql('<lastmod>' + fileStat.mtime.toISOString() + '</lastmod>');
        });

        stream.on('end', cb);
        expectedLastmod = fs.statSync(testedFile).mtime;

        stream.write(new Vinyl({
            cwd: __dirname,
            base: __dirname,
            path: testedFile,
            contents: Buffer.from('hello there'),
            stat: fileStat
        }));

        stream.end();
    });

    it('should generate a sitemap.xml without lastmod', function (cb) {
        const stream = sitemap({
            siteUrl: 'http://www.amazon.com',
            changefreq: 'daily',
            priority: '0.5',
            lastmod: ''
        });

        stream.on('data', function (data) {
            const contents = data.contents.toString();
            contents.should.not.containEql('<lastmod>');
        }).on('end', cb);

        stream.write(new Vinyl(testFile));
        stream.end();
    });

    it('should generate a sitemap.xml without changefreq', function (cb) {
        const stream = sitemap({
            siteUrl: 'http://www.amazon.com',
            priority: '0.5'
        });

        stream.on('data', function (data) {
            const contents = data.contents.toString();
            contents.should.not.containEql('<changefreq>');
        }).on('end', cb);

        stream.write(new Vinyl(testFile));
        stream.end();
    });

    it('should generate a sitemap.xml without priority', function (cb) {
        const stream = sitemap({
            siteUrl: 'http://www.amazon.com',
            changefreq: 'daily'
        });

        stream.on('data', function (data) {
            const contents = data.contents.toString();
            contents.should.not.containEql('<priority>');
        }).on('end', cb);

        stream.write(new Vinyl(testFile));
        stream.end();
    });

    it('should generate a sitemap.xml with correct html files included', function (cb) {
        const stream = sitemap({
            siteUrl: 'http://www.amazon.com'
        });

        stream.on('data', function (data) {
            data.path.should.containEql('sitemap.xml');
            const contents = data.contents.toString();

            contents.should.containEql('test.html');
            contents.should.containEql('nested/article.html');
            contents.should.containEql('another_index.html');
            contents.should.containEql('<loc>http://www.amazon.com/nested/</loc>');
            contents.should.not.containEql('404.html');
            contents.should.not.containEql('home.html');
            contents.should.not.containEql(/\/index.html/);
        });

        stream.on('end', cb);
        gulp.src('test/fixtures/**/*.html').pipe(stream);
    });

    it('should handle a case with no file.stats', function (cb) {
        const stream = sitemap({
            siteUrl: 'http://www.amazon.com'
        });

        stream.on('data', function (data) {
            const contents = data.contents.toString();
            // get generated timestamp
            const time = contents.match(/<lastmod>(.+)<\/lastmod>/i)[1];
            // make sure the tag exists
            contents.should.containEql('<lastmod>' + time + '</lastmod>');
        }).on('end', cb);

        stream.write(new Vinyl({
            cwd: __dirname,
            base: __dirname,
            path: 'test/fixtures/test.html',
            contents: Buffer.from('hello there'),
            stat: null
        }));
        stream.end();
    });

    it('should apply the verbose option', function (cb) {

        const write = process.stdout.write;
        const output = [];
        process.stdout.write = (function (stub) {
            // jshint unused:false
            return function (string) {
                // stub.apply(process.stdout, arguments);
                output.push(string);
            };
        })(process.stdout.write);

        const stream = sitemap({
            siteUrl: 'http://www.amazon.com',
            verbose: true
        });

        stream.on('data', function () {
            console.log(arguments);
        });

        stream.on('end', function () {
            process.stdout.write = write;
            const msgs = stripAnsi(output.join('\n'));
            msgs.should.containEql('Files in sitemap: 2');
            cb();
        });

        const testFile2 = {
            cwd: __dirname,
            base: __dirname,
            path: 'test/fixtures/test2.html',
            contents: Buffer.from('hello there')
        };

        stream.write(new Vinyl(testFile));
        stream.write(new Vinyl(testFile2));
        stream.end();
    });

    it('should generate a sitemap without extensions', function (cb) {
        const stream = sitemap({
            siteUrl: 'http://www.amazon.com'
        });

        stream.on('data', function (data) {
            data.path.should.containEql('sitemap.xml');
            const contents = data.contents.toString();

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

    it('should work with index.html if siteUrl has a trailing slash', function (cb) {
        const stream = sitemap({
            siteUrl: 'http://www.amazon.com/'
        });

        stream.on('data', function (data) {
            data.path.should.containEql('sitemap.xml');
            const contents = data.contents.toString();

            contents.should.not.containEql('http://www.amazon.com//</loc>');
            contents.should.containEql('http://www.amazon.com/</loc>');
        });

        stream.on('end', cb);

        const stat = fs.statSync(path.join(__dirname, 'fixtures/test.html'));
        stream.write(new Vinyl({
            cwd: __dirname,
            base: __dirname,
            path: path.join(__dirname, 'index.html'),
            contents: Buffer.from('hello there'),
            stat: stat
        }));

        stream.end();
    });
});
