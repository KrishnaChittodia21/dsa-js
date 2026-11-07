class Solution {
    private String s;
    private int i;                              // shared cursor: every call advances it

    public boolean parseBoolExpr(String expression) {
        s = expression;
        i = 0;
        return parse();
    }

    private boolean parse() {
        char c = s.charAt(i++);
        if (c == 't') return true;
        if (c == 'f') return false;

        i++;                                    // skip '('
        List<Boolean> values = new ArrayList<>();
        while (s.charAt(i) != ')') {
            values.add(parse());                // recursive call consumes one whole child
            if (s.charAt(i) == ',') i++;        // skip separator
        }
        i++;                                    // skip ')'

        if (c == '!') return !values.get(0);
        if (c == '&') return !values.contains(false);
        return values.contains(true);           // '|'
    }
}
