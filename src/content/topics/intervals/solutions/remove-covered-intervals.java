class Solution {
    public int removeCoveredIntervals(int[][] intervals) {
        // start ascending; on equal start, the LONGER interval first (it covers the others)
        int[][] sorted = intervals.clone();
        Arrays.sort(sorted, (a, b) -> a[0] != b[0] ? Integer.compare(a[0], b[0]) : Integer.compare(b[1], a[1]));
        int remaining = 0;
        long maxEnd = Long.MIN_VALUE;
        for (int[] in : sorted) {
            if (in[1] > maxEnd) { // not covered by anything earlier
                remaining++;
                maxEnd = in[1];
            }
        }
        return remaining;
    }
}
