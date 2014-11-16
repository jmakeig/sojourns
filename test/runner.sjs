'use strict';

var suite = [
  require("test-search.sjs")
]

suite.map(function(test) {
  try {
    test.test();
  } catch(e) {
    return e.message;
  }
});