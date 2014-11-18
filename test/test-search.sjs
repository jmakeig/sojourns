'use strict';

var assert = require("assert.sjs");
var ml = require("../src/QueryBuilder.sjs");

//xdmp.log(xdmp.requestStatus(xdmp.host(), xdmp.server(), xdmp.request()));

module.exports = {
  estimate: function() {
    // assert.isType(Array.from, Function);
    assert.equals(ml.collection("jeopardy").estimate(), 2500);
    //assert.equals(Array.from(ml.collection("jeopardy").search()).length, 216930);
  },
  wordQuerySortByProperty: function() {
    var results = Array.from(
      ml.collection("jeopardy")
        .where(cts.andQuery(["america"]))
        .orderBy({property: "show_number", direction: "ascending"})
        .search()
    );
    assert.equals(results.length, 26);
    assert.equals(results[0].answer, 
      xdmp.xqueryEval('subsequence(cts:search(collection(), cts:and-query(("america")), ("unfiltered", cts:index-order(cts:json-property-reference("show_number"), "ascending"))), 0, 1)/answer').next().value.valueOf(),
      "'Found only in Latin America, they are the largest parrots'"
    );
  }
}
