class Solution {
    public int maxProfit(int k, int[] prices) {
        int n = prices.length;
        if (k >= n / 2) {                              // limit can never bind
            int profit = 0;
            for (int i = 1; i < n; i++) profit += Math.max(0, prices[i] - prices[i - 1]);
            return profit;
        }
        int[] buy = new int[k + 1];                    // holding share of transaction j
        int[] sell = new int[k + 1];                   // finished j transactions
        Arrays.fill(buy, Integer.MIN_VALUE);           // set by the first price before sell reads it
        for (int p : prices) {
            for (int j = 1; j <= k; j++) {
                buy[j] = Math.max(buy[j], sell[j - 1] - p);
                sell[j] = Math.max(sell[j], buy[j] + p);
            }
        }
        return sell[k];
    }
}
