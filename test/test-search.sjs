'use strict';

var assert = require("assert.sjs");
var ml = require("../src/QueryBuilder.sjs");
module.exports = {
  dummy: function() {
    //assert.equals(ml.search(), 216930);
    assert.equals(5, 5);
  },
  another: function() {
    assert.equals(4,5);
  }
}
