#!/usr/bin/env node

var express = require('express'),
    config = require('./config'),
    stylus = require("stylus"),
    app = module.exports = express.createServer(),
    basedir = __dirname;

app.configure(function() {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.favicon(basedir + '/public/favicon.ico'));

  app.use(stylus.middleware({
    'src': basedir + '/src',
    'dest': basedir + '/public',
    'compile': function (str, path, fn) {
      return stylus(str).set('filename', path).set('compress', true);
    }
  }));

  var sessionConfig = config.app.sessions;
  app.use(express.cookieParser());
  app.use(express.bodyParser());
  app.use(express.session({
    'key': sessionConfig.key,
    'secret': sessionConfig.secret,
    'cookie': {
      'path': '/',
      'httpOnly': true,
      'maxAge': sessionConfig.expires
    }
  }));

  app.use(app.router);
});

app.configure('development', function() {
  app.use(express.errorHandler({
    'dumpExceptions': true,
    'showStack': true
  }));
  app.use(express.methodOverride());
  app.use(express["static"](basedir + '/public'));
});

app.configure('production', function() {
  app.use(express.errorHandler());
  app.enable('view cache');

  // Use gzippo to compress all text content
  app.use(require("gzippo").staticGzip(basedir + '/public', {
    'maxAge': config.app.staticAge
  }));
});

app.error(function(err, req, res, next) {
  // TODO: sendFile error pages
});

if(!module.parent) {
  app.listen(config.app.port);
}