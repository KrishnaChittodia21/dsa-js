class Solution {
    vector<vector<int>> result;
    vector<int> path;

    void backtrack(const vector<int>& nums, int start) {
        result.push_back(path);
        for (int i = start; i < (int)nums.size(); i++) {
            // same value already tried as a sibling at this depth: identical subtree
            if (i > start && nums[i] == nums[i - 1]) continue;
            path.push_back(nums[i]);
            backtrack(nums, i + 1);
            path.pop_back();
        }
    }

public:
    vector<vector<int>> subsetsWithDup(vector<int>& nums) {
        sort(nums.begin(), nums.end()); // group duplicates
        backtrack(nums, 0);
        return result;
    }
};
