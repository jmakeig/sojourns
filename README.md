Experimental sandbox for MarkLogic Server-Side JavaScript API.

```javascript
ml.collection("jeopardy")
  .where(cts.andQuery(["america", "president"]))
  .orderBy({property: "value", direction: "descending"})
  .page(2, 4)
  .search();
```