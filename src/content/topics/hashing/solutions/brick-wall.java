class Solution {
    public int leastBricks(int[][] wall) {
        Map<Long, Integer> edges = new HashMap<>();   // x position -> rows with an edge there
        int maxEdges = 0;
        for (int[] row : wall) {
            long pos = 0;
            for (int i = 0; i < row.length - 1; i++) {   // skip the last brick (outer edge)
                pos += row[i];
                maxEdges = Math.max(maxEdges, edges.merge(pos, 1, (a, b) -> a + b));
            }
        }
        return wall.length - maxEdges;
    }
}
