class Solution {
    public int[] plusOne(int[] digits) {
        for (int i = digits.length - 1; i >= 0; i--) {
            if (digits[i] < 9) {
                digits[i]++;        // absorbs the carry — nothing further changes
                return digits;
            }
            digits[i] = 0;        // 9 + 1 = 10 → write 0, carry 1 to the left
        }
        int[] out = new int[digits.length + 1]; // every digit was 9: 99…9 + 1 = 100…0
        out[0] = 1;
        return out;
    }
}
