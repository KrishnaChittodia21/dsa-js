class Solution {
    public int[] findSubstring(String s, String[] words) {
        int L = words[0].length(), m = words.length, n = s.length();
        Map<String, Integer> need = new HashMap<>();
        for (String w : words) need.merge(w, 1, (a, b) -> a + b);
        List<Integer> result = new ArrayList<>();

        for (int offset = 0; offset < L; offset++) {
            Map<String, Integer> seen = new HashMap<>();
            int left = offset, used = 0;
            for (int j = offset; j + L <= n; j += L) {
                String w = s.substring(j, j + L);
                if (!need.containsKey(w)) {            // impossible word → restart after it
                    seen.clear();
                    used = 0;
                    left = j + L;
                    continue;
                }
                seen.merge(w, 1, (a, b) -> a + b);
                used++;
                while (seen.get(w) > need.get(w)) {    // too many copies of w → shrink
                    seen.merge(s.substring(left, left + L), -1, (a, b) -> a + b);
                    used--;
                    left += L;
                }
                if (used == m) {                       // window holds exactly the multiset
                    result.add(left);
                    seen.merge(s.substring(left, left + L), -1, (a, b) -> a + b);
                    used--;
                    left += L;
                }
            }
        }
        return result.stream().mapToInt(Integer::intValue).sorted().toArray();
    }
}
