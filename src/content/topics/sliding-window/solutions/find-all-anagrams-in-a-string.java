class Solution {
    public int[] findAnagrams(String s, String p) {
        int m = p.length();
        List<Integer> result = new ArrayList<>();
        if (m > s.length()) return new int[0];
        int[] need = new int[26];
        for (int i = 0; i < m; i++) need[p.charAt(i) - 'a']++;
        int missing = m;

        for (int right = 0; right < s.length(); right++) {
            int inC = s.charAt(right) - 'a';
            if (need[inC] > 0) missing--;   // this letter was still needed
            need[inC]--;

            if (right >= m) {                // keep the window at size m
                int outC = s.charAt(right - m) - 'a';
                need[outC]++;
                if (need[outC] > 0) missing++; // we removed a needed letter
            }
            if (right >= m - 1 && missing == 0) result.add(right - m + 1);
        }
        return result.stream().mapToInt(Integer::intValue).toArray();
    }
}
