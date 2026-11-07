class Solution {
    public boolean isPerfectSquare(int num) {
        int lo = 1, hi = Math.min(num, 46341);
        while (lo <= hi) {
            int mid = lo + (hi - lo) / 2;
            long sq = (long) mid * mid;
            if (sq == num) return true;
            if (sq < num) lo = mid + 1;
            else hi = mid - 1;
        }
        return false;
    }
}
