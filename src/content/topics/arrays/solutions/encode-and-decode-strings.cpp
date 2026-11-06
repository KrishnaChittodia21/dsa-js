class Codec {
public:
    string encode(vector<string>& strs) {
        string out;
        for (const string& s : strs) out += to_string(s.size()) + '#' + s;
        return out;
    }

    vector<string> decode(string s) {
        vector<string> out;
        size_t i = 0;
        while (i < s.size()) {
            size_t hash = s.find('#', i);            // the length is all digits, so the next # ends it
            size_t len = stoul(s.substr(i, hash - i));
            out.push_back(s.substr(hash + 1, len));
            i = hash + 1 + len;                      // skip the word by length — never search inside it
        }
        return out;
    }
};
