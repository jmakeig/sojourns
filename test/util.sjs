'use strict';
if(!Array.from) {
  Array.from = function(itr) {
    if(itr && itr.next) {
      var out = [];
      for(var x of itr) {
        out.push(x);
      }
      return out;
    }
  }
}
