# Floyd–Warshall Path Reconstruction

[Open the interactive tutorial](https://kieran-lucas.github.io/floyd-warshall-path-reconstruction/)

Vietnamese, matrix-first visualization of the transition from single-source Dijkstra to all-pairs shortest paths and five Floyd–Warshall reconstruction methods.

## Interactive laboratory

- Six complete 6×6 matrices: W, D, P, N, M, H (216 cells). The initial matrices and eight reference routes are also pre-rendered in HTML.
- Build phase: all 216 comparisons, initialization, filtered improvements and tie unions, jump to tie, step/play/pause/scrub.
- Trace phase: click any matrix cell to query its row/column, highlight reads, watch the graph and DFS, select an individual route, compare all five approaches.
- Three example graphs: equal shortest paths, a unique shortest path from 1 to 6, and a zero-weight cycle.
- P, N and M return one selected shortest path. H and T enumerate all shortest simple vertex paths. T needs W and D, not an auxiliary matrix.
- Integer edge weights; affected negative-cycle pairs are rejected by the engine. Zero-weight cycles are handled using a per-branch visited set. Output size may be exponential or factorial.

## Run locally

Open `index.html` or serve the root with a static HTTP server. No build step and no JavaScript dependencies.

## Tests

```sh
node test-matrix-lab.js
node test-all-paths.js
```

The first script covers the current matrix engine with brute-force differential checks and DOM-harness interaction tests, and verifies the six pre-rendered tables. The second tests the previous standalone enumeration implementation retained for reference. DOM-harness tests do not substitute for browser rendering or visual QA.

## Files

- `index.html`: article, styles, laboratory layout, static fallback
- `matrix-engine.js`: unified Floyd snapshots and five reconstruction algorithms
- `matrix-lab.js`: interactive interface
- `test-matrix-lab.js`: reproducible differential and DOM-harness tests
- `all-paths.js`, `all-paths-ui.js`, `test-all-paths.js`: earlier implementation and tests, retained for reference (not loaded by the current website)

## Complexity

Floyd with one auxiliary scalar matrix: Θ(V³) time and Θ(V²) storage. H with ordinary sets: O(V⁴) time and O(V³) worst-case space. T performs Floyd without an auxiliary matrix, then checks tight edges during DFS. The educational simulator stores snapshots and runs comparison methods in addition to the chosen method; this instrumentation is not required by the algorithms themselves.
