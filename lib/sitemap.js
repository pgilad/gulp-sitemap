'use strict';
var slash = require('slash');
var multimatch = require('multimatch');
var contains = require('lodash.contains');

//TODO: export this to an external module
var header = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
];

var footer = ['</urlset>'];

/**
 * processFile
 *
 * @param filename
 * @param lastmod
 * @param config
 * @return {Array}
 */
function processFile(filename, lastmod, config) {
    var changefreq = config.changefreq;
    var priority = config.priority;
    // find overrides
    config.mappings.some(function (item) {
        if (multimatch(filename, item.pages).length) {
            if (typeof item.changefreq !== 'undefined') {
                changefreq = item.changefreq;
            }
            if (typeof item.priority !== 'undefined') {
                priority = item.priority;
            }
            if (typeof item.lastmod !== 'undefined') {
                lastmod = item.lastmod;
            }
            return true;
        }
        return false;
    });
    //turn index.html into -> /
    var relativeFile = filename.replace(/(index)\.(html?){1}$/, '', 'i');
    //url location. Use slash to convert windows \\ or \ to /
    var loc = config.siteUrl + slash(relativeFile);
    var returnArr = [config.spacing + '<url>',
        config.spacing + config.spacing + '<loc>' + loc + '</loc>'
    ];
    if (lastmod) {
        //format mtime to ISO (same as +00:00)
        lastmod = new Date(lastmod).toISOString();
        returnArr.push(config.spacing + config.spacing + '<lastmod>' + lastmod + '</lastmod>');
    }
    if (changefreq) {
        returnArr.push(config.spacing + config.spacing + '<changefreq>' + changefreq + '</changefreq>');
    }
    if (priority || priority === 0) {
        returnArr.push(config.spacing + config.spacing + '<priority>' + priority.toString() + '</priority>');
    }
    returnArr.push(config.spacing + '</url>');
    return returnArr.join(config.newLine);
}

function prepareSitemap(entries, config) {
    return header
        .concat(entries.map(function (entry) {
            return processFile(entry.file, entry.lastmod, config);
        }))
        .concat(footer)
        .join(config.newLine)
        .toString();
}

var validChangefreqs = [
    'always',
    'hourly',
    'daily',
    'weekly',
    'monthly',
    'yearly',
    'never'
];

function isChangefreqValid(changefreq) {
    // empty changefreq is valid
    if (!changefreq) {
        return true;
    }
    return contains(validChangefreqs, changefreq.toLowerCase());
}

exports.prepareSitemap = prepareSitemap;
exports.processFile = processFile;
exports.isChangefreqValid = isChangefreqValid;
