class Solution {
    public int[][] getAncestors(int n, int[][] edges) {
        List<List<Integer>> adj = new ArrayList<>();
        for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
        int[] indeg = new int[n];
        for (int[] e : edges) { adj.get(e[0]).add(e[1]); indeg[e[1]]++; }

        List<Set<Integer>> anc = new ArrayList<>();
        for (int i = 0; i < n; i++) anc.add(new HashSet<>());
        int[] queue = new int[n];
        int tail = 0;
        for (int i = 0; i < n; i++) if (indeg[i] == 0) queue[tail++] = i;
        for (int head = 0; head < tail; head++) {
            int u = queue[head]; // anc[u] is complete now
            for (int v : adj.get(u)) {
                anc.get(v).add(u);
                anc.get(v).addAll(anc.get(u));
                if (--indeg[v] == 0) queue[tail++] = v;
            }
        }
        int[][] result = new int[n][];
        for (int i = 0; i < n; i++) {
            result[i] = anc.get(i).stream().mapToInt(Integer::intValue).toArray();
            Arrays.sort(result[i]);
        }
        return result;
    }
}
