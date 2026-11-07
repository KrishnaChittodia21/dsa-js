class Solution {
    unordered_map<string, string> parent;
    unordered_map<string, double> weight;            // weight[x] = x / parent[x]

    void add(const string& x) {
        if (!parent.count(x)) {
            parent[x] = x;
            weight[x] = 1.0;
        }
    }

    string find(const string& x) {
        string p = parent[x];
        if (p != x) {
            string root = find(p);                   // compresses p; weight[p] = p / root
            weight[x] *= weight[p];
            parent[x] = root;
        }
        return parent[x];
    }

    void unite(const string& a, const string& b, double k) { // a / b = k
        string ra = find(a), rb = find(b);
        if (ra == rb) return;
        parent[ra] = rb;
        weight[ra] = k * weight[b] / weight[a];
    }

public:
    vector<double> calcEquation(vector<vector<string>>& equations, vector<double>& values, vector<vector<string>>& queries) {
        parent.clear(); weight.clear();
        for (int i = 0; i < (int)equations.size(); i++) {
            add(equations[i][0]);
            add(equations[i][1]);
            unite(equations[i][0], equations[i][1], values[i]);
        }

        vector<double> ans;
        for (auto& q : queries) {
            const string &c = q[0], &d = q[1];
            if (!parent.count(c) || !parent.count(d) || find(c) != find(d)) ans.push_back(-1.0);
            else ans.push_back(weight[c] / weight[d]);
        }
        return ans;
    }
};
