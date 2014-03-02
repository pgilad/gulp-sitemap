'use strict';
var should = require('should');
var gutil = require('gulp-util');
var fs = require('fs');
var sitemap = require('../index');

it('should log error on syntax errors', function (cb) {
    var stream = sitemap();

    stream.on('data', function (data) {
        data.path.should.containEql('sitemap.xml');
        data.contents.toString().should.containEql('home.html');
        data.contents.toString().should.not.containEql('404.html');
        data.contents.toString().should.not.containEql('index.html');
    });

    stream.on('end', function () {
        cb();
    });

    stream.write(new gutil.File({
        cwd: __dirname,
        base: __dirname,
        path: 'home.html',
        contents: new Buffer('hello there'),
        stat: fs.statSync(__filename)
    }));

    stream.write(new gutil.File({
        cwd: __dirname,
        base: __dirname,
        path: 'index.html',
        contents: new Buffer('hello there'),
        stat: fs.statSync(__filename)
    }));

    stream.write(new gutil.File({
        cwd: __dirname,
        base: __dirname,
        path: '404.html',
        contents: new Buffer('hello there'),
        stat: fs.statSync(__filename)
    }));

    stream.end();
});
