class Solution {
public:
    string removeKdigits(string num, int k) {
        string st; // used as a stack of digits
        for (char d : num) {
            // A bigger digit before a smaller one is never worth keeping.
            while (k > 0 && !st.empty() && st.back() > d) {
                st.pop_back();
                k--;
            }
            st.push_back(d);
        }
        st.resize(max(0, (int) st.size() - k)); // remaining removals: drop the largest (last) digits
        int i = 0;
        while (i + 1 < (int) st.size() && st[i] == '0') i++; // strip leading zeros, keep at least one digit
        string res = st.substr(i);
        return res.empty() ? "0" : res;
    }
};
