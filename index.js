'use strict';
var path = require('path');
var gutil = require('gulp-util');
var through = require('through2');
var defaults = require('lodash.defaults');
var sitemap = require('./lib/sitemap');
var pluginName = 'gulp-sitemap';
var chalk = require('chalk');

module.exports = function (options) {
    var config = defaults(options || {}, {
        newLine: gutil.linefeed,
        fileName: 'sitemap.xml',
        changefreq: null,
        spacing: '    ',
        priority: null,
        lastmod: null,
        mappings: [],
        verbose: false
    });

    if (!config.siteUrl) {
        throw new gutil.PluginError(pluginName, 'siteUrl is a required param');
    }
    if (options.changeFreq) {
        gutil.log(pluginName, chalk.magenta('changeFreq') + ' has been deprecated. Please use ' + chalk.cyan('changefreq'));
        config.changefreq = options.changeFreq;
    }
    if (config.siteUrl.slice(-1) !== '/') {
        config.siteUrl += '/';
    }
    var entries = [];
    var firstFile;

    return through.obj(function (file, enc, callback) {
            //we handle null files (that have no contents), but not dirs
            if (file.isDirectory()) {
                return callback(null, file);
            }

            if (file.isStream()) {
                return callback(new gutil.PluginError(pluginName, 'Streaming not supported'));
            }

            //skip 404 file
            if (/404\.html?$/i.test(file.relative)) {
                return callback();
            }

            firstFile = firstFile || file;
            var entry = sitemap.getEntryConfig(file.relative, file.stat && file.stat.mtime, config);
            entries.push(entry);
            callback();
        },
        function (callback) {
            if (!firstFile) {
                return callback();
            }
            var contents = sitemap.prepareSitemap(entries, config);
            if (options.verbose) {
                gutil.log(pluginName, 'Files in sitemap:', entries.length);
            }
            //create and push new vinyl file for sitemap
            this.push(new gutil.File({
                cwd: firstFile.cwd,
                base: firstFile.cwd,
                path: path.join(firstFile.cwd, config.fileName),
                contents: new Buffer(contents)
            }));
            callback();
        });
};
