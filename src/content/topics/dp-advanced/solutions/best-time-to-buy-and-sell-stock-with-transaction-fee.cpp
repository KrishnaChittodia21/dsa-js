class Solution {
public:
    int maxProfit(vector<int>& prices, int fee) {
        int cash = 0;              // best profit with no share in hand
        int hold = -prices[0];     // best profit while holding one share
        for (size_t i = 1; i < prices.size(); i++) {
            int p = prices[i];
            int prevCash = cash;
            cash = max(cash, hold + p - fee);   // sell today (pay the fee)
            hold = max(hold, prevCash - p);     // buy today
        }
        return cash;
    }
};
