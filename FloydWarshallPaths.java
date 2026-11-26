import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

public final class FloydWarshallPaths {
    private static final long INF = Long.MAX_VALUE / 2;
    private final int n;
    private final long[][] d;
    private final int[][] next, pred, mid;

    public FloydWarshallPaths(int n, int[][] edges) {
        this.n = n;
        d = new long[n + 1][n + 1];
        next = new int[n + 1][n + 1];
        pred = new int[n + 1][n + 1];
        mid = new int[n + 1][n + 1];
        for (int i = 1; i <= n; i++) {
            Arrays.fill(d[i], INF);
            d[i][i] = 0;
            next[i][i] = i;
        }
        for (int[] edge : edges) {
            int u = edge[0], v = edge[1], w = edge[2];
            if (w < d[u][v]) {
                d[u][v] = w;
                next[u][v] = v;
                pred[u][v] = u;
            }
        }
        build();
    }

    private void build() {
        for (int k = 1; k <= n; k++) {
            for (int i = 1; i <= n; i++) {
                if (d[i][k] == INF) continue;
                for (int j = 1; j <= n; j++) {
                    if (d[k][j] == INF) continue;
                    long via = d[i][k] + d[k][j];
                    if (via < d[i][j]) {
                        // Bound repeated decreases caused by negative cycles.
                        d[i][j] = Math.max(-INF, via);
                        next[i][j] = next[i][k];
                        pred[i][j] = pred[k][j];
                        mid[i][j] = k;
                    }
                }
            }
        }
    }

    public long distance(int s, int t) {
        for (int k = 1; k <= n; k++) {
            if (d[s][k] != INF && d[k][k] < 0 && d[k][t] != INF) {
                throw new IllegalStateException("Cặp đỉnh đi qua được chu trình âm.");
            }
        }
        return d[s][t];
    }

    public List<Integer> nextPath(int s, int t) {
        if (distance(s, t) == INF) return List.of();
        List<Integer> path = new ArrayList<>();
        path.add(s);
        while (s != t) {
            s = next[s][t];
            path.add(s);
        }
        return path;
    }

    public List<Integer> predPath(int s, int t) {
        if (distance(s, t) == INF) return List.of();
        List<Integer> path = new ArrayList<>();
        path.add(t);
        while (t != s) {
            t = pred[s][t];
            path.add(t);
        }
        Collections.reverse(path);
        return path;
    }

    public List<Integer> midPath(int s, int t) {
        if (distance(s, t) == INF) return List.of();
        List<Integer> path = new ArrayList<>();
        path.add(s);
        appendSegment(s, t, path);
        return path;
    }

    private void appendSegment(int i, int j, List<Integer> path) {
        if (i == j) return;
        int k = mid[i][j];
        if (k == 0) {
            path.add(j);
            return;
        }
        appendSegment(i, k, path);
        appendSegment(k, j, path);
    }

    public static void main(String[] args) {
        int[][] edges = {
            {1, 2, 2}, {1, 3, 6}, {1, 4, 9},
            {2, 3, 1}, {2, 4, 6}, {3, 4, 2}
        };
        int n = 4;
        if (args.length != 0 && args.length != 2) {
            throw new IllegalArgumentException("Dùng hai đối số: nguồn đích.");
        }
        int s = args.length == 0 ? 1 : Integer.parseInt(args[0]);
        int t = args.length == 0 ? 4 : Integer.parseInt(args[1]);
        if (s < 1 || s > n || t < 1 || t > n) {
            throw new IllegalArgumentException("Đỉnh phải thuộc khoảng 1.." + n);
        }
        FloydWarshallPaths f = new FloydWarshallPaths(n, edges);
        long length = f.distance(s, t);
        if (length == INF) {
            System.out.printf("Không có đường từ %d tới %d.%n", s, t);
            return;
        }
        System.out.printf("D[%d][%d] = %d%n", s, t, length);
        System.out.println("N = " + f.nextPath(s, t));
        System.out.println("P = " + f.predPath(s, t));
        System.out.println("M = " + f.midPath(s, t));
    }
}
