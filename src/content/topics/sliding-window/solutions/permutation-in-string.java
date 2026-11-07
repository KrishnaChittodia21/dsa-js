class Solution {
    public boolean checkInclusion(String s1, String s2) {
        int m = s1.length(), n = s2.length();
        if (m > n) return false;
        int[] need = new int[26];
        int[] have = new int[26];
        for (int i = 0; i < m; i++) {
            need[s1.charAt(i) - 'a']++;
            have[s2.charAt(i) - 'a']++;
        }
        int matches = 0;
        for (int c = 0; c < 26; c++) if (need[c] == have[c]) matches++;

        for (int right = m; right < n; right++) {
            if (matches == 26) return true;
            // letter entering on the right
            int c = s2.charAt(right) - 'a';
            if (have[c] == need[c]) matches--;
            have[c]++;
            if (have[c] == need[c]) matches++;
            // letter leaving on the left
            c = s2.charAt(right - m) - 'a';
            if (have[c] == need[c]) matches--;
            have[c]--;
            if (have[c] == need[c]) matches++;
        }
        return matches == 26;
    }
}
