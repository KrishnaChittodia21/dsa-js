class Solution {
    public int shipWithinDays(int[] weights, int days) {
        int lo = 0, hi = 0;
        for (int w : weights) {
            lo = Math.max(lo, w);   // must fit the heaviest package
            hi += w;                // one day for everything
        }

        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (daysNeeded(weights, mid) <= days) hi = mid;   // works → try smaller
            else lo = mid + 1;
        }
        return lo;
    }

    private int daysNeeded(int[] weights, int cap) {
        int d = 1, load = 0;
        for (int w : weights) {
            if (load + w > cap) { d++; load = 0; }  // start a new day
            load += w;
        }
        return d;
    }
}
