# Floyd–Warshall Path Reconstruction

Interactive Vietnamese tutorial: Dijkstra, all-pairs shortest paths, and five Floyd–Warshall reconstruction methods.

- Predecessor, Next-Hop, Intermediate matrices: reconstruct one shortest path.
- Next-Hop Set + DFS and Distance Matrix + Tight Edges: enumerate all shortest simple vertex paths.
- Animated matrix updates, DFS branching/backtracking, selectable source and destination, and route highlighting.
- Two fixed six-vertex graphs: the second has eight shortest paths from 1 to 6, each of weight 14.

## Run locally

Open index.html in a browser or serve the root with any static HTTP server. No build or dependencies required.

## GitHub Pages

Settings → Pages → Build and deployment → Deploy from a branch → main / (root). Expected site: https://kieran-lucas.github.io/floyd-warshall-path-reconstruction/

## Test

Run `node test-all-paths.js` (Node.js 18+). The enumeration engine uses integer weights, deduplicates parallel edges by their minimum weight, and excludes repeated vertices. Negative-cycle-affected queries are rejected. Enumeration can require exponential or factorial output.

The set matrix may take O(V³) space and O(V⁴) preprocessing with ordinary sets. The tight-edge alternative retains only the distance matrix and original graph.
