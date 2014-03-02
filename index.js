'use strict';
var gutil = require('gulp-util');
var slash = require('slash');
var through = require('through2');
var path = require('path');

module.exports = function (params) {
    params = params || {};
    //first file to capture cwd
    var firstFile;
    //set newline separator
    var newLine = params.newLine || gutil.linefeed;
    //default output filename
    var fileName = params.fileName || 'sitemap.xml';
    //set default change frequency
    var changeFreq = params.changeFreq || 'daily';
    //set default priority
    var priority = params.priority && params.priority.toString() || '0.5';
    //set default base site url
    var siteUrl;
    if (!params.siteUrl) {
        siteUrl = '/';
    } else {
        siteUrl = params.siteUrl;
        //ensure trailing slash
        if (siteUrl.slice(-1) !== '/') {
            siteUrl += '/';
        }
    }
    //set xml spacing. can be \t for tabs
    var spacing = params.spacing || '    ';

    //array to hold lines of output sitemap.xml
    var xmlOutput = [];
    //opening lines
    xmlOutput.push('<?xml version="1.0" encoding="UTF-8"?>');
    xmlOutput.push('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');

    return through.obj(function (file, enc, cb) {
            //skip 404 file
            if (/404\.html?$/i.test(file.relative)) {
                return cb();
            }
            //assign first file to get relative cwd/path
            if (!firstFile) {
                firstFile = file;
            }

            //get modified time
            var lastmod = (file.stat.mtime).getTime();
            //format mtime to ISO (same as +00:00)
            lastmod = new Date(lastmod).toISOString();
            //turn index.html into -> /
            var relativeFile = file.relative.replace(/(index)\.[A-z]+$/, '', 'i');
            //url location. Use slash to convert windows \\ or \ to /
            var loc = siteUrl + slash(relativeFile);

            //push file to xml
            xmlOutput.push(spacing + '<url>');
            xmlOutput.push(spacing + spacing + '<loc>' + loc + '</loc>');
            xmlOutput.push(spacing + spacing + '<lastmod>' + lastmod + '</lastmod>');
            xmlOutput.push(spacing + spacing + '<changefreq>' + changeFreq + '</changefreq>');
            xmlOutput.push(spacing + spacing + '<priority>' + priority + '</priority>');
            xmlOutput.push(spacing + '</url>');

            return cb();
        },
        function (cb) {
            if (!firstFile) {
                return cb();
            }
            xmlOutput.push('</urlset>');
            var sitemapContent = xmlOutput.join(newLine);
            var sitemapPath = path.join(firstFile.base, fileName);

            //create vinyl file
            var sitemapFile = new gutil.File({
                cwd: firstFile.cwd,
                base: firstFile.base,
                path: sitemapPath,
                contents: new Buffer(sitemapContent)
            });

            //push file to stream
            this.push(sitemapFile);
            gutil.log('Generated', gutil.colors.blue(fileName));

            return cb();
        });
};
