/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var LEVELS = module.exports = {
  'NOTSET': 0,
  'VERBOSE': 10,
  'DEBUG': 20,
  'INFO': 30,
  'WARNING': 40,
  'ERROR': 50,
  'CRITICAL': 60
};

LEVELS.WARN = LEVELS.WARNING;
LEVELS.TRACE = LEVELS.VERBOSE;

var NUMBERS = {};
for (var levelname in LEVELS) {
  NUMBERS[LEVELS[levelname]] = levelname;
}

/**
 * Get level by its weight
 * @param number
 * @returns {*}
 */
LEVELS.getLevelName = function getLevelName(number) {
  return NUMBERS[number];
};

/**
 * Return level by its string representation or just convert string to number
 * @param val
 * @returns {Number}
 */
LEVELS.getLevel = function getLevel(val) {
  var level = parseInt(val, 10);
  if (isNaN(level)) {
    level = LEVELS[String(val).toUpperCase()];
  }
  return level;
};
