var Benchmark = require('benchmark');

var logger = require('./benchmark/logging')['logging.info()'].bench;

var suite = new Benchmark.Suite;

for(var l in logger) {
  if(logger.hasOwnProperty(l)) {
    (function(l) {
      suite.add(l, logger[l]);
    })(l);
  }
}

suite
// add listeners
  .on('cycle', function (event) {
    console.log(String(event.target));
  })
  .on('complete', function () {
    console.log('Fastest is ' + this.filter('fastest').pluck('name'));
  })
// run async
  .run({ 'async': true });