class Solution {
    public int findCheapestPrice(int n, int[][] flights, int src, int dst, int k) {
        final int INF = Integer.MAX_VALUE / 2;     // INF + price never overflows
        int[] price = new int[n];
        Arrays.fill(price, INF);
        price[src] = 0;

        // round i allows one more flight; k stops = k + 1 flights
        for (int round = 0; round <= k; round++) {
            int[] next = price.clone();            // read only last round's prices
            for (int[] f : flights) {
                int u = f[0], v = f[1], w = f[2];
                if (price[u] + w < next[v]) next[v] = price[u] + w;
            }
            price = next;
        }
        return price[dst] == INF ? -1 : price[dst];
    }
}
