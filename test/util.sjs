'use strict';

/* Polyfill for ES6 function */
if(!Array.from) {
  Array.from = function(itr, f, that) {
    if(itr && itr.next) {
      var i = 0;
      var out = [];
      for(var x of itr) {
        out.push(
          (f instanceof Function) ? f.call(that || itr, x, i) : x
        );
        i++;
      }
      return out;
    }
  }
}
