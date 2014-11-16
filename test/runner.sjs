'use strict';

var suite = [
  "test-search.sjs"
]

suite.map(function(path) {
  var test = require(path);
  var result = {path: path};
  try {
    test();
    result.pass = true;
  } catch(e) {
    result.pass = false;
    result.message = e.message;
  }
  return result;
});