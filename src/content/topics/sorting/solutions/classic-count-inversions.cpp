class Solution {
public:
    long long countInversions(vector<int>& nums) {
        vector<int> a = nums;                   // work on a copy
        vector<int> buf(a.size());
        return sort(a, buf, 0, a.size());
    }

private:
    // counts inversions in a[lo..hi) and sorts it
    long long sort(vector<int>& a, vector<int>& buf, int lo, int hi) {
        if (hi - lo <= 1) return 0;
        int mid = (lo + hi) / 2;
        long long count = sort(a, buf, lo, mid) + sort(a, buf, mid, hi);
        int i = lo, j = mid, k = lo;
        while (i < mid && j < hi) {
            if (a[i] <= a[j]) {
                buf[k++] = a[i++];
            } else {
                count += mid - i;               // a[i..mid) are all > a[j]
                buf[k++] = a[j++];
            }
        }
        while (i < mid) buf[k++] = a[i++];
        while (j < hi) buf[k++] = a[j++];
        for (int t = lo; t < hi; t++) a[t] = buf[t];
        return count;
    }
};
