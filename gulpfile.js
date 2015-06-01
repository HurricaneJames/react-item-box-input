var path = require('path');
var gulp = require('gulp');
var karma = require('karma').server;

gulp.task('test', function(done) {
  karma.start({
    configFile: path.join(__dirname, 'karma.conf.js'),
    singleRun: true
  }, done);
});

gulp.task('tdd', function(done) {
  karma.start({
    configFile: path.join(__dirname, 'karma.conf.js')
  }, done);
});
