class Codec {
    public String encode(String[] strs) {
        StringBuilder sb = new StringBuilder();
        for (String s : strs) sb.append(s.length()).append('#').append(s);
        return sb.toString();
    }

    public String[] decode(String s) {
        List<String> out = new ArrayList<>();
        int i = 0;
        while (i < s.length()) {
            int hash = s.indexOf('#', i);            // the length is all digits, so the next # ends it
            int len = Integer.parseInt(s.substring(i, hash));
            out.add(s.substring(hash + 1, hash + 1 + len));
            i = hash + 1 + len;                      // skip the word by length — never search inside it
        }
        return out.toArray(new String[0]);
    }
}
