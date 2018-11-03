# [gulp](https://github.com/wearefractal/gulp)-sitemap
> Generate a search engine friendly sitemap.xml using a Gulp stream

[![NPM version](http://img.shields.io/npm/v/gulp-sitemap.svg?style=flat)](https://www.npmjs.org/package/gulp-sitemap)
[![NPM Downloads](http://img.shields.io/npm/dm/gulp-sitemap.svg?style=flat)](https://www.npmjs.org/package/gulp-sitemap)
[![Build Status](http://img.shields.io/travis/pgilad/gulp-sitemap/master.svg?style=flat)](https://travis-ci.org/pgilad/gulp-sitemap)

Easily generate a search engine friendly sitemap.xml from your project.

:bowtie: Search engines love the sitemap.xml and it helps SEO as well.

For information about sitemap properties and structure, see the [wiki for sitemaps](http://www.wikiwand.com/en/Sitemaps)

## Install

Install with [npm](https://npmjs.org/package/gulp-sitemap)

```bash
$ npm install --save-dev gulp-sitemap
```

## Example

```js
var gulp = require('gulp');
var sitemap = require('gulp-sitemap');

gulp.task('sitemap', function () {
    gulp.src('build/**/*.html', {
            read: false
        })
        .pipe(sitemap({
            siteUrl: 'http://www.amazon.com'
        }))
        .pipe(gulp.dest('./build'));
});
```

* `siteUrl` is required.
* `index.html` will be turned into directory path `/`.
* `404.html` will be skipped automatically. No need to unglob it.

Let's see an example of how we can create and output a sitemap, and then return to the original stream files:
```js
var gulp = require('gulp');
var sitemap = require('gulp-sitemap');
var save = require('gulp-save');

gulp.task('html', function() {
    gulp.src('*.html', {
          read: false
        })
        .pipe(save('before-sitemap'))
        .pipe(sitemap({
                siteUrl: 'http://www.amazon.com'
        })) // Returns sitemap.xml
        .pipe(gulp.dest('./dist'))
        .pipe(save.restore('before-sitemap')) //restore all files to the state when we cached them
        // -> continue stream with original html files
        // ...
});
```

## Options

### siteUrl

Your website's base url. This gets prepended to all documents locations.

Type: `string`

Required: `true`

### fileName

Determine the output filename for the sitemap.

Type: `string`

Default: `sitemap.xml`

Required: `false`

### changefreq

Gets filled inside the sitemap in the tag `<changefreq>`. Not added by default.

Type: `string`

Default: `undefined`

Valid Values: `['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never']`

Required: `false`

**Note: any falsey value is also valid and will skip this xml tag**

### priority

Gets filled inside the sitemap in the tag `<priority>`. Not added by default.

Type: `string|function`

Default: `undefined`

Valid Values: `0.0` to `1.0`

Required: `false`

**Note: any falsey (non-zero) value is also valid and will skip this xml tag**

Example using a function as `priority`:


```js
priority: function(siteUrl, loc, entry) {
    // Give pages inside root path (i.e. no slashes) a higher priority
    return loc.split('/').length === 0 ? 1 : 0.5;
}
```

### lastmod

The file last modified time.

- If `null` then this plugin will try to get the last modified time from the stream vinyl file, or use `Date.now()` as lastmod.
- If the value is not `null` - It will be used as lastmod.
- When `lastmod` is a function, it is executed with the current file given as parameter. (Note: the function is expected to be sync).
- A string can be used to manually set a fixed `lastmod`.

Type: `string|datetime|function`

Default: `null`

Required: `false`

Example that uses git to get lastmod from the latest commit of a file:

```js
lastmod: function(file) {
  var cmd = 'git log -1 --format=%cI "' + file.relative + '"';
  return execSync(cmd, {
    cwd: file.base
  }).toString().trim();
}
```

**Note: any falsey (other than null) value is also valid and will skip this xml tag**

### newLine

How to join line in the target sitemap file.

Type: `string`

Default: Your OS's new line, mostly: `\n`

Required: `false`

### spacing

How should the sitemap xml file be spaced. You can use `\t` for tabs, or `  ` with 2
spaces if you'd like.

Type: `string`

Default: `    ` (4 spaces)

Required: `false`

### mappings

An object to custom map pages to their own configuration.

This should be an array with the following structure:

Type: `array`

Default: `[]`

Required: `false`

Example:

```js
mappings: [{
    pages: [ 'minimatch pattern' ],
    changefreq: 'hourly',
    priority: 0.5,
    lastmod: Date.now(),
    getLoc(siteUrl, loc, entry) {
        // Removes the file extension if it exists
        return loc.replace(/\.\w+$/, '');
    },
    hreflang: [{
        lang: 'ru',
        getHref(siteUrl, file, lang, loc) {
            return 'http://www.amazon.ru/' + file;
        }
    }]
},
//....
]
```

- Every file will be matched against the supplied patterns
- Only defined attributes for a matched file are applied.
- Only the first match will apply, so consequent matches for the filename will not apply.
- Possible attributes to set: `hreflang`, `changefreq`, `priority`, `loc` and `lastmod`.
- All rules applying to [options](#options) apply to the attributes that can overridden.

##### pages

Type: `array`

Required: `true`

This is an array with [minimatch](https://github.com/isaacs/minimatch) patterns to match the
relevant pages to override.
Every file will be matched against the supplied patterns.

Uses [multimatch](https://github.com/sindresorhus/multimatch) to match patterns against filenames.

Example: `pages: ['home/index.html', 'home/see-*.html', '!home/see-admin.html']`

##### hreflang

Matching pages can get their `hreflang` tags set using this option.

The input is an array like so:

```js
hreflang: [{
    lang: 'ru',
    getHref: function(siteUrl, file, lang, loc) {
        // return href src for the hreflang. For example:
        return 'http://www.amazon.ru/' + file;
    }
}]
```

##### getLoc

Matching pages can get their `loc` tag modified by using a function.

```js
getLoc: function(siteUrl, loc, entry) {
    return loc.replace(/\.\w+$/, '');
}
```

#### verbose

Type: `boolean`

Required: `false`

Default: `false`

If true, will log the number of files that where handled.

## Complementary plugins

- [gulp-sitemap-files](https://github.com/adam-lynch/gulp-sitemap-files) - Get all files listed in a sitemap (Perhaps one generated from this plugin)

## Thanks

To [grunt-sitemap](https://github.com/RayViljoen/grunt-sitemap) for the inspiration on writing this.

## License

MIT ©[Gilad Peleg](http://giladpeleg.com)
