var cluster = require('cluster'),
    fs = require('fs'),
    bouncy = require('bouncy'),
    config = require('./config'),
    workers = {},
    maxWorkers = require('os').cpus().length;

function spawn() {
  var worker = cluster.fork();
  workers[worker.pid] = worker;
  return worker;
}

var errorTemplate = fs.readFileSync(__dirname + '/views/proxy-error.html', 'utf8');
var codeToken = new RegExp('{code}', 'g'), messageToken = new RegExp('{message}', 'g');
function httpErrorHandler(code, message) {
  return function(bounce) {
    var res = bounce.respond();
    res.statusCode = code;
    return res.end(errorTemplate.replace(codeToken, code).replace(messageToken, message));
  };
}


if (cluster.isMaster) {

  // Spawn the workers
  for(var i=0; i< maxWorkers; i++) {
    spawn();
  }

  // When a worker dies, create another one
  cluster.on("death", function(worker) {
    delete workers[worker.pid];
    spawn();
  });

} else {

  var table = config.proxy.table,
      maxRequests = config.proxy.maxRequestsPerWorker,
      proxymap = {},
      hitCount = 0;

  /**
   * Watch the proxy table & update the local map when the file changes
   * TODO: Each process needs to keep a read-only copy of the map,
   * would be great if master could watch & update the workers instead
   */
  fs.watchFile(table, function () {
    fs.readFile(table, function (err, data) {
      // TODO: keep an error count & notify admin on multiple errors
      if (!err) {
        proxymap = JSON.parse(data);
      }
    });
  });

  // Start listening & kill the worker once it has served max number of requests
  var notFoundHandler = httpErrorHandler(404, 'Application Not Found');
  var errorHandler = httpErrorHandler(500, 'Internal Server Error');
  bouncy(function(req, bounce) {
    var host = req.headers.host;
    if (!host || !(host in proxymap)) {
      notFoundHandler(bounce);
    } else {
      var stream = bounce(proxymap[host], { headers: { Connection: 'close' } });
      stream.on('error', function() {
        errorHandler(bounce);
      });
    }
  }).listen(config.proxy.port);
}