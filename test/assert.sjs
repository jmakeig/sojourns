'use strict';

module.exports = {
  AssertionError: AssertionError,
  equals: assertEquals
}

function AssertionError(msg) {
  this.message = msg;
}
AssertionError.prototype = new Error;

function assertEquals(a, b) {
  return assert(a === b, a + " should equal " + b);
}

function assert(bool, msg) {
  if(bool !== true) {
    throw new AssertionError(msg);
  }
}