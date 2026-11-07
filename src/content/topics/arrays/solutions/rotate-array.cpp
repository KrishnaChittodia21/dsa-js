class Solution {
public:
    void rotate(vector<int>& nums, int k) {
        int n = nums.size();
        k %= n;                          // rotating by n is a full circle
        reverse(nums.begin(), nums.end());          // [A B] → [rev(B) rev(A)]
        reverse(nums.begin(), nums.begin() + k);    // → [B rev(A)]
        reverse(nums.begin() + k, nums.end());      // → [B A]
    }
};
