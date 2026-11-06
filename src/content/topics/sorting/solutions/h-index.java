class Solution {
    public int hIndex(int[] citations) {
        int[] c = citations.clone();               // don't mutate input
        Arrays.sort(c);                            // ascending: most cited is at the end
        int n = c.length, h = 0;
        while (h < n && c[n - 1 - h] >= h + 1) h++; // top h+1 papers all have >= h+1
        return h;
    }
}
