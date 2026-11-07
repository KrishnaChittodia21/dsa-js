class Solution {
public:
    vector<string> summaryRanges(vector<int>& nums) {
        vector<string> out;
        int i = 0, n = nums.size();
        while (i < n) {
            int start = nums[i];
            // extend the run while the next number is exactly one more (long long: no overflow at INT_MAX)
            while (i + 1 < n && nums[i + 1] == (long long)nums[i] + 1) i++;
            int end = nums[i];
            out.push_back(start == end ? to_string(start) : to_string(start) + "->" + to_string(end));
            i++;
        }
        return out;
    }
};
