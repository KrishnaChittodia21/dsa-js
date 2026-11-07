class Solution {
public:
    int maxProduct(vector<int>& nums) {
        int hi = nums[0], lo = nums[0], best = nums[0];
        for (int i = 1; i < (int)nums.size(); i++) {
            int x = nums[i];
            int a = hi * x, b = lo * x; // use OLD hi and lo
            hi = max({x, a, b});
            lo = min({x, a, b});
            best = max(best, hi);
        }
        return best;
    }
};
