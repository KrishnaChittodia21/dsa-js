class Solution {
public:
    int splitArray(vector<int>& nums, int k) {
        long long lo = 0, hi = 0;
        for (int x : nums) {
            lo = max(lo, (long long)x);
            hi += x;
        }
        while (lo < hi) {
            long long mid = (lo + hi) / 2;
            if (partsNeeded(nums, mid) <= k) hi = mid;  // limit works → try smaller
            else lo = mid + 1;                          // too many parts → limit too small
        }
        return (int)lo;
    }

private:
    // minimum number of parts if every part sum must be <= limit
    int partsNeeded(vector<int>& nums, long long limit) {
        int parts = 1;
        long long sum = 0;
        for (int x : nums) {
            if (sum + x > limit) { parts++; sum = 0; }
            sum += x;
        }
        return parts;
    }
};
