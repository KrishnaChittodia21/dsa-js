class Solution {
public:
    double findMedianSortedArrays(vector<int>& nums1, vector<int>& nums2) {
        // binary search the SHORTER array so j = half - i stays in range
        if (nums1.size() > nums2.size()) return findMedianSortedArrays(nums2, nums1);
        vector<int>& A = nums1;
        vector<int>& B = nums2;
        int m = A.size(), n = B.size();
        int half = (m + n + 1) / 2;            // size of the left half

        int lo = 0, hi = m;
        while (lo <= hi) {
            int i = lo + (hi - lo) / 2;        // elements taken from A
            int j = half - i;                  // elements taken from B
            int Aleft = i > 0 ? A[i - 1] : INT_MIN;
            int Aright = i < m ? A[i] : INT_MAX;
            int Bleft = j > 0 ? B[j - 1] : INT_MIN;
            int Bright = j < n ? B[j] : INT_MAX;

            if (Aleft <= Bright && Bleft <= Aright) {
                int leftMax = max(Aleft, Bleft);
                if ((m + n) % 2 == 1) return leftMax;
                return (leftMax + (double) min(Aright, Bright)) / 2;
            }
            if (Aleft > Bright) hi = i - 1;    // took too many from A
            else lo = i + 1;                   // took too few from A
        }
        throw invalid_argument("inputs are not sorted");
    }
};
