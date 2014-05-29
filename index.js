'use strict';
var gutil = require('gulp-util');
var slash = require('slash');
var through = require('through2');
var fs = require('fs');
var path = require('path');

var xmlHeader = ['<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
];

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
    var siteUrl;
    //set xml spacing. can be \t for tabs
    var spacing = params.spacing || '    ';
    //array to hold lines of output sitemap.xml
    var xmlOutput = [].concat(xmlHeader);

    /**
     * addFile
     *
     * @param file
     * @param lastmod
     * @param spacing
     * @param cb
     * @return
     */
    var addFile = function (filename, lastmod, cb) {
        //format mtime to ISO (same as +00:00)
        lastmod = new Date(lastmod).toISOString();
        //turn index.html into -> /
        var relativeFile = filename.replace(/(index)\.(html?){1}$/, '', 'i');
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
    };

    if (!params.siteUrl) {
        siteUrl = null;
    } else {
        siteUrl = params.siteUrl;
        //ensure trailing slash
        if (siteUrl.slice(-1) !== '/') {
            siteUrl += '/';
        }
    }

    return through.obj(function (file, enc, cb) {
            //pass through empty file
            if (file.isNull()) {
                this.push(file);
                return cb();
            }

            if (file.isStream()) {
                this.emit('error', new gutil.PluginError('gulp-sitemap', 'Streaming not supported'));
                return cb();
            }

            if (!siteUrl) {
                this.emit('error', new gutil.PluginError('gulp-sitemap', 'siteUrl is a required param'));
                return cb();
            }

            //skip 404 file
            if (/404\.html?$/i.test(file.relative)) {
                return cb();
            }

            //assign first file to get relative cwd/path
            if (!firstFile) {
                firstFile = file;
            }

            //if file has stat.mtime use it
            if (file.stat && file.stat.mtime) {
                //get modified time
                var lastmod = file.stat.mtime;
                //add file to xml
                return addFile(file.relative, lastmod, cb);
            }

            //otherwise get it from file using fs
            fs.stat(file.path, function (err, stats) {
                if (err || !stats || !stats.mtime) {
                    //file not found
                    if (err.code === 'ENOENT') {
                        //skip it
                        return cb();
                    }
                    err = err || 'No stats found for file ' + file.path;
                    this.emit('error', new gutil.PluginError('gulp-sitemap', err));
                    return cb();
                }

                //add file to xml
                return addFile(file.relative, stats.mtime, cb);
            }.bind(this));
        },
        function (cb) {
            if (!firstFile) {
                //no files
                return cb();
            }
            //close off urlset
            xmlOutput.push('</urlset>');
            //build as string
            var sitemapContent = xmlOutput.join(newLine);

            //create vinyl file
            var sitemapFile = new gutil.File({
                cwd: firstFile.cwd,
                base: firstFile.base,
                path: path.join(firstFile.base, fileName),
                contents: new Buffer(sitemapContent)
            });

            //push file to stream
            this.push(sitemapFile);
            gutil.log('Generated', gutil.colors.blue(fileName));

            return cb();
        });
};
