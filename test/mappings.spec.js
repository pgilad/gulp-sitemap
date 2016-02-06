/* global it,describe */
'use strict';
var should = require('should');
var gutil = require('gulp-util');
var sitemap = require('../index');

describe('mappings', function() {

    var dummyFile = {
        cwd: __dirname,
        base: __dirname,
        path: 'test/fixtures/test.html',
        contents: new Buffer('hello there')
    };

    it('should not be affected if mappings does not match', function(cb) {
        var stream = sitemap({
            siteUrl: 'http://www.amazon.com',
            changefreq: 'daily',
            priority: '0.5',
            mappings: [{
                pages: ['*/*test2222.html'],
                changefreq: 'hourly',
                priority: 0.5
            }]
        });

        stream.on('data', function(data) {
            data.path.should.containEql('sitemap.xml');
            var contents = data.contents.toString();

            contents.should.containEql('test.html');
            contents.should.not.containEql('home.html');
            contents.should.containEql('<loc>http://www.amazon.com/fixtures/test.html</loc>');
            contents.should.containEql('<changefreq>daily</changefreq>');
            contents.should.containEql('<priority>0.5</priority>');
        }).on('end', cb);

        stream.write(new gutil.File(dummyFile));
        stream.end();
    });

    it('should work with mappings for files', function(cb) {
        var stream = sitemap({
            siteUrl: 'http://www.amazon.com',
            changefreq: 'daily',
            mappings: [{
                pages: ['*/*test.html'],
                changefreq: 'hourly',
                priority: 0.4
            }]
        });

        stream.on('data', function(data) {
            data.path.should.containEql('sitemap.xml');
            var contents = data.contents.toString();
            contents.should.containEql('test.html');
            contents.should.not.containEql('home.html');
            contents.should.containEql('<loc>http://www.amazon.com/fixtures/test.html</loc>');
            contents.should.containEql('<changefreq>hourly</changefreq>');
            contents.should.containEql('<priority>0.4</priority>');
        }).on('end', cb);

        stream.write(new gutil.File(dummyFile));
        stream.end();
    });

    it('only the first matching mappings will override a file', function(cb) {
        var stream = sitemap({
            siteUrl: 'http://www.amazon.com',
            mappings: [{
                pages: ['*/*test.html'],
                changefreq: 'hourly',
                priority: 0.4
            }, {
                pages: ['*/*test.html'],
                changefreq: 'yearly',
                priority: 0.2
            }]
        });

        stream.on('data', function(data) {
            var contents = data.contents.toString();
            contents.should.containEql('<changefreq>hourly</changefreq>');
            contents.should.containEql('<priority>0.4</priority>');
        }).on('end', cb);

        stream.write(new gutil.File(dummyFile));
        stream.end();
    });

    it('should not change a matching mapping if property is undefined', function(cb) {
        var stream = sitemap({
            siteUrl: 'http://www.amazon.com',
            mappings: [{
                pages: ['*/*test.html'],
                changefreq: 'hourly'
            }]
        });

        stream.on('data', function(data) {
            var contents = data.contents.toString();
            contents.should.containEql('<changefreq>hourly</changefreq>');
            contents.should.not.containEql('<priority>');
        }).on('end', cb);

        stream.write(new gutil.File(dummyFile));
        stream.end();
    });

    it('should be allowed to set priority 0 in mappings', function(cb) {
        var stream = sitemap({
            siteUrl: 'http://www.amazon.com',
            mappings: [{
                pages: ['*/*test.html'],
                changefreq: 'hourly',
                priority: 0
            }]
        });

        stream.on('data', function(data) {
            var contents = data.contents.toString();
            contents.should.containEql('<changefreq>hourly</changefreq>');
            contents.should.containEql('<priority>0</priority>');
        }).on('end', cb);

        stream.write(new gutil.File(dummyFile));
        stream.end();
    });

    it('should not set last mod with mappings', function(cb) {
        var stream = sitemap({
            siteUrl: 'http://www.amazon.com',
            lastmod: false,
            mappings: [{
                pages: ['*/*test.html'],
                lastmod: false,
            }]
        });

        stream.on('data', function(data) {
            var contents = data.contents.toString();
            contents.should.not.containEql('<lastmod>');
        }).on('end', cb);

        stream.write(new gutil.File(dummyFile));
        stream.end();
    });

    it('should set last mod with mappings', function(cb) {
        var stream = sitemap({
            siteUrl: 'http://www.amazon.com',
            lastmod: false,
            mappings: [{
                pages: ['*/*test.html'],
                lastmod: null,
            }]
        });

        stream.on('data', function(data) {
            var contents = data.contents.toString();
            var time = contents.match(/<lastmod>(.+)<\/lastmod>/i)[1];
            // make sure the tag exists
            contents.should.containEql('<lastmod>' + time + '</lastmod>');
        }).on('end', cb);

        stream.write(new gutil.File(dummyFile));
        stream.end();
    });

    it('should set href lang with mappings', function(cb) {
        var stream = sitemap({
            siteUrl: 'http://www.amazon.com',
            mappings: [{
                pages: ['*/*test.html'],
                hreflang: [{
                    lang: 'ru',
                    getHref: function(siteUrl, file, lang, loc) {
                        // jshint unused:false
                        return 'http://www.amazon.ru/' + file;
                    }
                }, {
                    lang: 'de',
                    getHref: function(siteUrl, file, lang, loc) {
                        // jshint unused:false
                        return 'http://www.amazon.de/' + file;
                    }
                }]
            }]
        });

        stream.on('data', function(data) {
            var contents = data.contents.toString();
            contents.should.match(/hreflang="ru"/i);
            contents.should.match(/www.amazon.ru/i);
            contents.should.match(/hreflang="de"/i);
            contents.should.match(/www.amazon.de/i);
        }).on('end', cb);

        stream.write(new gutil.File(dummyFile));
        stream.end();
    });
});
