/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const RE = /%([sdO])/g;

module.exports = function(format, obj) {
  var args = obj.args;
  var counter = 0;
  return String(format).replace(RE, function(match, type) {
    var val = args[counter++];

    switch (type) {
    case 's':
      return String(val);
    case 'd':
      return Number(val);
    case 'O':
      return JSON.stringify(val);
    default:
      return match;
    }
  });
};
