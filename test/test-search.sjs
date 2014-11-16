'use strict';

var assert = require("assert.sjs");
var ml = require("../src/QueryBuilder.sjs");



module.exports = {
  estimate: function() {
    // assert.isType(Array.from, Function);
    assert.equals(ml.collection("jeopardy").estimate(), 216930);
    //assert.equals(Array.from(ml.collection("jeopardy").search()).length, 216930);
  },
  another: function() {
    //assert.equals(4,5);
  }
}
