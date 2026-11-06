class Solution {
    public String customSortString(String order, String s) {
        int[] count = new int[26];
        for (char c : s.toCharArray()) count[c - 'a']++;

        StringBuilder out = new StringBuilder();
        for (char c : order.toCharArray()) {    // letters in the custom order
            int k = c - 'a';
            out.append(String.valueOf(c).repeat(count[k]));
            count[k] = 0;
        }
        for (int k = 0; k < 26; k++) {          // everything else, anywhere
            out.append(String.valueOf((char) ('a' + k)).repeat(count[k]));
        }
        return out.toString();
    }
}
