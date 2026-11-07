class Solution {
public:
    vector<int> productExceptSelf(vector<int>& nums) {
        int n = nums.size();
        vector<int> out(n);

        int left = 1;                       // product of nums[0..i-1]
        for (int i = 0; i < n; i++) {
            out[i] = left;
            left *= nums[i];
        }

        int right = 1;                      // product of nums[i+1..n-1]
        for (int i = n - 1; i >= 0; i--) {
            out[i] *= right;
            right *= nums[i];
        }
        return out;
    }
};
