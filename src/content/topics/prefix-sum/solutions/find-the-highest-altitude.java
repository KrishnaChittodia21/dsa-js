class Solution {
    public int largestAltitude(int[] gain) {
        int altitude = 0, best = 0; // the starting point (altitude 0) counts
        for (int g : gain) {
            altitude += g;
            best = Math.max(best, altitude);
        }
        return best;
    }
}
