class Solution {
    public String[] findRepeatedDnaSequences(String s) {
        int L = 10;
        int mask = (1 << (2 * L)) - 1;       // 20 bits = 0xFFFFF
        Set<Integer> seen = new HashSet<>();
        Set<Integer> added = new HashSet<>();
        List<String> res = new ArrayList<>();
        int code = 0;

        for (int i = 0; i < s.length(); i++) {
            code = ((code << 2) | "ACGT".indexOf(s.charAt(i))) & mask; // slide: push new letter, drop the oldest
            if (i < L - 1) continue;                                    // window not full yet
            if (!seen.add(code) && added.add(code)) res.add(s.substring(i - L + 1, i + 1));
        }
        return res.toArray(new String[0]);
    }
}
