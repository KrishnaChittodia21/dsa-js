class Solution {
public:
    vector<int> sortArray(vector<int>& nums) {
        vector<int> buf(nums.size());
        sort(nums, buf, 0, nums.size());
        return nums;
    }

private:
    // sorts nums[lo..hi)
    void sort(vector<int>& nums, vector<int>& buf, int lo, int hi) {
        if (hi - lo <= 1) return;
        int mid = (lo + hi) / 2;
        sort(nums, buf, lo, mid);
        sort(nums, buf, mid, hi);
        int i = lo, j = mid, k = lo;
        while (i < mid && j < hi) {
            buf[k++] = nums[i] <= nums[j] ? nums[i++] : nums[j++];  // <= → stable
        }
        while (i < mid) buf[k++] = nums[i++];
        while (j < hi) buf[k++] = nums[j++];
        for (int t = lo; t < hi; t++) nums[t] = buf[t];
    }
};
