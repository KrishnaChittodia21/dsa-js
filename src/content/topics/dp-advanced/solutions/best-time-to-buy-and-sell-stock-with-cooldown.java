class Solution {
    public int maxProfit(int[] prices) {
        int hold = Integer.MIN_VALUE / 2;   // holding a share is impossible before day 0 (halved: hold + p must not overflow)
        int sold = 0;                       // sold today
        int rest = 0;                       // not holding, not sold today
        for (int p : prices) {
            // right side uses only yesterday's values
            int newHold = Math.max(hold, rest - p);
            int newSold = hold + p;
            int newRest = Math.max(rest, sold);
            hold = newHold;
            sold = newSold;
            rest = newRest;
        }
        return Math.max(sold, rest);
    }
}
