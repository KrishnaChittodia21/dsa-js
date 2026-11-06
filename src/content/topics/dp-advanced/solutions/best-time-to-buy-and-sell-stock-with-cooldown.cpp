class Solution {
public:
    int maxProfit(vector<int>& prices) {
        int hold = INT_MIN / 2;   // holding a share is impossible before day 0 (halved: hold + p must not overflow)
        int sold = 0;             // sold today
        int rest = 0;             // not holding, not sold today
        for (int p : prices) {
            // right side uses only yesterday's values
            tie(hold, sold, rest) = make_tuple(max(hold, rest - p), hold + p, max(rest, sold));
        }
        return max(sold, rest);
    }
};
