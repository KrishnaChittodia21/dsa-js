class Solution {
    public double findMedianSortedArrays(int[] nums1, int[] nums2) {
        // binary search the SHORTER array so j = half - i stays in range
        if (nums1.length > nums2.length) return findMedianSortedArrays(nums2, nums1);
        int[] A = nums1, B = nums2;
        int m = A.length, n = B.length;
        int half = (m + n + 1) / 2;            // size of the left half

        int lo = 0, hi = m;
        while (lo <= hi) {
            int i = lo + (hi - lo) / 2;        // elements taken from A
            int j = half - i;                  // elements taken from B
            int Aleft = i > 0 ? A[i - 1] : Integer.MIN_VALUE;
            int Aright = i < m ? A[i] : Integer.MAX_VALUE;
            int Bleft = j > 0 ? B[j - 1] : Integer.MIN_VALUE;
            int Bright = j < n ? B[j] : Integer.MAX_VALUE;

            if (Aleft <= Bright && Bleft <= Aright) {
                int leftMax = Math.max(Aleft, Bleft);
                if ((m + n) % 2 == 1) return leftMax;
                return (leftMax + (double) Math.min(Aright, Bright)) / 2;
            }
            if (Aleft > Bright) hi = i - 1;    // took too many from A
            else lo = i + 1;                   // took too few from A
        }
        throw new IllegalArgumentException("inputs are not sorted");
    }
}
