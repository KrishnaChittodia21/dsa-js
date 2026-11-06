class Solution {
    public int mstPrim(int[][] graph) {
        int n = graph.length;
        boolean[] inTree = new boolean[n];
        PriorityQueue<int[]> heap = new PriorityQueue<>((a, b) -> Integer.compare(a[0], b[0])); // [weight, node]
        heap.add(new int[]{0, 0});
        int total = 0, count = 0;
        while (!heap.isEmpty() && count < n) {
            int[] top = heap.poll();
            int w = top[0], u = top[1];
            if (inTree[u]) continue;               // stale entry
            inTree[u] = true;                      // mark on pop
            total += w;
            count++;
            int[] row = graph[u];
            for (int v = 0; v < n; v++) {
                if (row[v] > 0 && !inTree[v]) heap.add(new int[]{row[v], v});
            }
        }
        return count == n ? total : -1;
    }
}
