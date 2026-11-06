class Solution {
    public int[][] threeSum(int[] nums) {
        int[] a = nums.clone();
        Arrays.sort(a);
        int n = a.length;
        List<int[]> result = new ArrayList<>();
        for (int i = 0; i < n - 2; i++) {
            if (a[i] > 0) break;                          // smallest value positive → done
            if (i > 0 && a[i] == a[i - 1]) continue;      // same first value → same triplets
            int l = i + 1, r = n - 1;
            while (l < r) {
                int sum = a[i] + a[l] + a[r];
                if (sum < 0) l++;
                else if (sum > 0) r--;
                else {
                    result.add(new int[] {a[i], a[l], a[r]});
                    l++;
                    r--;
                    while (l < r && a[l] == a[l - 1]) l++; // skip duplicate middles
                    while (l < r && a[r] == a[r + 1]) r--; // skip duplicate lasts
                }
            }
        }
        return result.toArray(new int[0][]);
    }
}
