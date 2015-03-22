var gulp = require('gulp');
var rimraf = require('rimraf');
var jsdoc = require('gulp-jsdoc');
//var jshint = require('gulp-jshint');

/*
gulp.task('lint', function() {
    return gulp.src('js/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});
*/

gulp.task('clean-doc', function() {
  rimraf('doc', function(){});
});
// gulp.task('doc', ['clean-doc'], function() {
//   return gulp.src(['./lib/sojourns/*.sjs'])
//     .pipe(jsdoc('doc'));
// });

gulp.task('doc', ['clean-doc'], function() {
  // TODO: clear the directory first
  gulp.src(['./lib/sojourns/*.sjs', 'README.md'])
    .pipe(jsdoc.parser())
    .pipe(jsdoc.generator('./doc',
      {
        //path:              './etc/marklogic-template',
        systemName:        'MarkLogic Node.js API',
        copyright:         'Copyright 2014 MarkLogic Corporation',
        //theme:             'marklogic',
        inverseNav:        true,
        navType:           'vertical',
        outputSourceFiles: false,
        outputSourcePath:  false
        },
      {
        'private':         false,
        monospaceLinks:    false,
        cleverLinks:       false,
        outputSourceFiles: false
        }
      ));
});


gulp.task('watch', function() {
    gulp.watch('*.sjs', [/*'lint'*/]);
});

gulp.task('default', ['watch']);
