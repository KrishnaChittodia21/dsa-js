class Solution {
    // sum of XOR totals of all subsets that extend the current choice
    int dfs(const vector<int>& nums, int i, int x) {
        if (i == (int)nums.size()) return x; // one complete subset
        return dfs(nums, i + 1, x ^ nums[i]) // include nums[i]
             + dfs(nums, i + 1, x);          // exclude nums[i]
    }

public:
    int subsetXORSum(vector<int>& nums) {
        return dfs(nums, 0, 0);
    }
};
