'use strict';
/* needed to get mstats of a file parsed with data only */
var fs = require('fs');
var path = require('path');
var gutil = require('gulp-util');
var through = require('through2');
var defaults = require('lodash.defaults');
var sitemap = require('./lib/sitemap');
var pluginName = 'gulp-sitemap';

module.exports = function(params) {
    var config = defaults(params || {}, {
        newLine: gutil.linefeed,
        fileName: 'sitemap.xml',
        changeFreq: 'daily',
        spacing: '    ',
        priority: '0.5'
    });
    if (!config.siteUrl) {
        throw new gutil.PluginError(pluginName, 'siteUrl is a required param');
    }
    config.priority = config.priority.toString();
    if (config.siteUrl.slice(-1) !== '/') {
        config.siteUrl += '/';
    }
    var entries = [];
    var firstFile;

    return through.obj(function(file, enc, cb) {
            //we handle null files (that have no contents), but not dirs
            if (file.isDirectory()) {
                cb(file);
                return;
            }

            if (file.isStream()) {
                cb(new gutil.PluginError(pluginName, 'Streaming not supported'));
                return;
            }

            //skip 404 file
            if (/404\.html?$/i.test(file.relative)) {
                cb();
                return;
            }

            firstFile = firstFile || file;
            //if file has stat.mtime use it
            if (file.stat && file.stat.mtime) {
                entries = entries.concat(sitemap.processFile(file.relative, file.stat.mtime, config));
                cb();
                return;
            }

            //otherwise get it from file using fs
            fs.stat(file.path, function(err, stats) {
                if (err || !stats || !stats.mtime) {
                    //file not found - skip it
                    if (err.code === 'ENOENT') {
                        cb();
                        return;
                    }
                    err = err || 'No stats found for file ' + file.path;
                    cb(new gutil.PluginError(pluginName, err));
                    return;
                }
                //add file to xml
                entries = entries.concat(sitemap.processFile(file.relative, stats.mtime, config));
                cb();
            }.bind(this));
        },
        function(cb) {
            if (!firstFile) {
                cb();
                return;
            }
            //create and push new vinyl file for sitemap
            this.push(new gutil.File({
                cwd: firstFile.cwd,
                base: firstFile.cwd,
                path: path.join(firstFile.cwd, config.fileName),
                contents: new Buffer(sitemap.prepareSitemap(entries, config))
            }));

            cb();
        });
};
