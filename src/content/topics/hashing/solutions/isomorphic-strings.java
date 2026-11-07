class Solution {
    public boolean isIsomorphic(String s, String t) {
        if (s.length() != t.length()) return false;
        Map<Character, Character> sToT = new HashMap<>();
        Map<Character, Character> tToS = new HashMap<>();
        for (int i = 0; i < s.length(); i++) {
            char a = s.charAt(i), b = t.charAt(i);
            if (sToT.containsKey(a) && sToT.get(a) != b) return false; // a already maps elsewhere
            if (tToS.containsKey(b) && tToS.get(b) != a) return false; // b already taken by another char
            sToT.put(a, b);
            tToS.put(b, a);
        }
        return true;
    }
}
