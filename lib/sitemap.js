'use strict';
var slash = require('slash');

//TODO: export this to an external module
var xmlHeader = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
];

var prepareSitemap = function (entries, config) {
    entries = xmlHeader.concat(entries).concat(['</urlset>']);
    return entries.join(config.newLine).toString();
};

/**
 * processFile
 *
 * @param filename
 * @param lastmod
 * @param config
 * @return {Array}
 */
var processFile = function (filename, lastmod, config) {
    //format mtime to ISO (same as +00:00)
    lastmod = new Date(lastmod).toISOString();
    //turn index.html into -> /
    var relativeFile = filename.replace(/(index)\.(html?){1}$/, '', 'i');
    //url location. Use slash to convert windows \\ or \ to /
    var loc = config.siteUrl + slash(relativeFile);
    var returnArr = [];

    //push file to xml
    //TODO: skip spacing and use an xml beautifier
    returnArr.push(config.spacing + '<url>');
    returnArr.push(config.spacing + config.spacing + '<loc>' + loc + '</loc>');
    returnArr.push(config.spacing + config.spacing + '<lastmod>' + lastmod + '</lastmod>');
    returnArr.push(config.spacing + config.spacing + '<changefreq>' + config.changeFreq + '</changefreq>');
    returnArr.push(config.spacing + config.spacing + '<priority>' + config.priority + '</priority>');
    returnArr.push(config.spacing + '</url>');
    return returnArr;
};

exports.prepareSitemap = prepareSitemap;
exports.processFile = processFile;
