class Solution {
public:
    int maxProfit(vector<int>& prices) {
        int minSoFar = INT_MAX;  // cheapest price on any earlier day
        int best = 0;            // 0 = "don't trade"
        for (int price : prices) {
            if (minSoFar != INT_MAX) best = max(best, price - minSoFar); // sell today
            minSoFar = min(minSoFar, price);    // today can be a future buy day
        }
        return best;
    }
};
