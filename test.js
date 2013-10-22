var intel = require('./lib/index');

intel.config({
  formatters: {
    'simple': {
      'colorize': true
    }
  },
  handlers: {
    'terminal': {
      'class': intel.handlers.Console,
      'formatter': 'simple',
      'level': intel.VERBOSE
    }
  },
  loggers: {
    'patrol': {
      'handlers': ['terminal'],
      'level': 'INFO',
      'handleExceptions': false,
      'exitOnError': false,
      'propagate': false
    }
  }
});

var logger = intel.getLogger('patrol');

function bad() {
  (function() {
    throw new Error('Something bad');
  })();
}

try {
  bad();
} catch(e) {
  logger.error('Was an error %d %s', 1, 'abc', e);

}

logger.info('Now everything is ok %d %s', 1, 'abc');

