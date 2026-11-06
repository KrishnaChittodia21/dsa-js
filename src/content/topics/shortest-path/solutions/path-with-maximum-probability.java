class Solution {
    public double maxProbability(int n, int[][] edges, double[] succProb, int start, int end) {
        List<List<double[]>> adj = new ArrayList<>();
        for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
        for (int i = 0; i < edges.length; i++) {
            int a = edges[i][0], b = edges[i][1];
            adj.get(a).add(new double[]{b, succProb[i]});
            adj.get(b).add(new double[]{a, succProb[i]});
        }

        double[] best = new double[n];
        best[start] = 1;
        PriorityQueue<double[]> heap = new PriorityQueue<>((x, y) -> Double.compare(y[0], x[0]));  // max-heap {probability, node}
        heap.offer(new double[]{1, start});

        while (!heap.isEmpty()) {
            double[] top = heap.poll();
            double p = top[0];
            int u = (int) top[1];
            if (u == end) return p;                // most probable arrival is final
            if (p < best[u]) continue;             // stale
            for (double[] e : adj.get(u)) {
                int v = (int) e[0];
                double np = p * e[1];
                if (np > best[v]) {
                    best[v] = np;
                    heap.offer(new double[]{np, v});
                }
            }
        }
        return 0;
    }
}
