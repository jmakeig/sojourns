'use strict';

// Usage:
// clear; curl -fsS --digest --user admin:'********' http://localhost:8765/test/runner.sjs | jq .

require("../src/util");

xdmp.setResponseContentType("application/json");

//xdmp.log(xdmp.requestStatus(xdmp.host(), xdmp.server(), xdmp.request()));

var suite = [
  "test-search.sjs",
  "test-values.sjs"
]

var DEBUG = false;

// Run a function in a different transaction against a specific database.
function tx(f, database, modules, root) {
  return xdmp.invokeFunction(
    f, 
    { 
      "database": xdmp.database(database), 
      "transactionMode": "update-auto-commit", 
      "isolation": "different-transaction" //, 
      //"modules": modules,
      //"root": root,
    }
  );
}

function setUp() {
  declareUpdate();
  if(cts.estimate(cts.collectionQuery(["jeopardy"])) < 2500) {
    // Hopefully this link doesn't go away --> GONE!
    // var loc = "https://doc-0s-1s-docs.googleusercontent.com/docs/securesc/ha0ro937gcuc7l7deffksulhg5h7mbp1/108nt093kbmcafeksihop0r1pcmkkvtr/1416031200000/14044389733472591834/*/0BwT5wj_P7BKXb2hfM3d2RHU1ckE?e=download";
    //var loc = "/Users/jmakeig/Downloads/JEOPARDY_QUESTIONS1.json";
    var loc = "/Users/jmakeig/Workspaces/sojourns/data/jeopardy.json";
    var qs = xdmp.documentGet(loc, {format: "json"}).next().value.toObject();
    var shows = {};
    qs.forEach(
      function(q) {
        shows["" + q.show_number] = (shows["" + q.show_number]) ? shows["" + q.show_number] + 1 : 1;
        var uri = "/" + q.show_number + "_" + shows["" + q.show_number] + ".json";
        xdmp.documentInsert(uri, q, xdmp.defaultPermissions(), ["jeopardy"]);
      }
    );
    return shows;
  }
}

function run() {
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
        // FIXME: I can't just pass the error here or enumerate over its properties
        result.error = {
          name: e.name, 
          message: e.message, 
          stack: e.stack.split(/\n/), 
          code: e.code, 
          retryable: e.retryable
        }
        //throw e;
      }
      results.push(result);
    }
  });
  return [ // FIXME: See below
    results
      // Report only failing tests
      .filter(function(item){
        return !item["pass"];
      })
  ];
}

function tearDown() {}

xdmp.log(tx(setUp, "Documents"));
var output = Array.from(tx(run, "Documents"))[0]; // FIXME: There's something odd going on with the .filter() above. Need to double wrap arrays and then unwrap.
xdmp.log(tx(tearDown, "Documents"));
output;
