'use strict';

var suite = [
  "test-search.sjs"
]

var results = [];
suite.forEach(function(path) {
  var suite = require(path);
  for(var test in suite) {
    var result = {path: path, test: test};
    try {
      suite[test]();
      result.pass = true;
    } catch(e) {
      result.pass = false;
      result.message = e.message;
    }
    results.push(result);
  }
});
results
  // Report only failing tests
  .filter(function(item){
    return !item.pass
  })
;
