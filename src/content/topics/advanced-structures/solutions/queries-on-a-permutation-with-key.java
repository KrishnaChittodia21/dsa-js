class Solution {
    private int[] tree;   // 1-based Fenwick over slots

    private void add(int i, int d) {
        for (; i < tree.length; i += i & -i) tree[i] += d;
    }

    private int prefix(int i) {
        int s = 0;
        for (; i > 0; i -= i & -i) s += tree[i];
        return s;
    }

    public int[] processQueries(int[] queries, int m) {
        int n = queries.length;
        tree = new int[n + m + 1];

        int[] pos = new int[m + 1];
        for (int x = 1; x <= m; x++) {          // initial P = [1..m] after n free slots
            pos[x] = n + x;
            add(pos[x], 1);
        }

        int[] res = new int[n];
        for (int i = 0; i < n; i++) {
            int q = queries[i];
            res[i] = prefix(pos[q]) - 1;        // occupied slots strictly before q
            add(pos[q], -1);                    // leave the old slot
            pos[q] = n - i;                     // fresh slot in front of everything
            add(pos[q], 1);
        }
        return res;
    }
}
