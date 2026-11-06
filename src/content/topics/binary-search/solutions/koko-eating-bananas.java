class Solution {
    public int minEatingSpeed(int[] piles, int h) {
        int lo = 1, hi = 0;
        for (int p : piles) hi = Math.max(hi, p);   // max speed ever needed

        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;           // lo + hi can overflow int
            if (hoursAt(piles, mid) <= h) hi = mid; // fast enough → try slower
            else lo = mid + 1;                      // too slow
        }
        return lo;
    }

    private long hoursAt(int[] piles, int k) {
        long hours = 0;
        for (int p : piles) hours += (p + (long) k - 1) / k; // ceil(p / k)
        return hours;
    }
}
