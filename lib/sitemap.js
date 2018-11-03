'use strict';
const defaults = require('lodash/defaults');
const find = require('lodash/find');
const includes = require('lodash/includes');
const multimatch = require('multimatch');
const slash = require('slash');
const pick = require('lodash/pick');

const header = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
];

const headerHref = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">'
];

const footer = ['</urlset>'];
const allowedProperties = ['getLoc', 'lastmod', 'priority', 'changefreq', 'hreflang'];

function getEntryConfig(file, siteConfig) {
    const relativePath = file.relative;
    const mappingsForFile = find(siteConfig.mappings, function(item) {
        return multimatch(relativePath, item.pages).length > 0;
    }) || {};

    const entry = defaults(
        {},
        pick(mappingsForFile, allowedProperties),
        pick(siteConfig, allowedProperties)
    );

    if (entry.lastmod === null) {
        // calculate mtime manually
        entry.lastmod = file.stat && file.stat.mtime || Date.now();
    } else if (typeof entry.lastmod === 'function') {
        entry.lastmod = entry.lastmod(file);
    }

    //turn index.html into -> /
    let relativeFile = relativePath.replace(/(\/|\\|^)index\.html?$/, '/');
    if (relativeFile === '/') {
        relativeFile = '';
    }
    //url location. Use slash to convert windows \\ or \ to /
    const adjustedFile = slash(relativeFile);
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
 * @return {string}
 */
function processEntry(entry, siteConfig) {
    const returnArr = [siteConfig.spacing + '<url>'];

    const loc = entry.getLoc ? entry.getLoc(siteConfig.siteUrl, entry.loc, entry) : entry.loc;
    returnArr.push(siteConfig.spacing + siteConfig.spacing + wrapTag('loc', loc));

    let lastmod = entry.lastmod;
    if (lastmod) {
        //format mtime to ISO (same as +00:00)
        lastmod = new Date(lastmod).toISOString();
        returnArr.push(siteConfig.spacing + siteConfig.spacing + wrapTag('lastmod', lastmod));
    }

    const changefreq = entry.changefreq;
    if (changefreq) {
        returnArr.push(siteConfig.spacing + siteConfig.spacing + wrapTag('changefreq', changefreq));
    }

    let priority;

    if (typeof entry.priority === 'function') {
        priority = entry.priority(siteConfig.siteUrl, entry.loc, entry);
    } else if (typeof entry.priority !== 'undefined') {
        priority = entry.priority;
    }
    if (typeof priority !== 'undefined') {
        returnArr.push(siteConfig.spacing + siteConfig.spacing + wrapTag('priority', priority));
    }

    const hreflang = entry.hreflang;
    if (hreflang && hreflang.length > 0) {
        const file = entry.file;
        hreflang.forEach(function(item) {
            const href = item.getHref(siteConfig.siteUrl, file, item.lang, loc);
            const tag = '<xhtml:link rel="alternate" hreflang="' + item.lang + '" href="' + href + '" />';
            returnArr.push(siteConfig.spacing + siteConfig.spacing + tag);
        });
    }

    returnArr.push(siteConfig.spacing + '</url>');
    return returnArr.join(siteConfig.newLine);
}

function prepareSitemap(entries, config) {
    const entriesHref = entries.some(function(entry) {
        return entry && entry.hreflang && entry.hreflang.length;
    });
    return (entriesHref ? headerHref : header)
        .concat(entries.map(function(entry) {
            return processEntry(entry, config);
        }))
        .concat(footer)
        .join(config.newLine)
        .toString();
}

const VALID_CHANGE_FREQUENCIES = [
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
    return includes(VALID_CHANGE_FREQUENCIES, changefreq.toLowerCase());
}

exports.getEntryConfig = getEntryConfig;
exports.isChangefreqValid = isChangefreqValid;
exports.prepareSitemap = prepareSitemap;
exports.processEntry = processEntry;
