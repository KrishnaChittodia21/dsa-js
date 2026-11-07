class Solution {
    public long countInversions(int[] nums) {
        int[] a = nums.clone();                 // work on a copy
        int[] buf = new int[a.length];
        return sort(a, buf, 0, a.length);
    }

    // counts inversions in a[lo..hi) and sorts it
    private long sort(int[] a, int[] buf, int lo, int hi) {
        if (hi - lo <= 1) return 0;
        int mid = (lo + hi) >>> 1;
        long count = sort(a, buf, lo, mid) + sort(a, buf, mid, hi);
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
}
