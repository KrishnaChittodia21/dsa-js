class Solution {
    public int[] sortItems(int n, int m, int[] group, int[][] beforeItems) {
        // 0. every ungrouped item gets its own new group
        int[] g = group.clone();
        int groupCount = m;
        for (int i = 0; i < n; i++) if (g[i] == -1) g[i] = groupCount++;

        // 1. build item graph and group graph
        List<List<Integer>> itemAdj = newAdj(n), groupAdj = newAdj(groupCount);
        int[] itemIn = new int[n], groupIn = new int[groupCount];
        for (int i = 0; i < n; i++) {
            for (int b : beforeItems[i]) {
                itemAdj.get(b).add(i); itemIn[i]++;
                if (g[b] != g[i]) { groupAdj.get(g[b]).add(g[i]); groupIn[g[i]]++; }
            }
        }

        // 2. two topological sorts
        int[] itemOrder = topo(n, itemAdj, itemIn);
        int[] groupOrder = topo(groupCount, groupAdj, groupIn);
        if (itemOrder == null || groupOrder == null) return new int[0];

        // 3. bucket items by group (keeps item order), then concatenate buckets in group order
        List<List<Integer>> buckets = newAdj(groupCount);
        for (int item : itemOrder) buckets.get(g[item]).add(item);
        int[] result = new int[n];
        int idx = 0;
        for (int grp : groupOrder) for (int item : buckets.get(grp)) result[idx++] = item;
        return result;
    }

    private List<List<Integer>> newAdj(int size) {
        List<List<Integer>> adj = new ArrayList<>();
        for (int i = 0; i < size; i++) adj.add(new ArrayList<>());
        return adj;
    }

    // generic Kahn over vertices 0..size-1
    private int[] topo(int size, List<List<Integer>> adj, int[] indeg) {
        int[] order = new int[size];
        int tail = 0;
        for (int v = 0; v < size; v++) if (indeg[v] == 0) order[tail++] = v;
        for (int head = 0; head < tail; head++) {
            for (int w : adj.get(order[head])) if (--indeg[w] == 0) order[tail++] = w;
        }
        return tail == size ? order : null;
    }
}
