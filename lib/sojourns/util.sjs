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

/** @module Util */



/* Should be replaced by ES6 Array.from function */
module.exports.arrayFrom =  function(itr, f, that) {
  var out = [];
  var i;
  if(itr && itr.next) {
    i = 0;
    for(var x of itr) {
      out.push(
        (f instanceof Function) ? f.call(that || itr, x, i) : x
      );
      i++;
    }
  } else if('length' in itr) {
    for(i = 0; i < itr.length; i++) {
      out.push(
        (f instanceof Function) ? f.call(that || itr, itr[i], i) : itr[i]
      )
    }
  }
  return out;
};

module.exports.isUndefined = function(a) {
  //return void 0 === a;
  return 'undefined' === typeof a;
};
module.exports.isNull = function(a) {
  return null === a;
}
