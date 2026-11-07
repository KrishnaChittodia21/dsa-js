struct UnionFind {
    vector<int> parent, sz;
    int count;

    UnionFind(int n) : parent(n), sz(n, 1), count(n) {
        iota(parent.begin(), parent.end(), 0);
    }

    int find(int x) {
        while (parent[x] != x) {
            parent[x] = parent[parent[x]]; // path halving
            x = parent[x];
        }
        return x;
    }

    bool unite(int a, int b) {
        int ra = find(a), rb = find(b);
        if (ra == rb) return false;
        if (sz[ra] < sz[rb]) swap(ra, rb);
        parent[rb] = ra;
        sz[ra] += sz[rb];
        count--;
        return true;
    }

    bool connected(int a, int b) {
        return find(a) == find(b);
    }
};

class Solution {
public:
    vector<vector<string>> accountsMerge(vector<vector<string>>& accounts) {
        UnionFind uf(accounts.size());
        unordered_map<string, int> owner;            // email -> first account index

        for (int i = 0; i < (int)accounts.size(); i++) {
            for (int k = 1; k < (int)accounts[i].size(); k++) {
                auto it = owner.find(accounts[i][k]);
                if (it != owner.end()) uf.unite(i, it->second);
                else owner[accounts[i][k]] = i;
            }
        }

        unordered_map<int, vector<string>> groups;   // root account -> emails
        for (auto& [email, i] : owner) groups[uf.find(i)].push_back(email);

        vector<vector<string>> result;
        for (auto& [r, emails] : groups) {
            sort(emails.begin(), emails.end());      // plain string order, as required
            vector<string> row{accounts[r][0]};
            row.insert(row.end(), emails.begin(), emails.end());
            result.push_back(row);
        }
        return result;
    }
};
