class Solution {
    public int[] corpFlightBookings(int[][] bookings, int n) {
        int[] diff = new int[n + 1]; // extra slot for last == n
        for (int[] b : bookings) {
            diff[b[0] - 1] += b[2]; // block starts at 0-based index first - 1
            diff[b[1]] -= b[2];     // ...and ends at last - 1, so it stops at index last
        }
        int[] answer = new int[n];
        int running = 0;
        for (int i = 0; i < n; i++) {
            running += diff[i];
            answer[i] = running;
        }
        return answer;
    }
}
