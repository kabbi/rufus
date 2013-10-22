/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const assert = require('assert');

const EOL = require('os').EOL;

const intel = require('../');

module.exports = {
  'Formatter': {

    'constructor': {
      'should accept a format string': function() {
        var formatter = new intel.Formatter('%(level)s');
        assert.equal(formatter._format, '%(level)s');
        assert.equal(formatter._datefmt, intel.Formatter.prototype._datefmt);
        assert.equal(formatter._colorize, false);
      },
      'should accept options': function() {
        var formatter = new intel.Formatter({
          format: '%level',
          colorize: true
        });

        assert.equal(formatter._format, '%level');
        assert.equal(formatter._colorize, true);
      }
    },


    'format': {
      'should use printf': function() {
        var formatter = new intel.Formatter('%logger: %message');
        assert.equal(formatter.format({ name: 'foo', message: 'bar' }),
            'foo: bar');
      },
      'should output an Error stack': function() {
        var formatter = new intel.Formatter('%logger: %message%n%er');
        var e = new Error('boom');
        var record = {
          name: 'foo',
          message: 'oh noes: ',
          args: ['oh noes:', e],
          err: e
        };

        assert.equal(formatter.format(record), 'foo: oh noes: ' +
          EOL + e.stack + EOL);
      },
      'datefmt': {
        'should format the date': function() {
          var formatter = new intel.Formatter({
            format: '%date{%Y-%m}'
          });

          var d = new Date();
          var record = {
            timestamp: d
          };

          function pad(val) {
            if (val > 9) {
              return val;
            }
            return '0' + val;
          }
          var expected = d.getFullYear() + '-' + pad(d.getMonth() + 1);
          assert.equal(formatter.format(record), expected);
        }
      },
      'colorize': {
        'should colorize the output': function() {
          var formatter = new intel.Formatter({
            format: '%level: %message',
            colorize: true
          });


          var record = {
            levelname: 'ERROR',
            message: 'foo'
          };
          assert.equal(formatter.format(record),
              '\u001b[31mERROR: foo\u001b[39m');
        }
      }
    }
  }
};
