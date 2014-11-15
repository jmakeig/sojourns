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
    orderBy: wrap(function(sortSpecs) {
      var sortSpecs = [].concat.apply([], Array.prototype.slice.call(arguments));
      this.state.orderBy = sortSpecs.map(
        function(ss) { 
          return cts.indexOrder(cts.jsonPropertyReference(ss.property), ss.direction || "ascending"); 
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
    values: function* (rangeIndexes) {
      var rangeIndexes = [].concat.apply([], Array.prototype.slice.call(arguments));
      var itr = cts.values(rangeIndexes.map(function(ref) { return cts.jsonPropertyReference(ref); }));
      for(var tuple of itr) {
        yield tuple;
      }
    },
    /*********************************************************/
    /* Get the cts.query version of the query object. Appends the collection query, if it's specified. Uses OR semantics if you specify multiples. */
    getQuery: function() {
      var q = cts.query(this.state.query);
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
    
ml
   .collection("fake data")
   .where(
     cts.andQuery(
       [
         cts.wordQuery("flannel"), 
         cts.wordQuery("ennui")]
     )
   )
  .orderBy({ property: "registered", direction: "descending" })
  //.toString();
  //.search().next().value;
  //.estimate();
  //.getQuery();
  .values("eyeColor").next().value;