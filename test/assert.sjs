'use strict';

require("util.sjs");

module.exports = {
  AssertionError: AssertionError,
  equals: assertEquals,
  valueEquals: assertValueEquals,
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
    xdmp.log(args[i] +", "+ args[i-1]);
    assert(args[i] === args[i-1], args[i] + " should equal " + args[i-1]);
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