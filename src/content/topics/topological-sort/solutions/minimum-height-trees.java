class Solution {
    public int[] findMinHeightTrees(int n, int[][] edges) {
        if (n <= 2) return IntStream.range(0, n).toArray();
        List<List<Integer>> adj = new ArrayList<>();
        for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
        int[] deg = new int[n];
        for (int[] e : edges) {
            adj.get(e[0]).add(e[1]); adj.get(e[1]).add(e[0]);
            deg[e[0]]++; deg[e[1]]++;
        }
        List<Integer> leaves = new ArrayList<>();
        for (int i = 0; i < n; i++) if (deg[i] == 1) leaves.add(i);

        int remaining = n;
        while (remaining > 2) {
            remaining -= leaves.size(); // peel the whole layer at once
            List<Integer> next = new ArrayList<>();
            for (int leaf : leaves) {
                for (int nb : adj.get(leaf)) {
                    if (--deg[nb] == 1) next.add(nb);
                }
            }
            leaves = next;
        }
        return leaves.stream().mapToInt(Integer::intValue).toArray();
    }
}
