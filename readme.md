# [gulp](https://github.com/wearefractal/gulp)-sitemap
> Generate a search engine friendly sitemap.xml using a Gulp stream

[![NPM version](https://badge.fury.io/js/gulp-sitemap.png)](http://badge.fury.io/js/gulp-sitemap)
[![Dependencies](https://gemnasium.com/pgilad/gulp-sitemap.png)](https://gemnasium.com/pgilad/gulp-sitemap)
[![Build Status](https://travis-ci.org/pgilad/gulp-sitemap.png?branch=master)](https://travis-ci.org/pgilad/gulp-sitemap)

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
    }).pipe(sitemap())
        .pipe(gulp.dest('build/'));
});
```

* File content isn't necessary when reading files - so to speed up building - use the `{read:false}` on `gulp.src`.
* index.html will be turned into directory path `/`.
* 404.html will be skipped automatically. No need to unglob it.

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
        siteUrl: '',
        spacing: '    '
        }))
    .pipe(gulp.dest('build/'));
});
```

## Options

### fileName

Determine the output filename for the sitemap. Default: `sitemap.xml`.

### siteUrl

What is your website's url. This gets prepended to all documents locations. Default: ``.

### changeFreq

Gets filled inside the sitemap in the tag `<changefreq>`. Default: `daily`.

### priority

Gets filled inside the sitemap in the tag `<priority>`. Default: `0.5`.

### newLine

How to join line in the target sitemap file. Defaults to your system OS or `\n`.

### spacing

How should the sitemap xml file be spaced. You can use `\t` for tabs, or `  ` with 2
spaces if you'd like. Default: `    ` (4 spaces).

## Thanks

To [grunt-sitemap](https://github.com/RayViljoen/grunt-sitemap) for the inspiration on writing this.

## License

MIT ©2014 **Gilad Peleg**
