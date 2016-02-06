'use strict';
var defaults = require('lodash.defaults');
var find = require('lodash.find');
var includes = require('lodash.includes');
var multimatch = require('multimatch');
var slash = require('slash');
var pick = require('lodash.pick');

//TODO: export this to an external module
var header = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
];

var footer = ['</urlset>'];

function getEntryConfig(file, fileLastMod, config) {
    var mappingsForFile = find(config.mappings, function(item) {
        return multimatch(file, item.pages).length > 0;
    }) || {};

    var properties = ['lastmod', 'priority', 'changefreq', 'hreflang'];

    var entry = defaults(
        pick(mappingsForFile, properties),
        pick(config, properties)
    );

    if (entry.lastmod === null) {
        entry.lastmod = fileLastMod || Date.now();
    }

    //turn index.html into -> /
    var relativeFile = file.replace(/(index)\.(html?){1}$/, '', 'i');
    //url location. Use slash to convert windows \\ or \ to /
    var adjustedFile = slash(relativeFile);
    entry.loc = config.siteUrl + adjustedFile;
    entry.file = adjustedFile;

    return entry;
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
    var hreflang = entry.hreflang;
    var file = entry.file;

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
    if (hreflang && hreflang.length > 0) {
        hreflang.forEach(function(item) {
            var href = item.getHref(config.siteUrl, file, item.lang, loc);
            var tag = '<xhtml:link rel="alternate" hreflang="' + item.lang + '" href="' + href + '" />';
            returnArr.push(config.spacing + config.spacing + tag);
        });
    }
    returnArr.push(config.spacing + '</url>');
    return returnArr.join(config.newLine);
}

function prepareSitemap(entries, config) {
    return header
        .concat(entries.map(function(entry) {
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
exports.isChangefreqValid = isChangefreqValid;
exports.prepareSitemap = prepareSitemap;
exports.processEntry = processEntry;
