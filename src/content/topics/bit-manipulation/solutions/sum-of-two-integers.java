class Solution {
    public int getSum(int a, int b) {
        while (b != 0) {
            int carry = (a & b) << 1;   // carries, shifted into the next column
            a = a ^ b;                  // column sums without carries
            b = carry;
        }
        return a;
    }
}
