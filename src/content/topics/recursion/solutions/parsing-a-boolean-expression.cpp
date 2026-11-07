class Solution {
public:
    bool parseBoolExpr(string expression) {
        int i = 0;                              // shared cursor: every call advances it
        return parse(expression, i);
    }

private:
    bool parse(const string& s, int& i) {
        char c = s[i++];
        if (c == 't') return true;
        if (c == 'f') return false;

        i++;                                    // skip '('
        vector<bool> values;
        while (s[i] != ')') {
            values.push_back(parse(s, i));      // recursive call consumes one whole child
            if (s[i] == ',') i++;               // skip separator
        }
        i++;                                    // skip ')'

        if (c == '!') return !values[0];
        if (c == '&') return all_of(values.begin(), values.end(), [](bool v) { return v; });
        return any_of(values.begin(), values.end(), [](bool v) { return v; }); // '|'
    }
};
