class Solution {
    public int candy(int[] ratings) {
        int n = ratings.length;
        int[] give = new int[n];
        Arrays.fill(give, 1);
        // Pass 1: satisfy "more than my left neighbour".
        for (int i = 1; i < n; i++) {
            if (ratings[i] > ratings[i - 1]) give[i] = give[i - 1] + 1;
        }
        // Pass 2: satisfy "more than my right neighbour" without breaking pass 1.
        for (int i = n - 2; i >= 0; i--) {
            if (ratings[i] > ratings[i + 1]) give[i] = Math.max(give[i], give[i + 1] + 1);
        }
        int total = 0;
        for (int c : give) total += c;
        return total;
    }
}
