class Solution {
    public String[] stringMatching(String[] words) {
        List<String> res = new ArrayList<>();
        for (String w : words) {
            int[] lps = buildLps(w);
            // only strictly longer words can contain w (all words are distinct)
            for (String v : words) {
                if (v.length() > w.length() && occurs(v, w, lps)) {
                    res.add(w);
                    break;
                }
            }
        }
        return res.toArray(new String[0]);
    }

    private int[] buildLps(String p) {
        int[] lps = new int[p.length()];
        for (int i = 1, len = 0; i < p.length(); i++) {
            while (len > 0 && p.charAt(i) != p.charAt(len)) len = lps[len - 1];
            if (p.charAt(i) == p.charAt(len)) len++;
            lps[i] = len;
        }
        return lps;
    }

    private boolean occurs(String text, String p, int[] lps) {
        for (int i = 0, j = 0; i < text.length(); i++) {
            while (j > 0 && text.charAt(i) != p.charAt(j)) j = lps[j - 1];
            if (text.charAt(i) == p.charAt(j)) j++;
            if (j == p.length()) return true;
        }
        return false;
    }
}
