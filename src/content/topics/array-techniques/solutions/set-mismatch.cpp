class Solution {
public:
    vector<int> findErrorNums(vector<int>& nums) {
        int i = 0, n = nums.size();
        while (i < n) {
            int h = nums[i] - 1;
            if (nums[h] != nums[i]) {
                swap(nums[i], nums[h]);   // send nums[i] home
            } else {
                i++;                      // home, or duplicate
            }
        }
        for (int j = 0; j < n; j++) {
            if (nums[j] != j + 1) return {nums[j], j + 1};
        }
        return {};
    }
};
