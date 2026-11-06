class Solution {
public:
    int maxProfit(int k, vector<int>& prices) {
        int n = prices.size();
        if (k >= n / 2) {                              // limit can never bind
            int profit = 0;
            for (int i = 1; i < n; i++) profit += max(0, prices[i] - prices[i - 1]);
            return profit;
        }
        vector<int> buy(k + 1, INT_MIN);               // holding share of transaction j; set by the first price before sell reads it
        vector<int> sell(k + 1, 0);                    // finished j transactions
        for (int p : prices) {
            for (int j = 1; j <= k; j++) {
                buy[j] = max(buy[j], sell[j - 1] - p);
                sell[j] = max(sell[j], buy[j] + p);
            }
        }
        return sell[k];
    }
};
