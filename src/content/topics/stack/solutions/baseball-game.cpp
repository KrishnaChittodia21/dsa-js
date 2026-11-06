class Solution {
public:
    int calPoints(vector<string>& ops) {
        vector<int> st;
        for (const string& op : ops) {
            int n = st.size();
            if (op == "+") st.push_back(st[n - 1] + st[n - 2]);
            else if (op == "D") st.push_back(2 * st[n - 1]);
            else if (op == "C") st.pop_back();
            else st.push_back(stoi(op));
        }
        int sum = 0;
        for (int x : st) sum += x;
        return sum;
    }
};
