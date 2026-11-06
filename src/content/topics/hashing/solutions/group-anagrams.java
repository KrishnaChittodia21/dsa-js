class Solution {
    public String[][] groupAnagrams(String[] strs) {
        Map<String, List<String>> groups = new LinkedHashMap<>(); // sorted letters → words
        for (String s : strs) {
            char[] k = s.toCharArray();
            Arrays.sort(k);
            groups.computeIfAbsent(new String(k), x -> new ArrayList<>()).add(s);
        }
        String[][] out = new String[groups.size()][];
        int i = 0;
        for (List<String> g : groups.values()) out[i++] = g.toArray(new String[0]);
        return out;
    }
}
