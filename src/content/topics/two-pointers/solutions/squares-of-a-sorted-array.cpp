class Solution {
public:
    vector<int> sortedSquares(vector<int>& nums) {
        int n = nums.size();
        vector<int> out(n);
        int l = 0, r = n - 1;
        for (int w = n - 1; w >= 0; w--) {       // fill from the largest square down
            if (abs(nums[l]) > abs(nums[r])) {
                out[w] = nums[l] * nums[l];
                l++;
            } else {
                out[w] = nums[r] * nums[r];
                r--;
            }
        }
        return out;
    }
};
