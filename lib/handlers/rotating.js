/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var fs = require('fs');
var util = require('util');

var Promise = require('bluebird');

var rename = Promise.promisify(fs.rename);
var stat = Promise.promisify(fs.stat);
var unlink = Promise.promisify(fs.unlink);

var BaseRotatingFileHandler = require('./base-rotating');

function bytes(n) {
  var b = 0;

  var map = {
    b: 1,
    kb: 1 << 10,
    mb: 1 << 20,
    gb: 1 << 30
  };

  n.replace(/(\d+)(gb|mb|kb|b)/g, function(_, size, unit) {
    b += map[unit] * parseInt(size, 10);
    return _;
  });
  return b;
}

function times(n) {
  var diff = {
    ms: 0,
    s: 0,
    M: 0,
    d: 0,
    w: 0,
    m: 0,
    y: 0
  };

  n.replace(/(\d+)(ms|s|M|d|w|m|y)/g, function(_, size, unit) {
    diff[unit] = parseInt(size, 10);
    return _;
  });

  return diff;
}

var timeRates = {
  yearly: function(prev) {
    //at the begining of next year
    return new Date(prev.getFullYear() + 1, 0);
  },
  monthly: function(prev) {
    //at then begining of next month
    return new Date(prev.getFullYear(), prev.getMonth() + 1);
  },
  weekly: function(prev) {
    //begining of next week (as 0 it is Sunday, so next week begins at sunday)
    return new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 7 - prev.getDay());
  },
  daily: function(prev) {
    //begining of next day
    return new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 1);
  },
  hourly: function(prev) {
    return new Date(prev.getFullYear(), prev.getMonth(), prev.getDate(), prev.getHour() + 1);
  }
};

function addMs(prev, ms) {
  return new Date(prev.getTime() + ms);
}

function before(date1, date2) { //just check if date1 was earlier date2
  return date1.getTime() < date2.getTime();
}

function RotatingFileHandler(options) {
  if(typeof options.maxSize === 'string') {
    options.maxSize = bytes(options.maxSize);
  }
  if('maxSize' in options) {
    this._maxSize = options.maxSize;
  }
  if('timeRate' in options) {
    this._timeRate = options.timeRate;
    var that = this;
    this._nextRotate = timeRates[this._timeRate] || function(prev) {
      return new Date(prev.getTime() + that._timeRate);
    };
  }
  this._maxFiles = options.maxFiles;
  BaseRotatingFileHandler.call(this, options);
}

util.inherits(RotatingFileHandler, BaseRotatingFileHandler);

RotatingFileHandler.prototype.shouldRotate = function (record) {
  var that = this;
  return this._getData().then(function (t) {
    var sizeExceed = that._maxSize && (t[0] + Buffer.byteLength(that.format(record)) > that._maxSize);
    var timeExceed = that._timeRate && before(that._rotateAt, t[1]);
    return sizeExceed || timeExceed;
  });
};


RotatingFileHandler.prototype._getData = function () {
  if (this._size === undefined) {
    var that = this;
    return stat(this._file).then(function (stat) {
      that._size = stat.size;
      that._time = stat.atime;
      if(that._timeRate) {
        that._rotateAt = that._nextRotate(that._time);
      }
      return [that._size, that._time];
    });
  } else {
    return Promise.fulfilled([this._size, this._time]);
  }
};


RotatingFileHandler.prototype.rotate = function _rotate() {
  var that = this;
  this._stream.end();
  return this._rename().then(function () {
    return that._opened().then(function () {
      that._size = 0;
      if(that._timeRate) {
        that._rotateAt = that._nextRotate(that._rotateAt);
      }
    });
  });
};

RotatingFileHandler.prototype._fileFormat = function(file) {
  var name = file;
  if(this._timeRate) name += '-%d';
  if(this._maxSize) name += '.%i';
  return name;
};

RotatingFileHandler.prototype._write = function write(record, callback) {
  this._size += Buffer.byteLength(this.format(record));
  this._time = record.timestamp;
  BaseRotatingFileHandler.prototype._write.apply(this, arguments);
};

RotatingFileHandler.prototype._rename = function _rename(num) {
  var name = this._file;
  num = num || 0;
  var newName = this.fileNameFormat({ i: num + 1, timestamp: this._rotateAt });
  if (num) {
    name += '.' + num;
  }
  if (this._maxFiles && num + 1 >= this._maxFiles) {
    return unlink(name);
  }
  var that = this;
  var def = Promise.pending();
  fs.exists(newName, def.fulfill.bind(def));
  return def.promise.then(function (exists) {
    if (exists) {
      return that._rename(num + 1);
    }
  }).then(function () {
    return rename(name, newName);
  });
};

module.exports = RotatingFileHandler;
