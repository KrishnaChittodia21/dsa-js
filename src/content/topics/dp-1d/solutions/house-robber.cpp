class Solution {
public:
    int rob(vector<int>& nums) {
        int prev2 = 0; // best for the first i-2 houses
        int prev1 = 0; // best for the first i-1 houses
        for (int money : nums) {
            int cur = max(prev1, prev2 + money); // skip this house, or rob it
            prev2 = prev1;
            prev1 = cur;
        }
        return prev1;
    }
};
