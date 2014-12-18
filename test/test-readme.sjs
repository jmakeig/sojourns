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
  }
}