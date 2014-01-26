var util = require('util');

var Promise = require('bluebird');

var compileFormat = require('../utils/compileFormat');

var FileHandler = require('./file');

function BaseRotatingFileHandler(options) {
  FileHandler.call(this, options);
  this._buffer = [];

  this._oldFile = options.oldFile || this._fileFormat(this._file);
  this.fileNameFormat = compileFormat(this._oldFile);
}

util.inherits(BaseRotatingFileHandler, FileHandler);

BaseRotatingFileHandler.prototype._fileFormat = function(file) {
  return file;
};

BaseRotatingFileHandler.prototype.emit = function emit(record, callback) {
  this._buffer.push([record, callback]);
  this._flushBuffer();
};

BaseRotatingFileHandler.prototype._flushBuffer = function () {
  var that = this;
  if (this._buffer.length) {
    if (!this.rotating) { //if we already rotating do nothing
      that.rotating = true;
      var t = this._buffer.shift();
      return this.shouldRotate(t[0]).then(function (result) {
        if (result) {
          return that.rotate();
        }
      }).then(function () {
          that.rotating = false;
          that._write(t[0], t[1]);
      }).then(that._flushBuffer.bind(that));
    }
  }
};

BaseRotatingFileHandler.prototype._write = function write(record, callback) {
  FileHandler.prototype.emit.call(this, record, callback);
};

BaseRotatingFileHandler.prototype.shouldRotate = function (record) {
  throw new Error('Subclass should define function .shouldRotate');
};

BaseRotatingFileHandler.prototype.rotate = function () {
  throw new Error('Subclass should define function .rotate');
};

module.exports = BaseRotatingFileHandler;