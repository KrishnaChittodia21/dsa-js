class Solution {
public:
    vector<int> findDisappearedNumbers(vector<int>& nums) {
        for (int i = 0; i < (int)nums.size(); i++) {
            int v = abs(nums[i]);                   // original value (cell may be marked)
            nums[v - 1] = -abs(nums[v - 1]);        // mark "v seen" (safe to repeat)
        }
        vector<int> missing;
        for (int j = 0; j < (int)nums.size(); j++) {
            if (nums[j] > 0) missing.push_back(j + 1); // never marked -> j + 1 missing
        }
        return missing;
    }
};
