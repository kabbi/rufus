/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const assert = require('assert');
const util = require('util');

const Promise = require('bluebird');

const LEVELS = require('./levels');
const Filterer = require('./filterer');

const SLICE = Array.prototype.slice;

var __loggers = {};
var ROOT = 'root';
var DIVIDER = '.';
var OTHER_DIVIDERS = /[\/\\]/g;

function getEffectiveParent(name) {
  if (name === ROOT) {
    return;
  }
  var parts = name.split(DIVIDER);
  if (parts.length > 1) {
    var parent;
    while (!parent && parts.length) {
      parts.pop();
      parent = __loggers[parts.join(DIVIDER)];
    }
    return parent || __loggers[ROOT];
  } else if (parts.length === 1 && name !== ROOT) {
    return __loggers[ROOT];
  }
}

function logAtLevel(level) {
  return function(msg /*, args...*/) {
    switch (arguments.length) {
    //faster cases
    case 0:
    case 1:
      return this.log(level, msg);
    case 2:
      return this.log(level, msg, arguments[1]);
    default:
      //turtles
      var args = SLICE.call(arguments);
      args.unshift(level);
      return this.log.apply(this, args);
    }
  };
}

function Logger(name) {
  Filterer.call(this);
  if (!name) {
    name = ROOT;
  }
  name = name.replace(OTHER_DIVIDERS, DIVIDER);
  if (name in __loggers) {
    return __loggers[name];
  }
  __loggers[name] = this;
  this._name = name;

  this._handlers = [];
}
util.inherits(Logger, Filterer);

var proto = {

  //_handlers: [],

  _name: null,

  _level: null,

  _handlesExceptions: false,

  _exitOnError: true,

  propagate: true,

  setLevel: function setLevel(level) {
    level = LEVELS.getLevel(level);
    assert(level != null, 'Cannot set level with provided value:' + level);
    this._level = level;
    return this;
  },

  getEffectiveLevel: function getEffectiveLevel() {
    if (this._level != null) {
      return this._level;
    } else {
      var parent = getEffectiveParent(this._name);
      if (parent) {
        return parent.getEffectiveLevel();
      } else {
        return LEVELS.NOTSET;
      }
    }
  },

  isEnabledFor: function isEnabledFor(level) {
    return level >= this.getEffectiveLevel();
  },

  addHandler: function addHandler(handler) {
    this._handlers.push(handler);
    return this;
  },

  removeHandler: function removeHandler(handler) {
    var index = this._handlers.indexOf(handler);
    if (index !== -1) {
      this._handlers.splice(index, 1);
    }
    return this;
  },

  handleExceptions: function handleExceptions(exitOnError/* = true */) {
    this._exitOnError = exitOnError === false ? false : true;
    if (!this._uncaughtException) {
      this._uncaughtException = this.catchException.bind(this);
      process.on('uncaughtException', this._uncaughtException);
    }
  },

  unhandleExceptions: function unhandleExceptions() {
    process.removeListener('uncaughtException', this._uncaughtException);
    delete this._uncaughtException;
  },

  catchException: function catchException(err) {
    var exits = this._exitOnError;

    var promise = this.error('Uncaught exception handled', err);
    if (exits) {
      //XXX: wrap in timeout
      promise.then(function() {
        process.exit(1);
      });
    }
  },

  makeRecord: function makeRecord(name, level, msg, args) {
    var i = args.length - 1;
    var err = util.isError(args[i]) && args[i];

    return {
      name: name,
      level: level,
      levelname: LEVELS.getLevelName(level),
      timestamp: new Date(),
      message: msg,
      args: args,
      err: err,
      pid: process.pid
    };
  },

  handle: function handle(record) {
    var promises = [];

    if (this.filter(record)) {

      var i = this._handlers.length;
      while (i--) {
        if (record.level >= this._handlers[i].level) {
          promises.push(this._handlers[i].handle(record));
        }
      }

      // if this.propagate, tell our parent
      if (this.propagate) {
        var par = getEffectiveParent(this._name);
        if (par) {
          promises.push(par.handle(record));
        }
      }

    }

    if (promises.length > 2) {
      return Promise.all(promises);
    } else if (promises[0]) {
      return promises[0];
    } else {
      return Promise.fulfilled();
    }
  },

  log: function log(level, msg /*, messageArs..., */) {
    var args;
    if (arguments.length < 3) {
      args = [];
    } else {
      args = SLICE.call(arguments, 2);
    }

    var promise;
    if (this.isEnabledFor(level)) {
      promise = this.handle(this.makeRecord(this._name, level, msg, args));
    } else {
      promise = Promise.fulfilled();
    }

    return promise;
  },

  verbose: logAtLevel(LEVELS.VERBOSE),
  debug: logAtLevel(LEVELS.DEBUG),
  info: logAtLevel(LEVELS.INFO),
  warn: logAtLevel(LEVELS.WARNING),
  error: logAtLevel(LEVELS.ERROR),
  critical: logAtLevel(LEVELS.CRITICAL),

  // aliases
  warning: function warning() {
    return this.warn.apply(this, arguments);
  },

  /*jshint -W106*/ // ignore camelCase warning for this fun functions
  o_O: function o_O() {
    return this.warn.apply(this, arguments);
  },

  O_O: function O_O() {
    return this.error.apply(this, arguments);
  }


};

for (var prop in proto) {
  if (proto.hasOwnProperty(prop)) {
    Logger.prototype[prop] = proto[prop];
  }
}


for (var k in LEVELS) {
  if (typeof LEVELS[k] === 'number') {
    Logger[k] = Logger.prototype[k] = LEVELS[k];
  }
}

module.exports = Logger;
