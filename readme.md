# [gulp](https://github.com/wearefractal/gulp)-sitemap
> Generate a search engine friendly sitemap.xml using a Gulp stream

[![NPM version](http://img.shields.io/npm/v/gulp-sitemap.svg)](https://www.npmjs.org/package/gulp-sitemap)
[![NPM Downloads](http://img.shields.io/npm/dm/gulp-sitemap.svg)](https://www.npmjs.org/package/gulp-sitemap)
[![Dependencies](http://img.shields.io/gemnasium/pgilad/gulp-sitemap.svg)](https://gemnasium.com/pgilad/gulp-sitemap)
[![Build Status](http://img.shields.io/travis/pgilad/gulp-sitemap/master.svg)](https://travis-ci.org/pgilad/gulp-sitemap)

Easily generate a search engine friendly sitemap.xml from your project.

:bowtie: Search engines love the sitemap.xml and it helps SEO as well.

## Install

Install with [npm](https://npmjs.org/package/gulp-sitemap)

```
npm i -D gulp-sitemap

#or use the long and tiring version:
npm install --save-dev gulp-sitemap
```

## Example

```js
var gulp = require('gulp');
var sitemap = require('gulp-sitemap');

gulp.task('sitemap', function () {
    gulp.src('build/**/*.html', {
        read: false
    }).pipe(sitemap({
            siteUrl: 'http://www.amazon.com'
        }))
        .pipe(gulp.dest('build/'));
});
```

* File content isn't necessary when reading files - so to speed up building - use `{read:false}` on `gulp.src`.
* *index.html* will be turned into directory path `/`.
* *404.html* will be skipped automatically. No need to unglob it.

## Example with all options and their defaults
```js
var gulp = require('gulp');
var sitemap = require('gulp-sitemap');

gulp.task('sitemap', function () {
    gulp.src('build/**/*.html', {
        read: false
    }).pipe(sitemap({
        fileName: 'sitemap.xml',
        newLine: '\n',
        changeFreq: 'daily',
        priority: '0.5',
        siteUrl: 'http://www.amazon.com',
        spacing: '    '
        }))
    .pipe(gulp.dest('build/'));
});
```

## Options

### siteUrl

**required**

Your website's base url. This gets prepended to all documents locations.

### fileName

Default: `sitemap.xml`

Determine the output filename for the sitemap.


### changeFreq

Default: `daily`

Gets filled inside the sitemap in the tag `<changefreq>`.

### priority

Default: `0.5`

Gets filled inside the sitemap in the tag `<priority>`.

### newLine

Default: Your OS's new line, mostly: `\n`

How to join line in the target sitemap file.

### spacing

Default: '    '

How should the sitemap xml file be spaced. You can use `\t` for tabs, or `  ` with 2
spaces if you'd like.

## Thanks

To [grunt-sitemap](https://github.com/RayViljoen/grunt-sitemap) for the inspiration on writing this.

## License

MIT ©2014 **Gilad Peleg**
