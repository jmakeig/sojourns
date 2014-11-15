var ml = (function() { 
  /* Avoid new construnction without having to declare it in each function. */
  function wrap(f) {
    return function() {
      var that = (this instanceof QueryBuilder) ? this : new QueryBuilder();
      return f.apply(that, arguments); // Pass through arguments
    }
  }
  
  function QueryBuilder() {
    this.state = {};
  }
  QueryBuilder.prototype = {
    collection: wrap(function(uris) {
      var uris = [].concat.apply([], Array.prototype.slice.call(arguments));
      this.state.collections = uris;
      return this;
    }),
    where: wrap(function(query) {
      this.state.query = xdmp.toJSON(query).toObject();
      return this;
    }),
    /*
     * { property: "color", direction: "ascending|descending" }
     */
    orderBy: wrap(function(sortSpecs) {
      var sortSpecs = [].concat.apply([], Array.prototype.slice.call(arguments));
      this.state.orderBy = sortSpecs.map(
        function(ss) {
          if(ss.score)
            ;
          else if(ss.property)
            return cts.indexOrder(cts.jsonPropertyReference(ss.property), ss.direction || "ascending"); 
          else if(ss.field)
            throw new Error("No field yet");
          else if(ss.path)
            throw new Error("No path yet");
          else
            throw new Error("None of property, field, path");
        }
      );
      return this;
    }),
    /*********************************************************/
    search: function* (options /*(String||cts.indexOrder)[]*/, qualityWeight, forests) {
      options = [].concat(options);
      if(options.indexOf("unfiltered") < 0 && options.indexOf("filtered") < 0) {
        options.push("unfiltered");
      }
      options = [].concat(options, this.state.orderBy);
      for(var result of cts.search(this.getQuery(), options, qualityWeight, forests)) {
        yield result.toObject();
      }
    },
    estimate: function() {
      return cts.estimate(this.getQuery());
    },
      values: function* s(rangeIndexes /* String[] for now */, options /* {order: "frequency|item", frequency: "fragment|item", direction: "ascending|descending", limit: N, skip: N, sample: N, truncate: N, score: "logtfidf|logtf|simple|random|zero"}*/) {
      //rangeIndexes = [].concat.apply([], Array.prototype.slice.call(arguments));
      rangeIndexes = [].concat(rangeIndexes);
      var opts = [];
      for(var opt in options) {
        switch(opt) {
          case "order":
          case "frequency":
            opts.push(options[opt] + "-" + opt);
            break;
          case "direction":
            opts.push(options[opt]);
            break;
          case "limit":
          case "skip":
          case "sample":
          case "truncate":
            opts.push(opt + "=" + options[opt]);
            break;
          default:
            break;
        }
      }
      var itr = cts.values(
        rangeIndexes.map(function(ref) { return cts.jsonPropertyReference(ref); }),
        null, // start
        opts, // options
        this.getQuery() // query
      );
      for(var tuple of itr) {
        yield tuple;
      }
    },
    /*********************************************************/
    /* Get the cts.query version of the query object. Appends the collection query, if it's specified. Uses OR semantics if you specify multiples. */
    getQuery: function() {
      var q = (this.state.query) ? cts.query(this.state.query) : null;
      if(this.state.collections) {
        //var coll = cts.orQuery(this.state.collections.map(function(collection) { return cts.collectionQuery(collection); })); 
        q = cts.andQuery([].concat(q, cts.collectionQuery(this.state.collections)));
      }
      return q;
    },
    toString: function() {
      function str(obj, name) {
        if(obj) return name + ": " + JSON.stringify(obj) + "\n";
        else return "";
      }
      return str(this.state.collections, "collections") + str(this.state.query, "query");  
    }
  }
  
  // Equivalent of module.exports
  var obj = new Object();
  obj.collection = QueryBuilder.prototype.collection;
  obj.where = QueryBuilder.prototype.where;
  return obj;
})();

   
   
   
   
   
   
   
var itr =    
ml
   .collection("jeopardy")
   //.where(
   //  cts.andQuery(
   //    [
   //      cts.wordQuery("flannel"), 
   //      cts.wordQuery("ennui")]
   //  )
   //)
  //.orderBy({ property: "registered", direction: "descending" })
  //.toString();
  //.search().next().value;
  //.estimate();
  //.getQuery();
  .values(["round"], {order: "frequency", direction: "descending"});
  //.search().next().value;

var out = [];
for(var v of itr) {
  out.push([v, cts.frequency(v)]);
}
out;





