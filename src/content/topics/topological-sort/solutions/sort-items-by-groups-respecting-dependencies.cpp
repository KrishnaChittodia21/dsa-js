class Solution {
public:
    vector<int> sortItems(int n, int m, vector<int>& group, vector<vector<int>>& beforeItems) {
        // 0. every ungrouped item gets its own new group
        vector<int> g = group;
        int groupCount = m;
        for (int i = 0; i < n; i++) if (g[i] == -1) g[i] = groupCount++;

        // 1. build item graph and group graph
        vector<vector<int>> itemAdj(n), groupAdj(groupCount);
        vector<int> itemIn(n, 0), groupIn(groupCount, 0);
        for (int i = 0; i < n; i++) {
            for (int b : beforeItems[i]) {
                itemAdj[b].push_back(i); itemIn[i]++;
                if (g[b] != g[i]) { groupAdj[g[b]].push_back(g[i]); groupIn[g[i]]++; }
            }
        }

        // 2. two topological sorts
        vector<int> itemOrder, groupOrder;
        if (!topo(n, itemAdj, itemIn, itemOrder) || !topo(groupCount, groupAdj, groupIn, groupOrder)) return {};

        // 3. bucket items by group (keeps item order), then concatenate buckets in group order
        vector<vector<int>> buckets(groupCount);
        for (int item : itemOrder) buckets[g[item]].push_back(item);
        vector<int> result;
        for (int grp : groupOrder) for (int item : buckets[grp]) result.push_back(item);
        return result;
    }

private:
    // generic Kahn over vertices 0..size-1; false on a cycle
    bool topo(int size, vector<vector<int>>& adj, vector<int>& indeg, vector<int>& order) {
        for (int v = 0; v < size; v++) if (indeg[v] == 0) order.push_back(v);
        for (size_t head = 0; head < order.size(); head++) {
            for (int w : adj[order[head]]) if (--indeg[w] == 0) order.push_back(w);
        }
        return (int)order.size() == size;
    }
};
