class Solution {
    public String removeKdigits(String num, int k) {
        StringBuilder st = new StringBuilder(); // used as a stack of digits
        for (char d : num.toCharArray()) {
            // A bigger digit before a smaller one is never worth keeping.
            while (k > 0 && st.length() > 0 && st.charAt(st.length() - 1) > d) {
                st.deleteCharAt(st.length() - 1);
                k--;
            }
            st.append(d);
        }
        st.setLength(Math.max(0, st.length() - k)); // remaining removals: drop the largest (last) digits
        int i = 0;
        while (i < st.length() - 1 && st.charAt(i) == '0') i++; // strip leading zeros, keep at least one digit
        String res = st.substring(i);
        return res.isEmpty() ? "0" : res;
    }
}
