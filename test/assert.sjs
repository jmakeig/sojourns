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

var util = require('/lib/sojourns/util');

module.exports = {
  AssertionError: AssertionError,
  isTrue: assertBoolean,
  equals: assertEquals,
  valueEquals: assertValueEquals,
  arraysEqual: asertArraysEqual,
  notNull: assertNotNull,
  isType: assertIsType,
  before: assertBefore,
  after: assertAfter, 
  within: assertWithin,
  'throws': assertThrows
}

function AssertionError(msg) {
  // <http://dailyjs.com/2014/01/30/exception-error/>
  Error.call(this);
  Error.captureStackTrace(this, AssertionError);
  this.message = msg;
}
AssertionError.prototype = new Error;

function assertEquals(should, does) {
  var args = Array.prototype.slice.call(arguments, 0);
  if(args.length <= 1) return true;
  for(var i = 1; i < args.length; i++) {
    assert(args[i] === args[i-1], args[i] + " should equal " + args[i-1]);
  }
}

/**
 * Test length and then test each item individually.
 * @param {...Array} - Any number of arrays
 * @return {undefined}
 * @throws AssertionError
 */
function asertArraysEqual(/* ... */) {
  var arrays = Array.prototype.slice.call(arguments, 0);
  assertEquals.apply(this, arrays.map(function(a) { return a.length; }));
  
  for(var i = 0; i < arrays[0].length; i++) {
    assertEquals.apply(this, arrays.map(function(a) { return a[i]; }));
  }
}

function assertValueEquals(should, does) {
  var args = Array.prototype.slice.call(arguments, 0);
  if(args.length <= 1) return true;
  for(var i = 1; i < args.length; i++) {
    assert(args[i].valueOf() === args[i-1].valueOf(), args[i].valueOf() + " should equal " + args[i-1].valueOf());
  }
}


function assertNotNull(a) {
  return assert(a !== null, a + " should not be null");
}

function assertIsType(a, type) {
  if(type instanceof Function) { // Constructor
    return assert(a instanceof type, 
      a + " is supposed to be of type " 
        + Object.prototype.toString.call(type.prototype)
        + " but it is actually "
        + ((typeof a == 'object') 
          ? Object.prototype.toString.call(Object.getPrototypeOf(a)) 
          : typeof a)
    );
  } else {
    assert((typeof a) === type, 
      a + " is supposed to be of type " 
        + type
        + " but it is actually "
        + ((typeof a == 'object') 
          ? Object.prototype.toString.call(Object.getPrototypeOf(a)) 
          : typeof a)
    );
  }
}

function assertBefore(a, b, orEqual) {
  if(orEqual) { assert(a <= b, a + ' is supposed to come before (or equal to) ' + b); }
  else { assert(a < b, a + ' is supposed to come before ' + b); }
}

function assertAfter(a, b, orEqual) {
  if(orEqual) { assert(a >= b, a + ' is supposed to come after (or equal to) ' + b); }
  else { assert(a > b, a + ' is supposed to come after ' + b); }
}

function assertThrows(f, errorType, name) {
  var caught = false;
  try {
    f.apply()
  } catch(err) {
    caught = true;
    if(errorType) {
      assertIsType(err, errorType);
    }
    if(name) {
      assertEquals(name, err.name);
    }
  }
  var msg = 'Expecting to catch an error';
  if(errorType) {
    msg = 'Expecting an error of type ' + Object.prototype.toString.call(errorType.prototype);
  }
  assert(caught, msg);
}

function assertBoolean(bool) {
  assert(bool, 'Nope');
}

function assertWithin(a, b, epsilon) {
  assert(Math.abs(a - b) <= epsilon, a + ' and ' + b + ' are not within ' + epsilon);
}

function assert(bool, msg) {
  if(bool !== true) {
    throw new AssertionError(msg);
  }
}