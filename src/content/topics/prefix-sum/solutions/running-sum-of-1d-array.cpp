class Solution {
public:
    vector<int> runningSum(vector<int>& nums) {
        vector<int> result(nums.size());
        int running = 0;
        for (int i = 0; i < (int)nums.size(); i++) {
            running += nums[i];
            result[i] = running;
        }
        return result;
    }
};
