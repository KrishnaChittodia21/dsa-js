class Solution {
    public int[][] insert(int[][] intervals, int[] newInterval) {
        List<int[]> out = new ArrayList<>();
        int s = newInterval[0], e = newInterval[1];
        int i = 0, n = intervals.length;

        // 1. entirely before the new interval
        while (i < n && intervals[i][1] < s) out.add(intervals[i++]);

        // 2. overlapping (or touching) — absorb into [s, e]
        while (i < n && intervals[i][0] <= e) {
            s = Math.min(s, intervals[i][0]);
            e = Math.max(e, intervals[i][1]);
            i++;
        }
        out.add(new int[]{s, e});

        // 3. entirely after
        while (i < n) out.add(intervals[i++]);
        return out.toArray(new int[0][]);
    }
}
