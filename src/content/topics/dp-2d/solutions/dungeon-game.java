class Solution {
    public int calculateMinimumHP(int[][] dungeon) {
        int m = dungeon.length, n = dungeon[0].length;
        int[] need = new int[n + 1];                  // need[c] for the row below; need[n] = sentinel
        Arrays.fill(need, Integer.MAX_VALUE);
        need[n - 1] = 1;                              // "below the goal": leave with at least 1
        for (int r = m - 1; r >= 0; r--) {
            for (int c = n - 1; c >= 0; c--) {
                int next = Math.min(need[c] /* below */, need[c + 1] /* right */);
                need[c] = Math.max(1, next - dungeon[r][c]);
            }
            need[n] = Integer.MAX_VALUE;              // keep the sentinel
        }
        return need[0];
    }
}
