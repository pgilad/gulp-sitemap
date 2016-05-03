'use strict';
var defaults = require('lodash/defaults');
var find = require('lodash/find');
var includes = require('lodash/includes');
var multimatch = require('multimatch');
var slash = require('slash');
var pick = require('lodash/pick');

//TODO: export this to an external module
var header = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
];

var footer = ['</urlset>'];

function getEntryConfig(file, fileLastMod, siteConfig) {
    var mappingsForFile = find(siteConfig.mappings, function(item) {
        return multimatch(file, item.pages).length > 0;
    }) || {};

    var properties = ['getLoc', 'lastmod', 'priority', 'changefreq', 'hreflang'];

    var entry = defaults(
        pick(mappingsForFile, properties),
        pick(siteConfig, properties)
    );

    if (entry.lastmod === null) {
        entry.lastmod = fileLastMod || Date.now();
    }

    //turn index.html into -> /
    var relativeFile = file.replace(/(\/index\.html?|^index\.html?)$/, function(string, match) {
        return match.slice(0, 1) === '/' ? '/' : '';
    }, 'i');
    //url location. Use slash to convert windows \\ or \ to /
    var adjustedFile = slash(relativeFile);
    entry.loc = siteConfig.siteUrl + adjustedFile;
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
 * @param siteConfig
 * @return {Array}
 */
function processEntry(entry, siteConfig) {
    var returnArr = [siteConfig.spacing + '<url>'];

    var loc = entry.getLoc ? entry.getLoc(siteConfig.siteUrl, entry.loc, entry) : entry.loc;
    returnArr.push(siteConfig.spacing + siteConfig.spacing + wrapTag('loc', loc));

    var lastmod = entry.lastmod;
    if (lastmod) {
        //format mtime to ISO (same as +00:00)
        lastmod = new Date(lastmod).toISOString();
        returnArr.push(siteConfig.spacing + siteConfig.spacing + wrapTag('lastmod', lastmod));
    }

    var changefreq = entry.changefreq;
    if (changefreq) {
        returnArr.push(siteConfig.spacing + siteConfig.spacing + wrapTag('changefreq', changefreq));
    }

    var priority = entry.priority;
    if (priority || priority === 0) {
        returnArr.push(siteConfig.spacing + siteConfig.spacing + wrapTag('priority', priority));
    }

    var hreflang = entry.hreflang;
    if (hreflang && hreflang.length > 0) {
        var file = entry.file;
        hreflang.forEach(function(item) {
            var href = item.getHref(siteConfig.siteUrl, file, item.lang, loc);
            var tag = '<xhtml:link rel="alternate" hreflang="' + item.lang + '" href="' + href + '" />';
            returnArr.push(siteConfig.spacing + siteConfig.spacing + tag);
        });
    }

    returnArr.push(siteConfig.spacing + '</url>');
    return returnArr.join(siteConfig.newLine);
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
