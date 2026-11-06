class Solution {
    public int maximumGap(int[] nums) {
        int n = nums.length;
        if (n < 2) return 0;
        int lo = Integer.MAX_VALUE, hi = Integer.MIN_VALUE;
        for (int x : nums) {
            lo = Math.min(lo, x);
            hi = Math.max(hi, x);
        }
        if (lo == hi) return 0;

        int width = Math.max(1, (hi - lo) / (n - 1));
        int count = (hi - lo) / width + 1;
        int[] bMin = new int[count];
        int[] bMax = new int[count];
        Arrays.fill(bMin, Integer.MAX_VALUE);
        Arrays.fill(bMax, Integer.MIN_VALUE);
        for (int x : nums) {
            int b = (x - lo) / width;
            bMin[b] = Math.min(bMin[b], x);
            bMax[b] = Math.max(bMax[b], x);
        }

        int best = 0;
        int prevMax = lo;
        for (int b = 0; b < count; b++) {
            if (bMin[b] == Integer.MAX_VALUE) continue;  // empty bucket
            best = Math.max(best, bMin[b] - prevMax);
            prevMax = bMax[b];
        }
        return best;
    }
}
