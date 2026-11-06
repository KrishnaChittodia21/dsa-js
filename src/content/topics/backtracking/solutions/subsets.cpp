class Solution {
    vector<vector<int>> result;
    vector<int> path;

    void backtrack(const vector<int>& nums, int start) {
        result.push_back(path); // every node is a subset: push_back copies it
        for (int i = start; i < (int)nums.size(); i++) {
            path.push_back(nums[i]); // choose
            backtrack(nums, i + 1);  // explore only later elements
            path.pop_back();         // undo
        }
    }

public:
    vector<vector<int>> subsets(vector<int>& nums) {
        backtrack(nums, 0);
        return result;
    }
};
