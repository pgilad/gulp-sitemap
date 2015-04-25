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
    var entries = [];
    var firstFile;
    var msg;

    if (!config.siteUrl) {
        msg = 'siteUrl is a required param';
        throw new gutil.PluginError(pluginName, msg);
    }
    if (options.changeFreq) {
        msg = chalk.magenta('changeFreq') + ' has been deprecated. Please use ' + chalk.cyan('changefreq');
        gutil.log(pluginName, msg);
        config.changefreq = options.changeFreq;
    }
    if (config.siteUrl.slice(-1) !== '/') {
        config.siteUrl = config.siteUrl + '/';
    }

    return through.obj(function (file, enc, callback) {
            //we handle null files (that have no contents), but not dirs
            if (file.isDirectory()) {
                return callback(null, file);
            }

            if (file.isStream()) {
                msg = 'Streaming not supported';
                return callback(new gutil.PluginError(pluginName), msg);
            }

            //skip 404 file
            if (/404\.html?$/i.test(file.relative)) {
                return callback();
            }

            if (!firstFile) {
                firstFile = file;
            }
            var mtime = file.stat ? file.stat.mtime : null;
            var entry = sitemap.getEntryConfig(file.relative, mtime, config);
            entries.push(entry);
            callback();
        },
        function (callback) {
            if (!firstFile) {
                return callback();
            }
            var contents = sitemap.prepareSitemap(entries, config);
            if (options.verbose) {
                msg = 'Files in sitemap: ' + entries.length;
                gutil.log(pluginName, msg);
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
