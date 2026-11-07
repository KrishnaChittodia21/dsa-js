class Solution {
public:
    int getSum(int a, int b) {
        while (b != 0) {
            // unsigned: left-shifting a negative int is undefined before C++20
            int carry = (int)((unsigned)(a & b) << 1);   // carries, shifted into the next column
            a = a ^ b;                                   // column sums without carries
            b = carry;
        }
        return a;
    }
};
