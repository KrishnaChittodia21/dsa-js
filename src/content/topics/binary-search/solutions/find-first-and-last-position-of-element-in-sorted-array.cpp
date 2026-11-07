class Solution {
public:
    vector<int> searchRange(vector<int>& nums, int target) {
        int n = nums.size();
        int first = firstAtLeast(nums, target);
        if (first == n || nums[first] != target) return {-1, -1};
        int last = firstAtLeast(nums, (long long)target + 1) - 1;   // upper bound − 1
        return {first, last};
    }

private:
    // first index i with nums[i] >= x (nums.size() if none)
    int firstAtLeast(vector<int>& nums, long long x) {
        int lo = 0, hi = nums.size();
        while (lo < hi) {
            int mid = lo + ((hi - lo) >> 1);
            if (nums[mid] >= x) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }
};
