class Solution {
public:
    int findCheapestPrice(int n, vector<vector<int>>& flights, int src, int dst, int k) {
        const int INF = INT_MAX / 2;               // INF + price never overflows
        vector<int> price(n, INF);
        price[src] = 0;

        // round i allows one more flight; k stops = k + 1 flights
        for (int round = 0; round <= k; round++) {
            vector<int> next = price;              // read only last round's prices
            for (auto& f : flights) {
                int u = f[0], v = f[1], w = f[2];
                if (price[u] + w < next[v]) next[v] = price[u] + w;
            }
            price = next;
        }
        return price[dst] == INF ? -1 : price[dst];
    }
};
