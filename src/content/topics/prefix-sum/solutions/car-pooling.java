class Solution {
    public boolean carPooling(int[][] trips, int capacity) {
        int maxPos = 0;
        for (int[] t : trips) maxPos = Math.max(maxPos, t[2]);
        int[] diff = new int[maxPos + 1];
        for (int[] t : trips) {
            diff[t[1]] += t[0]; // board at from
            diff[t[2]] -= t[0]; // leave AT to (half-open [from, to))
        }
        int load = 0;
        for (int km = 0; km <= maxPos; km++) {
            load += diff[km];
            if (load > capacity) return false;
        }
        return true;
    }
}
