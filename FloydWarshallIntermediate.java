import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public final class FloydWarshallIntermediate {
    private static final long INF = Long.MAX_VALUE / 2;
    private final int n;
    private final long[][] d;
    private final int[][] mid;

    public FloydWarshallIntermediate(int n, int[][] edges) {
        this.n = n;
        d = new long[n + 1][n + 1];
        mid = new int[n + 1][n + 1];
        for (int i = 1; i <= n; i++) {
            Arrays.fill(d[i], INF);
            Arrays.fill(mid[i], -1);
            d[i][i] = 0;
        }
        for (int[] edge : edges) {
            int u = edge[0], v = edge[1], w = edge[2];
            if (w < d[u][v]) {
                d[u][v] = w;
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
                        // Chặn tràn số khi một chu trình âm làm chi phí giảm liên tục.
                        d[i][j] = Math.max(-INF, via);
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
        if (k == -1) {
            path.add(j);
            return;
        }
        appendSegment(i, k, path);
        appendSegment(k, j, path);
    }

    public static void main(String[] args) {
        int[][] edges = {
            {1, 2, 4}, {1, 3, 15}, {1, 4, 20},
            {2, 3, 3}, {2, 4, 10}, {3, 4, 2}
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
        FloydWarshallIntermediate f = new FloydWarshallIntermediate(n, edges);
        long length = f.distance(s, t);
        if (length == INF) {
            System.out.printf("Không có đường từ %d tới %d.%n", s, t);
            return;
        }
        System.out.printf("D[%d][%d] = %d%n", s, t, length);
        System.out.println("M = " + f.midPath(s, t));
    }
}
