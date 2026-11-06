class Solution {
    public int maxEnvelopes(int[][] envelopes) {
        // width ascending; equal widths -> height DESCENDING (so they cannot chain)
        int[][] sorted = envelopes.clone();
        Arrays.sort(sorted, (a, b) -> a[0] != b[0] ? Integer.compare(a[0], b[0]) : Integer.compare(b[1], a[1]));

        int[] tails = new int[sorted.length];   // patience sorting on heights
        int len = 0;
        for (int[] e : sorted) {
            int h = e[1], lo = 0, hi = len;
            while (lo < hi) {
                int mid = (lo + hi) >>> 1;
                if (tails[mid] < h) lo = mid + 1;   // lower bound -> strictly increasing
                else hi = mid;
            }
            tails[lo] = h;
            if (lo == len) len++;
        }
        return len;
    }
}
