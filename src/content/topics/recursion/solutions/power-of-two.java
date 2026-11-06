class Solution {
    public boolean isPowerOfTwo(int n) {
        if (n <= 0) return false;               // 0 and negatives are never powers of two (and 0 would loop forever)
        if (n == 1) return true;                // 2^0
        if (n % 2 != 0) return false;           // odd and > 1
        return isPowerOfTwo(n / 2);             // halve and trust
    }
}
