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
        mappings: []
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

    return through.obj(function (file, enc, cb) {
            if (file.isNull()) {
                cb(null, file);
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
            var lastmod;
            if (config.lastmod !== null) {
                lastmod = config.lastmod;
            } else {
                lastmod = file.stat && file.stat.mtime || Date.now();
            }
            entries.push({
                file: file.relative,
                lastmod: lastmod
            });
            cb();
        },
        function (cb) {
            if (!firstFile) {
                cb();
                return;
            }
            var contents = sitemap.prepareSitemap(entries, config);
            //create and push new vinyl file for sitemap
            this.push(new gutil.File({
                cwd: firstFile.cwd,
                base: firstFile.cwd,
                path: path.join(firstFile.cwd, config.fileName),
                contents: new Buffer(contents)
            }));
            cb();
        });
};
