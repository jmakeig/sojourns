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

require('/lib/sojourns/util');

module.exports = {
  AssertionError: AssertionError,
  equals: assertEquals,
  valueEquals: assertValueEquals,
  arraysEqual: asertArraysEqual,
  notNull: assertNotNull,
  isType: assertIsType
}

function AssertionError(msg) {
  this.message = msg;
}
AssertionError.prototype = new Error;

function assertEquals(a, b) {
  //return assert(a === b, a + " should equal " + b);
  var args = Array.prototype.slice.call(arguments, 0);
  if(args.length <= 1) return;
  for(var i = 1; i < args.length; i++) {
    //xdmp.log(args[i] +", "+ args[i-1]);
    assert(args[i] === args[i-1], args[i] + " should equal " + args[i-1]);
  }
}

function asertArraysEqual(a, b) {
  var arrays = Array.prototype.slice.call(arguments, 0);
  assertEquals.apply(this, arrays.map(function(a) { return a.length; }));
  
  for(var i = 0; i < arrays[0].length; i++) {
    assertEquals.apply(this, arrays.map(function(a) { return a[i]; }));
  }
}

function assertValueEquals(a, b) {
  return assert(a.valueOf() === b.valueOf(), a + ".valueOf() should equal " + b + ".valueOf()");
}


function assertNotNull(a) {
  return assert(a !== null, a + " should not be null");
}

function assertIsType(a, type) {
  return assert(a instanceof type, a + " is supposed to be of type " + Object.prototype.toString.call(type));
}

function assert(bool, msg) {
  if(bool !== true) {
    throw new AssertionError(msg);
  }
}