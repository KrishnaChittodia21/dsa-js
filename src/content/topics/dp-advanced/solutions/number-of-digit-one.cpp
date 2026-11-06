class Solution {
public:
    int countDigitOne(int n) {
        long long count = 0;
        for (long long p = 1; p <= n; p *= 10) {   // place value: 1, 10, 100, ... (long long: p * 10 passes 2^31)
            long long high = n / (p * 10);         // digits left of this place
            long long cur = n / p % 10;            // digit at this place
            long long low = n % p;                 // digits right of this place
            count += high * p;                     // complete 0..9 cycles
            if (cur > 1) count += p;               // the whole "1" block of the last cycle
            else if (cur == 1) count += low + 1;   // only part of it
        }
        return (int)count;
    }
};
