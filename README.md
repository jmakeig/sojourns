Experimental sandbox for MarkLogic Server-Side JavaScript API.

### Search
```javascript
ml.collection("jeopardy")
  .where(cts.andQuery(["america", "president"]))
  .orderBy({property: "value", direction: "descending"})
  .page(2, 4)
  .search();
```

### Value Tuples
```javascript
ml.collection("jeopardy")
  .page(2)
  .values(
    ["category", "value", "round"] 
  );
```

```json
[
  {
    "value": [
      "BEFORE & AFTER",
      "$400",
      "Double Jeopardy!"
    ],
    "frequency": 91
  },
  {
    "value": [
      "BEFORE & AFTER",
      "$800",
      "Double Jeopardy!"
    ],
    "frequency": 86
  }
]
```