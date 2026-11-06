class Solution {
    public int lengthOfLIS(int[] nums) {
        int[] tails = new int[nums.length];   // tails[k] = smallest tail of an increasing subsequence of length k + 1
        int len = 0;
        for (int x : nums) {
            int lo = 0, hi = len;             // first index with tails[idx] >= x
            while (lo < hi) {
                int mid = (lo + hi) >>> 1;
                if (tails[mid] < x) lo = mid + 1;
                else hi = mid;
            }
            tails[lo] = x;                    // lo == len -> extend; else improve a tail
            if (lo == len) len++;
        }
        return len;
    }
}
