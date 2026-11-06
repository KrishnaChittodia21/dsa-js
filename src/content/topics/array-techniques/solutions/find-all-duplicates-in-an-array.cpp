class Solution {
public:
    vector<int> findDuplicates(vector<int>& nums) {
        vector<int> dup;
        for (int i = 0; i < (int)nums.size(); i++) {
            int v = abs(nums[i]);
            if (nums[v - 1] < 0) dup.push_back(v); // second time we see v
            else nums[v - 1] = -nums[v - 1];       // first time: mark it
        }
        return dup;
    }
};
