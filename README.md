# Sojourns

Experimental sandbox for MarkLogic Server-Side JavaScript API.

## Getting Started

1. From the [Configuration Manager](http://localhost:8002/nav/?type=databases), select the “Import” tab.
1. Upload the `config-package.zip` in the `data` directory. 
1. Click the “Compare” button and then the “Apply” button. This will create a new HTTP app server on port `8765` and configure the default `Documents` database with some new indexes. (*FIXME:* This assumes a file system path particular to @jmakeig's laptop.)
1. From the base directory, run `npm test` to load some seed data and run the unit tests. (*FIXME:* this assumes a hard-coded `admin` user with a password `********`)
1. Run `npm run-script jsdoc` to build the docs. This will create a `docs` directory. Navigate to `docs/index.html` with your favorite browser. (*TODO:* Generate a static `gh-pages` site for the docs.)

## Examples
### Search
```javascript
var ml = require('/lib/sojourns/QueryBuilder');
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
```

### Value Tuples
```javascript
ml.collection('jeopardy')
  .page(2)
  .values(
    ['category', 'value', 'round'] 
  );
```

```json
[
  {
    "item": [
      "STUPID ANSWERS",
      "$200",
      "Jeopardy!"
    ],
    "frequency": 3
  },
  {
    "item": [
      "THE BIBLE",
      "$1000",
      "Double Jeopardy!"
    ],
    "frequency": 3
  }
]
```

### Buckets

#### Static

```javascript
ml.values(
  'value',
  ['$3', '$6'] 
);
```

```json
[
  {
    "item": {
      "minimum": "$1,000",
      "maximum": "$250",
      "upperBound": "$3"
    },
    "frequency": 1132
  },
  {
    "item": {
      "minimum": "$3,000",
      "maximum": "$500",
      "lowerBound": "$3",
      "upperBound": "$6"
    },
    "frequency": 687
  },
  {
    "item": {
      "minimum": "$600",
      "maximum": "$900",
      "lowerBound": "$6"
    },
    "frequency": 640
  }
]

```
#### Calculated
```javascript
var ml = require('/lib/sojourns/QueryBuilder');
Array.from(
ml
  .where(cts.orQuery(
    Array.from(ml.values('category', 'M')).map(function(v) { return cts.jsonPropertyValueQuery('category', v.item);})
  ))
  .page(15)
  .values("air_date", function(min, max) {
    return ml.buckets.byMonth(min, max, 1);
  }, {order: "item", direction: "descending"})
).map(
  function(facet) {
    return facet.item.lowerBound.toDateString() + " - " 
      + facet.item.upperBound.toDateString()   + " " 
      + [
          (new Array(Math.floor(facet.frequency / .5))).join("*︎"), 
          "(" + facet.frequency + ")"
        ].join(" ");
  }
);
```

```json
[
  "Sat Dec 31 2011 - Tue Jan 31 2012 *︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎ (8)",
  "Wed Nov 30 2011 - Sat Dec 31 2011 *︎*︎*︎ (2)",
  "Mon Oct 31 2011 - Wed Nov 30 2011 *︎*︎*︎*︎*︎*︎*︎ (4)",
  "Fri Sep 30 2011 - Mon Oct 31 2011 *︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎ (11)",
  "Wed Aug 31 2011 - Fri Sep 30 2011 *︎*︎*︎*︎*︎*︎*︎ (4)",
  "Sun Jul 31 2011 - Wed Aug 31 2011  (0)",
  "Thu Jun 30 2011 - Sun Jul 31 2011 *︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎ (10)",
  "Tue May 31 2011 - Thu Jun 30 2011 *︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎ (10)",
  "Sat Apr 30 2011 - Tue May 31 2011 *︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎ (8)",
  "Thu Mar 31 2011 - Sat Apr 30 2011 *︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎ (8)",
  "Mon Feb 28 2011 - Thu Mar 31 2011 *︎*︎*︎*︎*︎*︎*︎ (4)",
  "Mon Jan 31 2011 - Mon Feb 28 2011 *︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎ (8)",
  "Fri Dec 31 2010 - Mon Jan 31 2011 *︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎ (10)",
  "Tue Nov 30 2010 - Fri Dec 31 2010 *︎*︎*︎*︎*︎*︎*︎*︎*︎ (5)",
  "Sun Oct 31 2010 - Tue Nov 30 2010 *︎*︎*︎*︎*︎*︎*︎*︎*︎*︎*︎ (6)"
]
```


