class Solution {
    public int[][] buildMatrix(int k, int[][] rowConditions, int[][] colConditions) {
        int[] rowOrder = topo(k, rowConditions);
        int[] colOrder = topo(k, colConditions);
        if (rowOrder == null || colOrder == null) return new int[0][0];

        int[] colPos = new int[k + 1];
        for (int i = 0; i < k; i++) colPos[colOrder[i]] = i;
        int[][] matrix = new int[k][k];
        for (int r = 0; r < k; r++) matrix[r][colPos[rowOrder[r]]] = rowOrder[r];
        return matrix;
    }

    // Kahn over numbers 1..k; returns the order or null on a cycle
    private int[] topo(int k, int[][] conditions) {
        List<List<Integer>> adj = new ArrayList<>();
        for (int i = 0; i <= k; i++) adj.add(new ArrayList<>());
        int[] indeg = new int[k + 1];
        for (int[] c : conditions) { adj.get(c[0]).add(c[1]); indeg[c[1]]++; }
        int[] order = new int[k];
        int tail = 0;
        for (int x = 1; x <= k; x++) if (indeg[x] == 0) order[tail++] = x;
        for (int head = 0; head < tail; head++) {
            for (int y : adj.get(order[head])) if (--indeg[y] == 0) order[tail++] = y;
        }
        return tail == k ? order : null;
    }
}
