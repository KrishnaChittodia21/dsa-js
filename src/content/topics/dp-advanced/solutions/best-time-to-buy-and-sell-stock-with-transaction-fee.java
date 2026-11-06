class Solution {
    public int maxProfit(int[] prices, int fee) {
        int cash = 0;              // best profit with no share in hand
        int hold = -prices[0];     // best profit while holding one share
        for (int i = 1; i < prices.length; i++) {
            int p = prices[i];
            int prevCash = cash;
            cash = Math.max(cash, hold + p - fee);   // sell today (pay the fee)
            hold = Math.max(hold, prevCash - p);     // buy today
        }
        return cash;
    }
}
