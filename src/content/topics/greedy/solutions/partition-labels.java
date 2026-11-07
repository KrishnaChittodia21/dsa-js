class Solution {
    public int[] partitionLabels(String s) {
        int[] last = new int[128]; // char -> last index
        for (int i = 0; i < s.length(); i++) last[s.charAt(i)] = i;
        List<Integer> sizes = new ArrayList<>();
        int start = 0, end = 0;
        for (int i = 0; i < s.length(); i++) {
            end = Math.max(end, last[s.charAt(i)]); // part must reach this char's last copy
            if (i == end) {                         // nothing in [start, i] continues further
                sizes.add(end - start + 1);
                start = i + 1;
            }
        }
        return sizes.stream().mapToInt(Integer::intValue).toArray();
    }
}
