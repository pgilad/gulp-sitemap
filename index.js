'use strict';
/* needed to get mstats of a file parsed with data only */
var fs = require('fs');
var path = require('path');
var gutil = require('gulp-util');
var through = require('through2');
var defaults = require('lodash.defaults');
var sitemap = require('./lib/sitemap');

module.exports = function (params) {
    params = params || {};
    if (!params.siteUrl) {
        throw new gutil.PluginError('gulp-todo', 'siteUrl is a required param');
    }
    var config = defaults(params, {
        //set newline separator
        newLine: gutil.linefeed,
        //default output filename
        fileName: 'sitemap.xml',
        //set default change frequency
        changeFreq: 'daily',
        //set xml spacing. can be \t for tabs
        spacing: '    ',
        //set default priority
        priority: '0.5',
        //whether to log output
        log: false
    });
    //enforce priority to be a string
    config.priority = config.priority.toString();
    //ensure siteUrl ends with a slash
    if (config.siteUrl.slice(-1) !== '/') {
        config.siteUrl += '/';
    }
    //first file to capture cwd
    var firstFile, entries = [];

    return through.obj(function (file, enc, cb) {
            //we handle null files (that have no contents), but not dirs
            if (file.isDirectory()) {
                this.push(file);
                return cb();
            }

            //we don't handle streams for now
            if (file.isStream()) {
                this.emit('error', new gutil.PluginError('gulp-sitemap', 'Streaming not supported'));
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
                entries = entries.concat(sitemap.processFile(file.relative, file.stat.mtime, config));
                return cb();
            }

            //otherwise get it from file using fs
            fs.stat(file.path, function (err, stats) {
                if (err || !stats || !stats.mtime) {
                    //file not found - skip it
                    if (err.code === 'ENOENT') {
                        return cb();
                    }
                    err = err || 'No stats found for file ' + file.path;
                    this.emit('error', new gutil.PluginError('gulp-sitemap', err));
                    return cb();
                }
                //add file to xml
                entries = entries.concat(sitemap.processFile(file.relative, stats.mtime, config));
                return cb();
            }.bind(this));
        },
        function (cb) {
            if (!firstFile) {
                //no files
                return cb();
            }
            //create and push new vinyl file for sitemap
            this.push(new gutil.File({
                cwd: firstFile.cwd,
                base: firstFile.cwd,
                path: path.join(firstFile.cwd, config.fileName),
                contents: new Buffer(sitemap.prepareSitemap(entries, config))
            }));

            if (config.log === true) {
                gutil.log('Generated', gutil.colors.blue(config.fileName));
            }
            return cb();
        });
};
