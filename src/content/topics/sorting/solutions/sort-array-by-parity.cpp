class Solution {
public:
    vector<int> sortArrayByParity(vector<int>& nums) {
        int store = 0;                          // nums[0..store) are even
        for (int i = 0; i < (int)nums.size(); i++) {
            if (nums[i] % 2 == 0) {
                swap(nums[i], nums[store]);
                store++;
            }
        }
        return nums;
    }
};
