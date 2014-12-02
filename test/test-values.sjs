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
var ml = require('/lib/sojourns/QueryBuilder');
var buckets = require('/lib/sojourns/buckets');

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
  },
  bucketsString: function() {
    var values = Array.from(ml.collection("jeopardy").values('value', ['$3', '$6']));
    var xquery = [
      "for $range in", 
      "  cts:value-ranges(", 
      "    cts:json-property-reference('value'),", 
      "    ('$3', '$6')", 
      "  )", 
      "return cts:frequency($range)" 
    ].join('\n');
    var xqResult = xdmp.xqueryEval(xquery).toArray();
    
    assert.equals(values[0].frequency, xqResult[0], 1132);
    assert.equals(values[1].frequency, xqResult[1], 687);
    assert.equals(values[2].frequency, xqResult[2], 640);
  },
  bucketsCallBackInt: function() {
    var values = Array.from(
    ml.collection('jeopardy')
      .values('show_number', function(min, max) {
        assert.equals(5, min);
        assert.equals(6296, max);
        var buckets = [];
        for(var i = 0; i < 63; i++) {
          buckets.push((i + 1) * 100);
        }
        return buckets;
      })
    );
    
    var xquery = [
      'let $sn  as cts:reference  := cts:json-property-reference("show_number", ("type=int"))', 
      'let $min as xs:int         := cts:min($sn) (: 5 :)', 
      'let $max as xs:int         := cts:max($sn) (: 6296 :)', 
      'let $buckets as xs:int+    := for $i in (1 to 63) return $i * 100', 
      'let $options as xs:string* := ("empties", "descending", "frequency-order")', 
      'return cts:frequency(cts:value-ranges($sn, $buckets , $options))', 
    ].join('\n');
    var xqResult = xdmp.xqueryEval(xquery).toArray();
    
    assert.arraysEqual(xqResult, values.map(function(v) { return v.frequency; }));
  },
  bucketsDate: function() {
    var values = Array.from(
      ml.collection('jeopardy')
        .page(5)
        .values('air_date', function(min, max) {
            return buckets.byMonth(min, max, 1);
          }, 
          {order: 'item', direction: 'descending', empties: true}
        )
    );
    assert.equals(5, values.length);
    assert.arraysEqual([13, 11, 11, 23, 9], values.map(function(v) { return v.frequency; }));
  }
}
