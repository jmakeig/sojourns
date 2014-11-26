/*
 * Copyright 2014 MarkLogic
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

var assert = require('assert.sjs');
var ml = require('/lib/sojourns/QueryBuilder.sjs');

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
  },
  justPaginated: function() {
    assert.equals(2500, Array.from(ml.page().search()).length);
    assert.equals(50, Array.from(ml.page(50).search()).length);
    assert.equals(10, Array.from(ml.page(10, 100).search()).length);
  }
}
