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
var util = require('/lib/sojourns/util');
var ml = require('/lib/sojourns/QueryBuilder');
var buckets = require('/lib/sojourns/buckets');

module.exports = {
  oneCategoryDefaults: function() {
    var facet = util.arrayFrom(ml.where().values("category"))[0];
    assert.equals(facet.item, "FICTIONAL CHARACTERS");
    assert.equals(8, facet.frequency);
  },
  allCategories: function() {
    assert.equals(
      util.arrayFrom(ml.where().values("category")).length,
      util.arrayFrom(cts.values(cts.jsonPropertyReference("category"))).length,
      xdmp.xqueryEval('count(cts:values(cts:json-property-reference("category")))').next().value.valueOf()
    );
  },
  specialLexicons: function() {
    assert.equals(2500, util.arrayFrom(ml.where().values(cts.uriReference())).length);
    assert.equals(1, util.arrayFrom(ml.where().values(cts.collectionReference())).length);
    assert.equals("jeopardy", ml.where().values(cts.collectionReference()).next().value.item);
  },
  justPaginated: function() {
    assert.equals(2500, util.arrayFrom(ml.page().values(cts.uriReference())).length);
  },
  bucketsString: function() {
    var values = util.arrayFrom(ml.collection("jeopardy").values('value', ['$3', '$6']));
    var xquery = [
      "for $range in", 
      "  cts:value-ranges(", 
      "    cts:json-property-reference('value'),", 
      "    ('$3', '$6'),", 
      "    ('frequency-order', 'descending')",
      "  )", 
      "return cts:frequency($range)" 
    ].join('\n');
    var xqResult = xdmp.xqueryEval(xquery).toArray();
    
    assert.equals(values[0].frequency, xqResult[0], 1132);
    assert.equals(values[1].frequency, xqResult[1], 687);
    assert.equals(values[2].frequency, xqResult[2], 640);
  },
  bucketsInt: function() {
    var values = util.arrayFrom(
      ml.collection('jeopardy')
        .values('show_number', [24, 240, 2400])
    );
    assert.equals(4, values.length);

    var xquery = [
      '(cts:value-ranges(', 
      '  cts:json-property-reference("show_number"), ', 
      '  (24, 240, 2400), ', 
      '  ("frequency-order", "descending")', 
      '))[4]'
    ].join('\n'); 
    var xqueryResult = xdmp.xqueryEval(xquery).next().value;
    // FIXME: Why can't I just do .valueOf() on the ValueIterator here?
    var min = xqueryResult.xpath('./cts:minimum/data(.)', {cts: 'http://marklogic.com/cts'}).next().value;
    var max = xqueryResult.xpath('./cts:maximum/data(.)', {cts: 'http://marklogic.com/cts'}).next().value;
    assert.isType(values[3].item.minimum, 'number');
    assert.isType(min, 'number');
    assert.equals(64, min, values[3].item.minimum);
    assert.equals(65, max, values[3].item.maximum);
  },
  bucketsCallBackInt: function() {
    var values = util.arrayFrom(
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
    var values = util.arrayFrom(
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
    // Dates are cast in library. This is as designed in <https://bugtrack.marklogic.com/30967>.
    // assert.isType(values[0].item.minimum, Date); // FIXME: <http://bugtrack.marklogic.com/31445>
    // assert.isType(values[0].item.maximum, Date); // FIXME: <http://bugtrack.marklogic.com/31445>
    // assert.isType(values[0].item.lowerBound, Date); // FIXME: <http://bugtrack.marklogic.com/31445>
    // assert.isType(values[0].item.upperBound, Date); // FIXME: <http://bugtrack.marklogic.com/31445>
    // {
    //   "item": {
    //     "minimum": "2012-01-02",
    //     "maximum": "2012-01-23",
    //     "lower-bound": "2012-01-01",
    //     "upper-bound": "2012-02-01"
    //   },
    //   "frequency": 13
    // }
  },
  tuples: function() {
    var values = util.arrayFrom(
      ml.collection('jeopardy')
        .values(
          ['category', 'show_number', 'air_date'] 
        )
    );
    assert.equals(2445, values.length);
    assert.isType(values[0].item[0], 'string');
    assert.isType(values[0].item[1], 'number');
    // xdmp.log(Object.prototype.toString.call(values[0].item[2])); // "[object Date]"
    // xdmp.log(values[0].item[2] instanceof Date); // false
    // FIXME: <http://bugtrack.marklogic.com/31445>
    // assert.isType(values[0].item[2], Date);

    assert.equals('"S"CIENCE', values[0].item[0]);
    assert.equals(4886, values[0].item[1]);
    assert.equals((new Date("2005-12-05T00:00:00")).valueOf(), values[0].item[2].valueOf());
  },
  union: function() {
    var values = util.arrayFrom(
      ml.collection('jeopardy')
        .values(
          ml.union(['category', 'value'])
        )
    );
    assert.equals(2149, values.length);
    assert.equals('$400', values[0].item);
    assert.equals(469, values[0].frequency);
    assert.equals('ZOOLOGY', values[2148].item);
    assert.equals(1, values[2148].frequency);
  },
  unionInconsistentTypes: function() {
    var caught = false;
    assert.throws(function() {
      var values = util.arrayFrom(
        ml.collection('jeopardy')
          .values(
            ml.union(['category', 'air_date'])
          )
      );
    }, undefined, 'XDMP-INCONSRIDX'); // FIXME: There is not a base type for internal errors
  },
  tuplesWithCollectionAndURIReferences: function() {
    var values = 
      cts.valueTuples([
        cts.collectionReference(),
        cts.uriReference(),
        cts.jsonPropertyReference('value')
      ], ['frequency-order', 'descending']);
    var value = values.next().value.toObject();
    var vs = util.arrayFrom(
      ml
        .collection('jeopardy')
        .values([cts.collectionReference(), cts.uriReference(), 'value'])
    );
    for(var i = 0; i < value.length; i++) {
      assert.equals(value[i], vs[0].item[i]);
    }
  },
  coOccurrenceMap: function() {
    var vs = ml
        .collection('jeopardy')
        .values(['value', 'category'], null, {map: true}).next().value;
    assert.equals(21, vs['$2,000'].length);
    //assert.equals(21, vs['$2,000'].count); // FIXED: https://bugtrack.marklogic.com/31278
    assert.equals(38, Object.keys(vs).length);
  }
}
