# linko — Graphify Rules

## Knowledge Graph (graphify)

### On Session Start
Antes de tocar código, verificar si existe `graphify-out/graph.json`. Si existe, leer `GRAPH_REPORT.md` para god nodes y usar `graphify explain "<node>"` para orientarte.

Si no existe, ejecutar el pipeline completo **antes** de hacer cambios:

```bash
python3 scripts/graphify_full_pipeline.py .
```

### After Every Session
Al terminar cualquier sesión de cambios, ejecutar actualización incremental:

```bash
python3 scripts/graphify_full_pipeline.py .
```

Esto regenera `graphify-out/graph.json`, `graph.html`, y `GRAPH_REPORT.md` con el estado actual del código.

### Querying the Graph
- `graphify explain "<node>"` — explicación de un nodo
- `graphify path "<A>" "<B>"` — camino más corto entre nodos
- Leer `graphify-out/GRAPH_REPORT.md` para god nodes, cohesión, y gaps

### Ignored
- `node_modules/`
- `.next/`
- `data/` (SQLite DB)
- `public/uploads/`
