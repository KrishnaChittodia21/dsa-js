class Solution {
    public int minMeetingRooms(int[][] intervals) {
        int n = intervals.length;
        int[] starts = new int[n], ends = new int[n];
        for (int i = 0; i < n; i++) {
            starts[i] = intervals[i][0];
            ends[i] = intervals[i][1];
        }
        Arrays.sort(starts);
        Arrays.sort(ends);
        int rooms = 0;
        int j = 0; // ends[0..j-1] are meetings that have already finished
        for (int i = 0; i < n; i++) {
            if (starts[i] >= ends[j]) {
                j++;     // some meeting finished by now -> reuse its room
            } else {
                rooms++; // all rooms busy -> open a new one
            }
        }
        return rooms;
    }
}
