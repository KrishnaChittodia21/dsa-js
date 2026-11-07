class Solution {
    public boolean lemonadeChange(int[] bills) {
        int five = 0, ten = 0;
        for (int bill : bills) {
            if (bill == 5) {
                five++;
            } else if (bill == 10) {
                if (five == 0) return false;
                five--; ten++;
            } else {                                      // $20: owe $15
                if (ten > 0 && five > 0) { ten--; five--; } // keep $5s: they are more flexible
                else if (five >= 3) five -= 3;
                else return false;
            }
        }
        return true;
    }
}
