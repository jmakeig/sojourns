'use strict';

var suite = [
  "test-search.sjs"
]

suite.map(function(path) {
  var test = require(path);
  var results = {path: path, tests: []};
  
  for(var t in test) {
    var result = {test: t};
    try {
      test[t]();
      result.pass = true;
    } catch(e) {
      result.pass = false;
      result.message = e.message;
    }
    results.tests.push(result);
  }
  return results;
});