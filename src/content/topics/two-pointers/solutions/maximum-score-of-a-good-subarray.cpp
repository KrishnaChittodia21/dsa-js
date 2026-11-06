class Solution {
public:
    int maximumScore(vector<int>& nums, int k) {
        int n = nums.size();
        int i = k, j = k, curMin = nums[k];
        long long best = nums[k];
        while (i > 0 || j < n - 1) {
            // extend towards the larger neighbour (the only option at an edge)
            if (i == 0) j++;
            else if (j == n - 1) i--;
            else if (nums[j + 1] > nums[i - 1]) j++;
            else i--;
            curMin = min({curMin, nums[i], nums[j]});
            best = max(best, (long long) curMin * (j - i + 1));
        }
        return (int) best;
    }
};
