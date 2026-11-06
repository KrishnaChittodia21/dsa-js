class Solution {
    public int[] decrypt(int[] code, int k) {
        int n = code.length;
        int[] result = new int[n];
        if (k == 0) return result;

        // Window (inclusive) used for index 0; later windows are shifted copies.
        int start = k > 0 ? 1 : n + k;
        int end = k > 0 ? k : n - 1;
        int sum = 0;
        for (int j = start; j <= end; j++) sum += code[j % n];

        for (int i = 0; i < n; i++) {
            result[i] = sum;
            sum -= code[start % n];       // leaves on the left
            end++;
            sum += code[end % n];         // enters on the right
            start++;
        }
        return result;
    }
}
