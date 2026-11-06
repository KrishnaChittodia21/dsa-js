class Solution {
public:
    int smallestDistancePair(vector<int>& nums, int k) {
        sort(nums.begin(), nums.end());
        int n = nums.size();
        int lo = 0, hi = nums[n - 1] - nums[0];
        while (lo < hi) {
            int mid = lo + ((hi - lo) >> 1);
            if (countAtMost(nums, mid) >= k) hi = mid;  // at least k pairs within mid
            else lo = mid + 1;
        }
        return lo;
    }

private:
    // number of pairs with distance <= d (two pointers on the sorted array)
    long long countAtMost(vector<int>& nums, int d) {
        long long count = 0;
        int left = 0;
        for (int right = 0; right < (int)nums.size(); right++) {
            while (nums[right] - nums[left] > d) left++;
            count += right - left;                      // pairs (left..right-1, right)
        }
        return count;
    }
};
