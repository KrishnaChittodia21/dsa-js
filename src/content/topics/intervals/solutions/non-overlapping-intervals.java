class Solution {
    public int eraseOverlapIntervals(int[][] intervals) {
        int[][] sorted = intervals.clone();
        Arrays.sort(sorted, (a, b) -> Integer.compare(a[1], b[1])); // earliest end first
        int kept = 0;
        long lastEnd = Long.MIN_VALUE;
        for (int[] in : sorted) {
            if (in[0] >= lastEnd) { // touching is fine
                kept++;
                lastEnd = in[1];
            }
        }
        return intervals.length - kept;
    }
}
