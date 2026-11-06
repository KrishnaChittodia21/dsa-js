class Solution {
    public int twoCitySchedCost(int[][] costs) {
        // Most "A-favoured" people (A much cheaper than B) first.
        int[][] sorted = costs.clone();
        Arrays.sort(sorted, (x, y) -> Integer.compare(x[0] - x[1], y[0] - y[1]));
        int n = sorted.length / 2;
        int total = 0;
        for (int i = 0; i < sorted.length; i++) {
            total += i < n ? sorted[i][0] : sorted[i][1];
        }
        return total;
    }
}
