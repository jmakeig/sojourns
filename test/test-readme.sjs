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
var ml = require('/lib/sojourns/QueryBuilder.sjs');

//xdmp.log(xdmp.requestStatus(xdmp.host(), xdmp.server(), xdmp.request()));

module.exports = {
  example1: function() {
    var results = 
      ml.collection('jeopardy')
        .where(
          cts.andQuery([
            'america', 
            cts.jsonPropertyValueQuery('round', 'Jeopardy!')
          ])
        )
        .orderBy({property: 'value', direction: 'descending'})
        .page(2, 4)
        .search();
    for(var result of results) {
      // …
    }
  },
  example2: function() {
    ml.collection('jeopardy')
      .page(2)
      .values(
        ['category', 'value', 'round'] 
      );
  },
  example3: function() {
    ml.values(
      'value',
      // Ranges of values.
      // Two division will create three buckets
      // with negative and positive “infinity” on
      // either end.
      ['$3', '$6'] 
    );
  },
  example4: function() {
    var ml = require('/lib/sojourns/QueryBuilder');
    util.arrayFrom(
    ml
      .where(
        cts.orQuery(
          util.arrayFrom(
            // Get all of the category values, starting with 'M'
            // This is an artificial, yet illustrative example of a 
            // running a nested query to build a query
            ml.values('category', 'M')) 
              // For each 'category' value, crate a property-value query
              .map(function(v) { 
                return cts.jsonPropertyValueQuery('category', v.item);
              })
          )
      )
      // Get just the first 15 values
      .page(15)
      // Bucket the 'air_date' values by a custom function 
      // that generates an array of month boundaries 
      // The callback supplies the mix and max values of all
      // of the values scoped to the query in order to scale 
      // the results.
      .values("air_date", function(min, max) {
        return ml.buckets.byMonth(min, max, 1);
      }, {order: "item", direction: "descending"})
    ).map(
      // Loop through each bucket and produce an ASCII histogram 
      // based on the aggregate frequency within the bucket.
      function(facet) {
        return facet.item.lowerBound.toDateString() + " - " 
          + facet.item.upperBound.toDateString()   + " " 
          + [
              (new Array(Math.floor(facet.frequency / .5))).join("*︎"), 
              "(" + facet.frequency + ")"
            ].join(" ");
      }
    );
  }
}