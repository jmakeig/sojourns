'use strict';

var ml = require("../src/QueryBuilder.sjs");
module.exports.test = function() {
  //assertEquals(ml.search().toArray().length, 216930);
  assertEquals(4, 5);
}

function AssertionError(msg) {
  this.message = msg;
}
AssertionError.prototype = new Error;

function assertEquals(a, b) {
  if(a !== b) {
    throw new AssertionError(a + " should equal " + b);
    // throw new Error("asdf");
  }
}