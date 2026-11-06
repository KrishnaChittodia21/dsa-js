class Solution {
    public int maxProfit(int[] prices) {
        int minSoFar = Integer.MAX_VALUE;  // cheapest price on any earlier day
        int best = 0;                      // 0 = "don't trade"
        for (int price : prices) {
            if (minSoFar != Integer.MAX_VALUE) best = Math.max(best, price - minSoFar); // sell today
            minSoFar = Math.min(minSoFar, price);    // today can be a future buy day
        }
        return best;
    }
}
