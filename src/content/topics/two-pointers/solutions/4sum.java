class Solution {
    public int[][] fourSum(int[] nums, int target) {
        int[] a = nums.clone();
        Arrays.sort(a);
        int n = a.length;
        List<int[]> result = new ArrayList<>();
        for (int i = 0; i < n - 3; i++) {
            if (i > 0 && a[i] == a[i - 1]) continue;
            for (int j = i + 1; j < n - 2; j++) {
                if (j > i + 1 && a[j] == a[j - 1]) continue;
                long need = (long) target - a[i] - a[j];   // values up to 10^9: sums need long
                int l = j + 1, r = n - 1;
                while (l < r) {
                    long sum = (long) a[l] + a[r];
                    if (sum < need) l++;
                    else if (sum > need) r--;
                    else {
                        result.add(new int[] {a[i], a[j], a[l], a[r]});
                        l++;
                        r--;
                        while (l < r && a[l] == a[l - 1]) l++;
                        while (l < r && a[r] == a[r + 1]) r--;
                    }
                }
            }
        }
        return result.toArray(new int[0][]);
    }
}
