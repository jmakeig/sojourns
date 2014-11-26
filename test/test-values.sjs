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
var ml = require("/lib/sojourns/QueryBuilder.sjs");

module.exports = {
  oneCategoryDefaults: function() {
    var facet = Array.from(ml.where().values("category"))[0];
    assert.equals(facet.item, "FICTIONAL CHARACTERS");
    assert.equals(facet.frequency, 8);
  },
  allCategories: function() {
    assert.equals(
      Array.from(      ml.where().values("category")).length,
      Array.from(      cts.values(cts.jsonPropertyReference("category"))).length,
      xdmp.xqueryEval('count(cts:values(cts:json-property-reference("category")))').next().value.valueOf()
    );
  },
  specialLexicons: function() {
    assert.equals(2500, Array.from(ml.where().values(cts.uriReference())).length);
    assert.equals(1, Array.from(ml.where().values(cts.collectionReference())).length);
    assert.equals("jeopardy", ml.where().values(cts.collectionReference()).next().value.item);
  },
  justPaginated: function() {
    assert.equals(2500, Array.from(ml.page().values(cts.uriReference())).length);
  }
}
