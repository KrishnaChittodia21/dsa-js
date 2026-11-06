class Solution {
    private int[] mx, tag;

    public int[] fallingSquares(int[][] positions) {
        // 1. coordinate compression of all edges
        TreeSet<Integer> set = new TreeSet<>();
        for (int[] p : positions) {
            set.add(p[0]);
            set.add(p[0] + p[1]);
        }
        Map<Integer, Integer> idx = new HashMap<>();
        for (int x : set) idx.put(x, idx.size());
        int m = set.size() - 1;              // number of cells [xs[k], xs[k+1])
        mx = new int[4 * m];                 // max height inside the node
        tag = new int[4 * m];                // every cell of the node is at least this

        int[] res = new int[positions.length];
        int best = 0;
        for (int k = 0; k < positions.length; k++) {
            int left = positions[k][0], side = positions[k][1];
            int L = idx.get(left), R = idx.get(left + side) - 1;  // cells covered by the square
            int h = query(1, 0, m - 1, L, R) + side;
            raise(1, 0, m - 1, L, R, h);
            best = Math.max(best, h);
            res[k] = best;
        }
        return res;
    }

    private int query(int node, int lo, int hi, int l, int r) {
        if (r < lo || hi < l) return 0;
        if (l <= lo && hi <= r) return mx[node];
        int mid = (lo + hi) >> 1;
        return Math.max(tag[node], Math.max(query(2 * node, lo, mid, l, r), query(2 * node + 1, mid + 1, hi, l, r)));
    }

    private void raise(int node, int lo, int hi, int l, int r, int h) {
        if (r < lo || hi < l) return;
        mx[node] = Math.max(mx[node], h);    // some cell inside now reaches h
        if (l <= lo && hi <= r) {
            tag[node] = Math.max(tag[node], h);
            return;
        }
        int mid = (lo + hi) >> 1;
        raise(2 * node, lo, mid, l, r, h);
        raise(2 * node + 1, mid + 1, hi, l, r, h);
    }
}
