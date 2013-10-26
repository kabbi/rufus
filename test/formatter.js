/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const assert = require('assert');

const EOL = require('os').EOL;

const rufus = require('../');

module.exports = {
  'Formatter': {

    'constructor': {
      'should accept a format string': function() {
        var formatter = new rufus.Formatter('%level');
        assert.equal(formatter._format, '%level');
      },
      'should accept options': function() {
        var formatter = new rufus.Formatter({
          format: '%level'
        });

        assert.equal(formatter._format, '%level');
      }
    },


    'format': {
      'should output an Error stack': function() {
        var formatter = new rufus.Formatter('%logger: %message%n%err');
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
          var formatter = new rufus.Formatter({
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
      }
    }
  }
};
