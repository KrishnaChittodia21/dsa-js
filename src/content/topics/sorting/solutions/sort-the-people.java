class Solution {
    public String[] sortPeople(String[] names, int[] heights) {
        int n = names.length;
        Integer[] idx = new Integer[n];
        for (int i = 0; i < n; i++) idx[i] = i;
        Arrays.sort(idx, (i, j) -> Integer.compare(heights[j], heights[i]));  // tallest first
        String[] out = new String[n];
        for (int k = 0; k < n; k++) out[k] = names[idx[k]];
        return out;
    }
}
