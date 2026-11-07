class Solution {
    public boolean canPlaceFlowers(int[] flowerbed, int n) {
        int[] bed = flowerbed.clone(); // do not mutate the caller's array
        int planted = 0;
        for (int i = 0; i < bed.length && planted < n; i++) {
            boolean leftEmpty = i == 0 || bed[i - 1] == 0;
            boolean rightEmpty = i == bed.length - 1 || bed[i + 1] == 0;
            if (bed[i] == 0 && leftEmpty && rightEmpty) {
                bed[i] = 1; // plant as early as possible
                planted++;
            }
        }
        return planted >= n;
    }
}
