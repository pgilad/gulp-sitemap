'use strict';
var slash = require('slash');
var multimatch = require('multimatch');
var includes = require('lodash.includes');

//TODO: export this to an external module
var header = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
];

var footer = ['</urlset>'];

function getEntryConfig(file, fileLastMod, config) {
    var lastmod = config.lastmod;
    var priority = config.priority;
    var changefreq = config.changefreq;

    config.mappings.some(function (item) {
        if (multimatch(file, item.pages).length) {
            if (typeof item.lastmod !== 'undefined') {
                lastmod = item.lastmod;
            }
            if (typeof item.priority !== 'undefined') {
                priority = item.priority;
            }
            if (typeof item.changefreq !== 'undefined') {
                changefreq = item.changefreq;
            }
            return true;
        }
        return false;
    });

    if (lastmod === null) {
        lastmod = fileLastMod || Date.now();
    }

    //turn index.html into -> /
    var relativeFile = file.replace(/(index)\.(html?){1}$/, '', 'i');
    //url location. Use slash to convert windows \\ or \ to /
    var loc = config.siteUrl + slash(relativeFile);

    return {
        loc: loc,
        lastmod: lastmod,
        changefreq: changefreq,
        priority: priority
    };
}

function wrapTag(tag, value) {
    return '<' + tag + '>' + value + '</' + tag + '>';
}

/**
 * processEntry
 *
 * @param entry
 * @param config
 * @return {Array}
 */
function processEntry(entry, config) {
    var changefreq = entry.changefreq;
    var priority = entry.priority;
    var lastmod = entry.lastmod;
    var loc = entry.loc;

    var returnArr = [
        config.spacing + '<url>',
        config.spacing + config.spacing + wrapTag('loc', loc)
    ];
    if (lastmod) {
        //format mtime to ISO (same as +00:00)
        lastmod = new Date(lastmod).toISOString();
        returnArr.push(config.spacing + config.spacing + wrapTag('lastmod', lastmod));
    }
    if (changefreq) {
        returnArr.push(config.spacing + config.spacing + wrapTag('changefreq', changefreq));
    }
    if (priority || priority === 0) {
        returnArr.push(config.spacing + config.spacing + wrapTag('priority', priority));
    }
    returnArr.push(config.spacing + '</url>');
    return returnArr.join(config.newLine);
}

function prepareSitemap(entries, config) {
    return header
        .concat(entries.map(function (entry) {
            return processEntry(entry, config);
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
    return includes(validChangefreqs, changefreq.toLowerCase());
}

exports.getEntryConfig = getEntryConfig;
exports.prepareSitemap = prepareSitemap;
exports.processEntry = processEntry;
exports.isChangefreqValid = isChangefreqValid;
