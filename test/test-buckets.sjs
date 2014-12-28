/*
 * Copyright 2014 MarkLogic
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

var assert = require('assert.sjs');
var util = require('/lib/sojourns/util');
var buckets = require('/lib/sojourns/buckets.sjs');

module.exports = {
  testDateValues: function() {
    var d = xs.dateTime('1984-09-14T00:00:00');
    //assert.isType(d, Value);
    assert.isTrue(d instanceof Value);
    //assert.isTrue(d.toObject(), Date);
    assert.isTrue(d.toObject() instanceof Date);
  },
  testMonthsStart: function() {
    //fn.adjustDateTimeToTimezone(xs.dateTime(str), '-PT0H')
    var s = xs.date('1984-09-14');
    var e = xs.date('1985-12-07');
    var b = buckets.byMonth(s, e, 1);
    assert.equals(17, b.length);
    assert.before(b[0], s.toObject());
    assert.after(b[b.length - 1], e.toObject());
    assert.valueEquals(b[0], new Date(1984, 9-1, 1));
    assert.valueEquals(b[b.length - 1], new Date(1986, 1-1, 1));
  },
  testMonthsAfterStart: function() {
    var s = xs.dateTime('1984-09-14T00:00:00');
    var e = xs.dateTime('1985-12-07T00:00:00');
    var b = buckets.byMonth(s, e, 20);
    assert.equals(17, b.length);
    assert.before(b[0], s.toObject(), true);
    assert.after(b[1], s.toObject());
    assert.after(b[b.length - 1], e.toObject(), true);
    assert.before(b[b.length - 2], e.toObject());  
  }
}